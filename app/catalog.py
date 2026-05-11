from __future__ import annotations

from typing import Any

from .catalog_wb2 import CURRICULUM_INTERVENTIONS

# Keys in `fields` are stable for stored `responses` JSON.
INTERVENTION_CATALOG: list[dict[str, Any]] = [
    {
        "id": "gratitude",
        "title": "Gratitude",
        "summary": "Notice small things that helped you today. Even tiny ones count.",
        "category": "core",
        "duration_approx": "About 8 minutes",
        "fields": [
            {
                "key": "g1",
                "label": "One thing you are thankful for",
                "hint": "Anything that helped, even a little.",
                "placeholder": "A person, food, song, or moment.",
            },
            {
                "key": "g2",
                "label": "A second thing",
                "hint": "Easy things to miss are okay.",
                "placeholder": "Maybe a friend, the weather, or a small win.",
            },
            {
                "key": "g3",
                "label": "A third thing",
                "hint": "Simple is fine — food, rest, a kind text.",
                "placeholder": "Anything that made today a bit better.",
            },
            {
                "key": "g_action",
                "label": "One small step for tomorrow",
                "hint": "One short sentence.",
                "placeholder": "Something easy you can really do.",
            },
        ],
    },
    {
        "id": "best_possible_self",
        "title": "Best future self",
        "summary": (
            "Picture your life going really well. Write what you see, then turn it into small steps. "
            "Just keep writing — do not worry about grammar."
        ),
        "category": "core",
        "duration_approx": "About 12 minutes",
        "fields": [
            {
                "key": "bps_king_109",
                "label": "Step 1 — about 5 minutes",
                "placeholder": "Keep writing. Do not stop to fix words.",
                "hint": (
                    "Imagine you are 109 years old. Everything has gone as well as you hoped. "
                    "You worked hard and reached your goals. Write what your life looks like."
                ),
            },
            {
                "key": "bps_king_time_machine",
                "label": "Step 2 — about 5 minutes",
                "placeholder": "Let the words come. No editing.",
                "hint": (
                    "Now picture your 109-year-old self in a time machine. They visit you today. "
                    "They sit beside you and give you advice. What do they say?"
                ),
            },
            {
                "key": "bps_king_actions",
                "label": "Step 3 — about 2 minutes",
                "placeholder": "Bullet points are fine.",
                "hint": "From their advice, pick the top 3 things to remember every day.",
            },
        ],
    },
    {
        "id": "cognitive_reframing",
        "title": "Cognitive reframing",
        "summary": "Slow down a worry. Look at it again. Find a kinder, true way to see it.",
        "category": "core",
        "duration_approx": "About 8 minutes",
        "fields": [
            {
                "key": "cr_hot",
                "label": "💭 The worry\n(What is the exact thought?)",
                "hint": "Messy is fine.",
                "placeholder": "Write the thought just like it sounds in your head.",
            },
            {
                "key": "cr_evidence_for",
                "label": "🔍 Facts that support it",
                "hint": "Only real facts. It is okay if there are not many.",
                "placeholder": "What makes this thought feel true?",
            },
            {
                "key": "cr_evidence_against",
                "label": "⚖️ Facts that go against it",
                "hint": "Times it went okay, your skills, or help you have.",
                "placeholder": "What does not fully fit this thought?",
            },
            {
                "key": "cr_balanced",
                "label": "🌱 A kinder, balanced view",
                "hint": "Try using \"and\" or \"but\" to hold both sides.",
                "placeholder": "Write a calmer version that still feels true.",
            },
        ],
    },
    {
        "id": "savoring",
        "title": "Savoring",
        "summary": "Pick one good moment. Stay with it for a minute. Notice it before it passes.",
        "category": "core",
        "duration_approx": "About 6 minutes",
        "fields": [
            {
                "key": "sv_moment",
                "label": "One small good moment",
                "hint": "A sip, a text, a song, or light on the wall.",
                "placeholder": "What was it?",
            },
            {
                "key": "sv_senses",
                "label": "What you noticed",
                "hint": "What did you see, hear, or feel?",
                "placeholder": "Colors, sounds, warmth — any small detail.",
            },
            {
                "key": "sv_extend",
                "label": "How to make it last a little longer",
                "hint": "What could you stay with for 30 more seconds?",
                "placeholder": "One thing to slow down on next time.",
            },
        ],
    },
    {
        "id": "breathing_grounding",
        "title": "Breathing & grounding",
        "summary": "Calm your body first. Thoughts get easier after.",
        "category": "core",
        "duration_approx": "About 5 minutes",
        "session_type": "breathing",
        "video_id": "-G89S77iJm8",
        "phase_label": "Inhale 4 · exhale 6",
        "fields": [],
    },
    {
        "id": "meditation",
        "title": "Meditation",
        "summary": "Sit. Breathe. Let thoughts pass like clouds.",
        "category": "core",
        "duration_approx": "About 10 minutes",
        "session_type": "meditation",
        "video_id": "x0nZ1ZLephQ",
        "phase_label": "Notice. Let go. Return.",
        "fields": [],
    },
] + CURRICULUM_INTERVENTIONS


def catalog_by_id(intervention_id: str) -> dict[str, Any] | None:
    for item in INTERVENTION_CATALOG:
        if item["id"] == intervention_id:
            return item
    return None
