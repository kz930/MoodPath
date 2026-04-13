from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


EmotionName = Literal["anxiety", "sadness", "joy", "emptiness", "anger", "calm", "mixed"]
TrendName = Literal["improving", "stable", "worsening", "fluctuating"]

# Recommended by in-app agents (rule-based); users may still choose any curriculum exercise.
CoreInterventionType = Literal[
    "gratitude",
    "best_possible_self",
    "cognitive_reframing",
    "savoring",
    "breathing_grounding",
]

# Evidence-based / positive psychology curriculum (Authentic Happiness, Seligman, Snyder, etc.).
CurriculumInterventionType = Literal[
    "perma_baseline_authentic_happiness",
    "gratitude_letter_wb2",
    "savoring_homework_wb2",
    "three_good_things_wb2",
    "best_future_self_109_king",
    "hope_plan_wb2",
    "optimism_style_self_report_wb2",
    "best_possible_self_expanded_wb2",
    "awe_walk_wb2",
    "nature_challenge_30x30_wb2",
]

InterventionType = CoreInterventionType | CurriculumInterventionType
RiskLevel = Literal["low", "moderate", "high"]


class CheckinInput(BaseModel):
    journal_text: str = ""
    mood_tags: list[str] = Field(default_factory=list)
    sleep_hours: float = 0.0
    energy_score: int = Field(ge=1, le=10)
    stress_score: int = Field(ge=1, le=10)


class DailyScore(BaseModel):
    date: date
    mood_valence: float = Field(ge=-1.0, le=1.0)
    stress: int = Field(ge=1, le=10)
    sleep: float = Field(ge=0.0, le=24.0)


class InterventionHistoryItem(BaseModel):
    type: InterventionType
    date: date
    completed: bool
    helpfulness: int = Field(ge=1, le=5)


class HistoryWindow(BaseModel):
    days: int = Field(default=14, ge=1, le=30)
    daily_scores: list[DailyScore] = Field(default_factory=list)
    recent_interventions: list[InterventionHistoryItem] = Field(default_factory=list)


class UserPreferences(BaseModel):
    exercise_length_min: int = Field(default=8, ge=5, le=20)
    tone: str = "warm"
    disliked_types: list[str] = Field(default_factory=list)


class UserProfile(BaseModel):
    goals: list[str] = Field(default_factory=list)
    preferences: UserPreferences = Field(default_factory=UserPreferences)


class UserState(BaseModel):
    user_id: str
    date: date
    locale: str = "zh-CN"
    checkin: CheckinInput
    history_window: HistoryWindow = Field(default_factory=HistoryWindow)
    user_profile: UserProfile = Field(default_factory=UserProfile)


class EmotionOutput(BaseModel):
    primary_emotion: EmotionName
    secondary_emotion: str | None = None
    valence: float = Field(ge=-1.0, le=1.0)
    arousal: float = Field(ge=0.0, le=1.0)
    intensity: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: list[str] = Field(default_factory=list)


class PatternOutput(BaseModel):
    trend: TrendName
    patterns: list[str] = Field(default_factory=list)
    triggers: list[str] = Field(default_factory=list)
    risk_signals: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class InterventionOutput(BaseModel):
    selected_intervention: CoreInterventionType
    reason: str
    evidence: list[str] = Field(default_factory=list)
    duration_min: int = Field(ge=5, le=12)
    steps: list[str] = Field(default_factory=list)
    fallback: str


class ReflectionInput(BaseModel):
    user_id: str
    date: date
    intervention_type: InterventionType
    completed: bool
    helpfulness: int = Field(ge=1, le=5)
    notes: str = ""
    responses: dict[str, str] = Field(default_factory=dict)


class UserPublic(BaseModel):
    user_id: str
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterBody(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=128)


class LoginBody(BaseModel):
    username: str
    password: str


class PracticeSubmitBody(BaseModel):
    date: date
    intervention_type: InterventionType
    completed: bool
    helpfulness: int = Field(ge=1, le=5)
    notes: str = ""
    responses: dict[str, str] = Field(default_factory=dict)


class JournalEntryOut(BaseModel):
    date: date
    journal_text: str
    mood_tags: list[str]
    sleep_hours: float
    energy_score: int
    stress_score: int


class JournalPageResponse(BaseModel):
    page: int
    per_page: int
    total: int
    items: list[JournalEntryOut]


class PracticeRecordOut(BaseModel):
    date: date
    intervention_type: InterventionType
    completed: bool
    helpfulness: int
    notes: str
    responses: dict[str, str]


class PracticesByDateResponse(BaseModel):
    date: date
    practices: list[PracticeRecordOut]


class PracticeDatesResponse(BaseModel):
    dates: list[date]


class ReflectionOutput(BaseModel):
    personalized_feedback: str
    reflection_prompts: list[str]
    next_micro_action: str


class RiskOutput(BaseModel):
    risk_level: RiskLevel
    risk_reasons: list[str]
    safe_response: str
    resource_suggestions: list[str]


class AnalyzeResponse(BaseModel):
    emotion: EmotionOutput
    pattern: PatternOutput
    risk: RiskOutput


class DailyPlanResponse(BaseModel):
    emotion: EmotionOutput
    pattern: PatternOutput
    intervention: InterventionOutput
    risk: RiskOutput

