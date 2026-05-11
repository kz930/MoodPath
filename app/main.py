from __future__ import annotations

import os
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import httpx


# Load .env (project root) into os.environ before anything reads keys.
def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


_load_dotenv()
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

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
    return FileResponse(WEB_DIR / "Moodpath.html")


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
    store.save_reflection(payload, upsert=body.upsert)
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


# ─── AI chat companion (OpenAI-backed) ──────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatDayContext(BaseModel):
    date: str | None = None
    mood: int | None = None
    stress: int | None = None
    energy: int | None = None


class ChatBody(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
    recent_days: list[ChatDayContext] = Field(default_factory=list)


CHAT_MODEL = os.environ.get("MOODPATH_CHAT_MODEL", "gpt-4o-mini")

CHAT_SYSTEM_BASE = (
    "You are a warm, gentle companion inside the MoodPath journaling app. "
    "You are NOT a therapist, and you must say so if asked. "
    "Keep replies short (2-4 sentences). Use simple, kind language at about a 7th-grade reading level. "
    "Do not give medical or crisis advice. If the user mentions self-harm or suicide, "
    "gently encourage them to reach 988 (US Suicide & Crisis Lifeline) or text HOME to 741741. "
    "Avoid lists unless the user asks for them. Never lecture. Never start with 'It sounds like…'."
)

# Three modes — chosen at runtime based on the user's recent mood/stress.
CHAT_MODE_REFRAME = (
    "MODE: ACTIVE REFRAMER. The user's recent days show high stress or low mood, so they likely "
    "need help untangling a sticky thought. Pattern for each reply: "
    "(1) name the feeling in one short sentence so they feel heard, "
    "(2) ask ONE small Socratic question that opens up the thought (e.g. 'what's one piece of "
    "evidence that doesn't fit?' or 'has there been a time it went differently?'), or offer ONE "
    "balanced reframe in plain words. "
    "Pick ONE move, not both. Keep it short. Be a kind sparring partner, not a coach with a script."
)
CHAT_MODE_GENTLE = (
    "MODE: GENTLE LISTENER. The user's recent days look mixed or neutral. "
    "Mostly listen and reflect feelings back. Validate first. "
    "Only offer a reframe or a tiny next step if they explicitly ask, or if a worry sounds clearly "
    "stuck. Otherwise let them lead — short questions like 'what's that like for you?' are great."
)
CHAT_MODE_SAVOR = (
    "MODE: SAVOR & BUILD. The user's recent days look pretty good. "
    "Help them notice and stay with what's working. Ask what they want more of, or what a small "
    "next step would be to keep this going. Don't manufacture worry. "
    "Stay warm and curious, not sappy."
)


def _pick_chat_mode(recent: list["ChatDayContext"]) -> str:
    """Return one of REFRAME / GENTLE / SAVOR based on recent mood and stress."""
    if not recent:
        return CHAT_MODE_GENTLE
    valid_stress = [d.stress for d in recent if d.stress is not None]
    valid_mood = [d.mood for d in recent if d.mood is not None]
    latest = recent[-1]
    avg_stress = sum(valid_stress) / len(valid_stress) if valid_stress else None
    avg_mood = sum(valid_mood) / len(valid_mood) if valid_mood else None
    latest_stress = latest.stress
    latest_mood = latest.mood

    high_stress = (latest_stress is not None and latest_stress >= 7) or (
        avg_stress is not None and avg_stress >= 6
    )
    low_mood = (latest_mood is not None and latest_mood <= 2) or (
        avg_mood is not None and avg_mood <= 2.5
    )
    good_mood = (latest_mood is not None and latest_mood >= 4) or (
        avg_mood is not None and avg_mood >= 4
    )

    if high_stress or low_mood:
        return CHAT_MODE_REFRAME
    if good_mood and not high_stress:
        return CHAT_MODE_SAVOR
    return CHAT_MODE_GENTLE


def _format_context(recent: list[ChatDayContext]) -> str:
    if not recent:
        return ""
    parts = []
    for d in recent[-7:]:
        bits = []
        if d.mood is not None:
            label = {1: "rough", 2: "meh", 3: "okay", 4: "good", 5: "great"}.get(int(d.mood), "")
            bits.append(f"mood {d.mood}/5 ({label})" if label else f"mood {d.mood}/5")
        if d.stress is not None:
            bits.append(f"stress {d.stress}/10")
        if d.energy is not None:
            bits.append(f"energy {d.energy}/10")
        if bits:
            parts.append(f"- {d.date or '?'}: {', '.join(bits)}")
    if not parts:
        return ""
    return "Recent context (most recent last):\n" + "\n".join(parts)


class AnalyzeWritingBody(BaseModel):
    samples: list[str] = Field(default_factory=list)


WRITING_ANALYSIS_SYSTEM = (
    "You are a positive-psychology writing analyst inside the MoodPath app. "
    "You will be given 1–2 short writing samples from the user. "
    "Write a short, kind analysis (about 200 words total) at a 7th-grade reading level. "
    "Cover: (1) the most common WORD CATEGORIES you notice (e.g. positive emotion words, "
    "negative emotion words, social words, achievement, time, body, etc.), "
    "(2) any recurring THEMES (e.g. growth, regret, connection, control, meaning), "
    "(3) one observation about what the writing might suggest about the writer's well-being right now, "
    "and (4) one gentle question they could ask themselves. "
    "Be concrete and specific to their actual words. Do NOT diagnose. "
    "Use simple, kind language. Keep it short."
)


@app.post("/analyze-writing")
async def analyze_writing(body: AnalyzeWritingBody, uid: str = Depends(get_current_user_id)) -> dict[str, str]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="analyze_unavailable: OPENAI_API_KEY not set")
    samples = [s.strip() for s in body.samples if s and s.strip()]
    if not samples:
        raise HTTPException(status_code=400, detail="no_samples: paste at least one writing sample")

    user_payload = "\n\n---\n\n".join(
        f"Sample {i + 1}:\n{s[:4000]}" for i, s in enumerate(samples[:2])
    )

    payload: dict[str, Any] = {
        "model": CHAT_MODEL,
        "messages": [
            {"role": "system", "content": WRITING_ANALYSIS_SYSTEM},
            {"role": "user", "content": user_payload},
        ],
        "temperature": 0.5,
        "max_tokens": 500,
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"openai_unreachable: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"openai_error: {r.status_code} {r.text[:200]}")

    data = r.json()
    analysis = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
    if not analysis:
        analysis = "i couldn't read enough in those samples — try pasting longer pieces."
    return {"analysis": analysis}


@app.post("/chat")
async def chat(body: ChatBody, uid: str = Depends(get_current_user_id)) -> dict[str, str]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="chat_unavailable: OPENAI_API_KEY not set")

    mode = _pick_chat_mode(body.recent_days)
    messages: list[dict[str, str]] = [
        {"role": "system", "content": CHAT_SYSTEM_BASE},
        {"role": "system", "content": mode},
    ]
    ctx = _format_context(body.recent_days)
    if ctx:
        messages.append({"role": "system", "content": ctx})
    for m in body.messages[-20:]:  # cap history
        if m.role in ("user", "assistant"):
            messages.append({"role": m.role, "content": m.content[:2000]})

    payload: dict[str, Any] = {
        "model": CHAT_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 280,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"openai_unreachable: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"openai_error: {r.status_code} {r.text[:200]}")

    data = r.json()
    reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
    if not reply:
        reply = "i'm here. tell me a bit more."
    return {"reply": reply}


app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")
