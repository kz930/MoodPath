from __future__ import annotations

from .agents import run_emotion_agent, run_intervention_agent, run_pattern_agent, run_risk_agent
from .schemas import AnalyzeResponse, DailyPlanResponse, UserState


def run_analyze_pipeline(user_state: UserState) -> AnalyzeResponse:
    emotion = run_emotion_agent(user_state.checkin)
    history_stress = [x.stress for x in user_state.history_window.daily_scores]
    history_sleep = [x.sleep for x in user_state.history_window.daily_scores]
    pattern = run_pattern_agent(emotion, history_stress, history_sleep)
    risk = run_risk_agent(pattern, user_state.checkin.stress_score, user_state.checkin.sleep_hours)
    return AnalyzeResponse(emotion=emotion, pattern=pattern, risk=risk)


def run_daily_plan_pipeline(user_state: UserState) -> DailyPlanResponse:
    analyze = run_analyze_pipeline(user_state)
    recent_types = [x.type for x in user_state.history_window.recent_interventions]
    intervention = run_intervention_agent(analyze.emotion, analyze.pattern, user_state.user_profile, recent_types)
    return DailyPlanResponse(
        emotion=analyze.emotion,
        pattern=analyze.pattern,
        intervention=intervention,
        risk=analyze.risk,
    )
