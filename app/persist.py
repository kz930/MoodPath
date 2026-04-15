"""Optional JSON persistence so dev server reloads keep accounts and check-ins."""

from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path

from pydantic import TypeAdapter

from .schemas import CheckinInput, ReflectionInput, UserProfile

DATA_PATH = Path(
    os.environ.get(
        "MINDPATH_DATA",
        str(Path(__file__).resolve().parent.parent / "data" / "mindpath_store.json"),
    )
)


def _serialize_store(store: object) -> dict:
    from .storage import InMemoryStore

    if not isinstance(store, InMemoryStore):
        raise TypeError("expected InMemoryStore")

    users = {
        uid: {"username": rec.username, "password_hash": rec.password_hash}
        for uid, rec in store.users_by_id.items()
    }
    checkins_out: dict[str, dict[str, dict]] = {}
    for uid, by_date in store.checkins.items():
        checkins_out[uid] = {d.isoformat(): c.model_dump(mode="json") for d, c in by_date.items()}

    reflections_out: dict[str, list[dict]] = {}
    for uid, rows in store.reflections.items():
        reflections_out[uid] = [r.model_dump(mode="json") for r in rows]

    profiles_out: dict[str, dict] = {
        uid: p.model_dump(mode="json") for uid, p in store.profiles.items()
    }

    return {
        "users_by_id": users,
        "username_to_id": dict(store.username_to_id),
        "checkins": checkins_out,
        "reflections": reflections_out,
        "profiles": profiles_out,
    }


def save_store(store: object) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = _serialize_store(store)
    tmp = DATA_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(DATA_PATH)


def load_into_store(store: object) -> None:
    from .storage import InMemoryStore, UserRecord

    if not isinstance(store, InMemoryStore):
        raise TypeError("expected InMemoryStore")
    if not DATA_PATH.is_file():
        return
    try:
        raw = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return

    users = raw.get("users_by_id") or {}
    for uid, u in users.items():
        store.users_by_id[uid] = UserRecord(
            user_id=uid,
            username=u["username"],
            password_hash=u["password_hash"],
        )
    store.username_to_id.update(raw.get("username_to_id") or {})

    ta_ci = TypeAdapter(CheckinInput)
    for uid, by_iso in (raw.get("checkins") or {}).items():
        for iso, cdict in by_iso.items():
            store.checkins[uid][date.fromisoformat(iso)] = ta_ci.validate_python(cdict)

    ta_r = TypeAdapter(ReflectionInput)
    for uid, rows in (raw.get("reflections") or {}).items():
        store.reflections[uid] = [ta_r.validate_python(r) for r in rows]

    ta_p = TypeAdapter(UserProfile)
    for uid, pdict in (raw.get("profiles") or {}).items():
        store.profiles[uid] = ta_p.validate_python(pdict)
