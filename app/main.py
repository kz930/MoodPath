from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .agents import run_intervention_agent
from .auth import create_access_token, get_current_user_id, hash_password, new_user_id, verify_password
from .catalog import INTERVENTION_CATALOG
from .orchestrator import run_analyze_pipeline, run_daily_plan_pipeline
from .schemas import (
    AnalyzeResponse,
    CheckinInput,
    DailyPlanResponse,
    InterventionOutput,
    JournalPageResponse,
    JournalEntryOut,
    LoginBody,
    PracticeDatesResponse,
    PracticeRecordOut,
    PracticesByDateResponse,
    PracticeSubmitBody,
    ReflectionInput,
    ReflectionOutput,
    RegisterBody,
    TokenResponse,
    UserProfile,
    UserPublic,
    UserState,
)
from .storage import store

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"

app = FastAPI(title="MindPath MVP API", version="0.2.0")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "MindPath MVP API",
        "ui": "/ui",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


@app.get("/ui")
def ui() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/register", response_model=TokenResponse)
def auth_register(body: RegisterBody) -> TokenResponse:
    if store.get_user_by_username(body.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    uid = new_user_id()
    try:
        rec = store.register_user(uid, body.username, hash_password(body.password))
    except ValueError as e:
        if str(e) == "username_taken":
            raise HTTPException(status_code=400, detail="Username already registered") from e
        raise
    token = create_access_token(user_id=rec.user_id, username=rec.username)
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def auth_login(body: LoginBody) -> TokenResponse:
    rec = store.get_user_by_username(body.username)
    if not rec or not verify_password(body.password, rec.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user_id=rec.user_id, username=rec.username)
    return TokenResponse(access_token=token)


@app.get("/auth/me", response_model=UserPublic)
def auth_me(uid: str = Depends(get_current_user_id)) -> UserPublic:
    u = store.get_user(uid)
    if not u:
        raise HTTPException(status_code=401, detail="User not found")
    return UserPublic(user_id=u.user_id, username=u.username)


@app.get("/interventions/catalog")
def interventions_catalog() -> dict:
    return {"items": INTERVENTION_CATALOG}


@app.post("/checkin")
def create_checkin(
    target_date: date,
    payload: CheckinInput,
    uid: str = Depends(get_current_user_id),
) -> dict[str, str]:
    store.save_checkin(uid, target_date, payload)
    return {"message": "checkin_saved"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(user_state: UserState, uid: str = Depends(get_current_user_id)) -> AnalyzeResponse:
    user_state = user_state.model_copy(update={"user_id": uid})
    result = run_analyze_pipeline(user_state)
    store.save_analysis(user_state.user_id, user_state.date, result)
    store.upsert_profile(user_state.user_id, user_state.user_profile)
    return result


@app.post("/intervention/recommend", response_model=InterventionOutput)
def recommend(user_state: UserState, uid: str = Depends(get_current_user_id)) -> InterventionOutput:
    user_state = user_state.model_copy(update={"user_id": uid})
    recent_types = [x.type for x in user_state.history_window.recent_interventions]
    analysis = run_analyze_pipeline(user_state)
    result = run_intervention_agent(analysis.emotion, analysis.pattern, user_state.user_profile, recent_types)
    store.save_recommendation(user_state.user_id, user_state.date, result)
    return result


@app.post("/practice/submit", response_model=ReflectionOutput)
def practice_submit(body: PracticeSubmitBody, uid: str = Depends(get_current_user_id)) -> ReflectionOutput:
    payload = ReflectionInput(
        user_id=uid,
        date=body.date,
        intervention_type=body.intervention_type,
        completed=body.completed,
        helpfulness=body.helpfulness,
        notes=body.notes,
        responses=body.responses,
    )
    store.save_reflection(payload)
    if body.completed:
        feedback = "Nice — you showed up for the practice. That kind of repetition is what actually changes things."
    else:
        feedback = "Partial counts. Try a two-minute version next time instead of skipping."

    prompts = [
        "Which step helped most, if any?",
        "Did your body or mood shift at all?",
        "What's one tiny thing you'd repeat tomorrow?",
    ]
    return ReflectionOutput(
        personalized_feedback=feedback,
        reflection_prompts=prompts,
        next_micro_action="Same time tomorrow, three minutes — same exercise or a shorter pass.",
    )


@app.get("/timeline")
def timeline(
    days: int = Query(default=14, ge=1, le=365),
    uid: str = Depends(get_current_user_id),
) -> dict:
    user_id = uid
    checkins = store.list_checkins(user_id)
    cutoff = date.today() - timedelta(days=days - 1)
    daily = []
    for d, c in sorted(checkins.items(), key=lambda item: item[0], reverse=True):
        if d >= cutoff:
            daily.append(
                {
                    "date": d,
                    "stress_score": c.stress_score,
                    "energy_score": c.energy_score,
                    "sleep_hours": c.sleep_hours,
                    "mood_tags": c.mood_tags,
                }
            )
    return {"user_id": user_id, "days": days, "records": daily}


@app.get("/daily-plan", response_model=DailyPlanResponse)
def daily_plan(target_date: date, uid: str = Depends(get_current_user_id)) -> DailyPlanResponse:
    user_id = uid
    checkin = store.get_checkin(user_id, target_date)
    if not checkin:
        raise HTTPException(status_code=404, detail="No checkin for target_date")

    profile: UserProfile = store.get_profile(user_id)
    history_scores = []
    checkins = store.list_checkins(user_id)
    for d, c in sorted(checkins.items(), key=lambda item: item[0], reverse=True):
        if d == target_date:
            continue
        mood_valence = (c.energy_score - c.stress_score) / 10
        history_scores.append(
            {
                "date": d,
                "mood_valence": max(-1.0, min(1.0, mood_valence)),
                "stress": c.stress_score,
                "sleep": c.sleep_hours,
            }
        )
        if len(history_scores) >= 14:
            break

    reflections = store.list_reflections(user_id)
    recent_interventions = [
        {
            "type": x.intervention_type,
            "date": x.date,
            "completed": x.completed,
            "helpfulness": x.helpfulness,
        }
        for x in reflections[-8:]
    ]

    state = UserState(
        user_id=user_id,
        date=target_date,
        checkin=checkin,
        history_window={
            "days": 14,
            "daily_scores": history_scores,
            "recent_interventions": recent_interventions,
        },
        user_profile=profile,
    )
    return run_daily_plan_pipeline(state)


@app.get("/me/checkin", response_model=JournalEntryOut)
def me_checkin(
    checkin_date: date = Query(..., alias="date"),
    uid: str = Depends(get_current_user_id),
) -> JournalEntryOut:
    c = store.get_checkin(uid, checkin_date)
    if not c:
        raise HTTPException(status_code=404, detail="No checkin for date")
    return JournalEntryOut(
        date=checkin_date,
        journal_text=c.journal_text,
        mood_tags=c.mood_tags,
        sleep_hours=c.sleep_hours,
        energy_score=c.energy_score,
        stress_score=c.stress_score,
    )


@app.get("/me/journals", response_model=JournalPageResponse)
def me_journals(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=5, ge=1, le=50),
    uid: str = Depends(get_current_user_id),
) -> JournalPageResponse:
    slice_items, total = store.list_checkins_page(uid, page, per_page)
    items = [
        JournalEntryOut(
            date=d,
            journal_text=c.journal_text,
            mood_tags=c.mood_tags,
            sleep_hours=c.sleep_hours,
            energy_score=c.energy_score,
            stress_score=c.stress_score,
        )
        for d, c in slice_items
    ]
    return JournalPageResponse(page=page, per_page=per_page, total=total, items=items)


@app.get("/me/practices", response_model=PracticesByDateResponse)
def me_practices(
    practice_date: date = Query(..., alias="date"),
    uid: str = Depends(get_current_user_id),
) -> PracticesByDateResponse:
    rows = store.reflections_on_date(uid, practice_date)
    practices = [
        PracticeRecordOut(
            date=r.date,
            intervention_type=r.intervention_type,
            completed=r.completed,
            helpfulness=r.helpfulness,
            notes=r.notes,
            responses=r.responses,
        )
        for r in rows
    ]
    return PracticesByDateResponse(date=practice_date, practices=practices)


@app.get("/me/practice-dates", response_model=PracticeDatesResponse)
def me_practice_dates(uid: str = Depends(get_current_user_id)) -> PracticeDatesResponse:
    return PracticeDatesResponse(dates=store.practice_dates(uid))


app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")
