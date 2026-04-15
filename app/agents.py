from __future__ import annotations

from statistics import mean

from .schemas import (
    CheckinInput,
    CoreInterventionType,
    EmotionOutput,
    InterventionOutput,
    PatternOutput,
    RiskOutput,
    UserProfile,
)


def run_emotion_agent(checkin: CheckinInput) -> EmotionOutput:
    text = (checkin.journal_text or "").lower()
    stress = checkin.stress_score
    energy = checkin.energy_score
    sleep = checkin.sleep_hours

    anxiety_keywords = [
        "焦虑",
        "紧张",
        "压力",
        "担心",
        "anxious",
        "stress",
        "worried",
        "nervous",
        "panic",
        "overwhelm",
    ]
    sadness_keywords = [
        "难过",
        "低落",
        "无力",
        "empty",
        "空虚",
        "sad",
        "down",
        "depressed",
        "hopeless",
        "lonely",
    ]
    joy_keywords = ["开心", "兴奋", "满足", "joy", "happy", "glad", "grateful", "excited"]

    anxiety_hits = sum(1 for k in anxiety_keywords if k in text)
    sadness_hits = sum(1 for k in sadness_keywords if k in text)
    joy_hits = sum(1 for k in joy_keywords if k in text)

    if stress >= 7 or anxiety_hits > max(sadness_hits, joy_hits):
        primary = "anxiety"
    elif joy_hits > max(anxiety_hits, sadness_hits):
        primary = "joy"
    elif energy <= 4 or sleep < 6 or sadness_hits > 0:
        primary = "emptiness"
    else:
        primary = "mixed"

    valence = max(-1.0, min(1.0, (energy - stress) / 10))
    arousal = max(0.0, min(1.0, (stress / 10) + (0.1 if primary == "anxiety" else 0.0)))
    intensity = max(0.0, min(1.0, (stress + (10 - energy)) / 20))

    evidence = [f"stress={stress}", f"energy={energy}", f"sleep={sleep}"]
    if anxiety_hits:
        evidence.append("anxiety_keywords")
    if sadness_hits:
        evidence.append("sadness_keywords")
    if joy_hits:
        evidence.append("joy_keywords")

    return EmotionOutput(
        primary_emotion=primary,  # type: ignore[arg-type]
        secondary_emotion=None,
        valence=round(valence, 2),
        arousal=round(arousal, 2),
        intensity=round(intensity, 2),
        confidence=0.72,
        evidence=evidence,
    )


def run_pattern_agent(current_emotion: EmotionOutput, history_stress: list[int], history_sleep: list[float]) -> PatternOutput:
    if not history_stress:
        return PatternOutput(
            trend="stable",
            patterns=[],
            triggers=[],
            risk_signals=[],
            confidence=0.5,
        )

    avg_stress = mean(history_stress)
    avg_sleep = mean(history_sleep) if history_sleep else 7.0
    risk_signals: list[str] = []
    patterns: list[str] = []
    triggers: list[str] = []

    if avg_stress >= 7:
        patterns.append("high_stress_cluster")
        risk_signals.append("7_days_high_stress")
    if avg_sleep < 6:
        patterns.append("low_sleep_high_stress_coupling")
        triggers.append("sleep_debt")
    if current_emotion.primary_emotion == "anxiety":
        patterns.append("workday_anxiety")
        triggers.append("performance_pressure")

    if avg_stress >= 7 and current_emotion.valence < -0.3:
        trend = "worsening"
    elif avg_stress <= 4 and current_emotion.valence > 0.2:
        trend = "improving"
    else:
        trend = "fluctuating"

    return PatternOutput(
        trend=trend,  # type: ignore[arg-type]
        patterns=patterns,
        triggers=triggers,
        risk_signals=risk_signals,
        confidence=0.74,
    )


def run_intervention_agent(emotion: EmotionOutput, pattern: PatternOutput, profile: UserProfile, recent_types: list[str]) -> InterventionOutput:
    selected: CoreInterventionType = "gratitude"
    evidence = [f"emotion={emotion.primary_emotion}", f"arousal={emotion.arousal}", f"trend={pattern.trend}"]

    if "7_days_high_stress" in pattern.risk_signals:
        selected = "breathing_grounding"
    elif emotion.primary_emotion == "anxiety" and emotion.arousal > 0.65:
        selected = "cognitive_reframing"
    elif emotion.primary_emotion in ["sadness", "emptiness"] and emotion.arousal < 0.45:
        selected = "gratitude"
    elif "motivation_drop" in pattern.patterns:
        selected = "best_possible_self"
    elif "positive_moments_unnoticed" in pattern.patterns:
        selected = "savoring"

    if recent_types.count(selected) >= 2:
        selected = "best_possible_self" if selected != "best_possible_self" else "savoring"

    if selected in profile.preferences.disliked_types:
        selected = "breathing_grounding"

    steps_map = {
        "gratitude": [
            "Write three things you're grateful for today",
            "Say briefly why they matter",
            "Pick one and set a tiny follow-up for tomorrow",
        ],
        "best_possible_self": [
            "About 5 min: write your life at 109 if everything went as well as possible (no self-editing)",
            "About 5 min: that 109-year-old self sits with you—what do they say?",
            "About 2 min: list action points; focus on your top three day to day",
        ],
        "cognitive_reframing": [
            "Write the worry thought verbatim",
            "List evidence for and against",
            "Try one more balanced sentence",
        ],
        "savoring": [
            "Recall one small positive moment",
            "Add sensory detail",
            "Note how you could make it last 30 seconds longer",
        ],
        "breathing_grounding": [
            "Breathe in 4, hold 2, out 6 — about six rounds",
            "Notice shoulders and jaw",
            "Rate tension before and after",
        ],
    }

    reason = {
        "gratitude": "Low-arousal low mood fits a quick gratitude shift toward what's already there.",
        "best_possible_self": "You may need direction and hope more than analysis right now.",
        "cognitive_reframing": "High anxiety and arousal — reframe catastrophic thoughts first.",
        "savoring": "Positive moments may be there but easy to miss — savoring helps you keep them.",
        "breathing_grounding": "Stress signals are high — settle the body before heavy thinking.",
    }[selected]

    preferred = profile.preferences.exercise_length_min
    duration = min(12, max(5, preferred))

    return InterventionOutput(
        selected_intervention=selected,
        reason=reason,
        evidence=evidence,
        duration_min=duration,
        steps=steps_map[selected],
        fallback="box_breathing_3min",
    )


def run_risk_agent(pattern: PatternOutput, stress_score: int, sleep_hours: float) -> RiskOutput:
    reasons: list[str] = []
    level: str = "low"
    if stress_score >= 8:
        reasons.append("high_daily_stress")
    if sleep_hours < 5.5:
        reasons.append("insufficient_sleep")
    reasons.extend(pattern.risk_signals)

    if len(reasons) >= 3:
        level = "high"
    elif reasons:
        level = "moderate"

    response_map = {
        "low": "Ups and downs are normal. Steady sleep and small daily practices still help.",
        "moderate": "Sounds like a heavy stretch. If this keeps up, talking to someone you trust or a professional can help.",
        "high": "You’re showing several strain signals. Please prioritize rest and safety, and consider reaching out for professional support soon.",
    }

    return RiskOutput(
        risk_level=level,  # type: ignore[arg-type]
        risk_reasons=reasons,
        safe_response=response_map[level],
        resource_suggestions=[
            "Campus counseling",
            "Local crisis / mental health line",
            "A trusted friend or family member",
        ],
    )
