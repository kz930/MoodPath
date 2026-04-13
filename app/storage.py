from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date

from .schemas import (
    AnalyzeResponse,
    CheckinInput,
    InterventionOutput,
    ReflectionInput,
    UserProfile,
)


@dataclass(frozen=True)
class UserRecord:
    user_id: str
    username: str
    password_hash: str


class InMemoryStore:
    def __init__(self) -> None:
        self.checkins: dict[str, dict[date, CheckinInput]] = defaultdict(dict)
        self.analysis: dict[str, dict[date, AnalyzeResponse]] = defaultdict(dict)
        self.recommendations: dict[str, dict[date, InterventionOutput]] = defaultdict(dict)
        self.reflections: dict[str, list[ReflectionInput]] = defaultdict(list)
        self.profiles: dict[str, UserProfile] = {}
        self.users_by_id: dict[str, UserRecord] = {}
        self.username_to_id: dict[str, str] = {}

    def register_user(self, user_id: str, username: str, password_hash: str) -> UserRecord:
        key = username.strip().lower()
        if key in self.username_to_id:
            raise ValueError("username_taken")
        rec = UserRecord(user_id=user_id, username=username.strip(), password_hash=password_hash)
        self.users_by_id[user_id] = rec
        self.username_to_id[key] = user_id
        return rec

    def get_user(self, user_id: str) -> UserRecord | None:
        return self.users_by_id.get(user_id)

    def get_user_by_username(self, username: str) -> UserRecord | None:
        uid = self.username_to_id.get(username.strip().lower())
        if not uid:
            return None
        return self.users_by_id.get(uid)

    def save_checkin(self, user_id: str, target_date: date, checkin: CheckinInput) -> None:
        self.checkins[user_id][target_date] = checkin

    def get_checkin(self, user_id: str, target_date: date) -> CheckinInput | None:
        return self.checkins[user_id].get(target_date)

    def list_checkins(self, user_id: str) -> dict[date, CheckinInput]:
        return self.checkins[user_id]

    def list_checkins_page(
        self, user_id: str, page: int, per_page: int
    ) -> tuple[list[tuple[date, CheckinInput]], int]:
        items = sorted(self.checkins[user_id].items(), key=lambda x: x[0], reverse=True)
        total = len(items)
        start = (page - 1) * per_page
        slice_items = items[start : start + per_page]
        return slice_items, total

    def save_analysis(self, user_id: str, target_date: date, response: AnalyzeResponse) -> None:
        self.analysis[user_id][target_date] = response

    def get_analysis(self, user_id: str, target_date: date) -> AnalyzeResponse | None:
        return self.analysis[user_id].get(target_date)

    def save_recommendation(self, user_id: str, target_date: date, response: InterventionOutput) -> None:
        self.recommendations[user_id][target_date] = response

    def get_recommendation(self, user_id: str, target_date: date) -> InterventionOutput | None:
        return self.recommendations[user_id].get(target_date)

    def save_reflection(self, payload: ReflectionInput) -> None:
        self.reflections[payload.user_id].append(payload)

    def list_reflections(self, user_id: str) -> list[ReflectionInput]:
        return self.reflections[user_id]

    def reflections_on_date(self, user_id: str, d: date) -> list[ReflectionInput]:
        return [r for r in self.reflections[user_id] if r.date == d]

    def practice_dates(self, user_id: str) -> list[date]:
        return sorted({r.date for r in self.reflections[user_id]}, reverse=True)

    def upsert_profile(self, user_id: str, profile: UserProfile) -> None:
        self.profiles[user_id] = profile

    def get_profile(self, user_id: str) -> UserProfile:
        return self.profiles.get(user_id, UserProfile())


store = InMemoryStore()
