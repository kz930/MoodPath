from __future__ import annotations

from typing import Any

from .catalog_wb2 import CURRICULUM_INTERVENTIONS

# Keys in `fields` are stable for stored `responses` JSON.
INTERVENTION_CATALOG: list[dict[str, Any]] = [
    {
        "id": "gratitude",
        "title": "Gratitude",
        "summary": "Shift attention to what's already supporting you, even in small ways.",
        "category": "core",
        "duration_approx": "About 8 minutes",
        "fields": [
            {
                "key": "g1",
                "label": "First thing you’re grateful for",
                "hint": "Who or what helped, even a little.",
                "placeholder": "Someone or something specific — even a small kindness counts.",
            },
            {
                "key": "g2",
                "label": "Second",
                "hint": "From today or something easy to miss.",
                "placeholder": "Another moment or person — basics are fine.",
            },
            {
                "key": "g3",
                "label": "Third",
                "hint": "Basics are fine: food, rest, a person, weather.",
                "placeholder": "A third thing — food, rest, weather, a text…",
            },
            {
                "key": "g_action",
                "label": "One tiny follow-up for tomorrow",
                "hint": "One sentence — a small next step.",
                "placeholder": "One realistic sentence — something you could actually do.",
            },
        ],
    },
    {
        "id": "best_possible_self",
        "title": "Best possible future self (Laura King)",
        "summary": (
            "Evidence-based writing exercise: first imagine your life at 109 if everything went as well as possible; "
            "then your 109-year-old self visits you with advice; then you turn that into a few action points. "
            "In the timed writes, don’t self-edit—keep writing."
        ),
        "category": "core",
        "duration_approx": "About 12 minutes",
        "fields": [
            {
                "key": "bps_king_109",
                "label": "Step 1 — about 5 minutes",
                "placeholder": "Keep your pen moving — don’t edit as you go.",
                "hint": (
                    "Write continuously without self-editing, without holding back. Use this prompt: "
                    "“Think about your life in the future when you are 109 years old. Imagine that everything has gone as well as it possibly could. "
                    "You have worked hard and succeeded at accomplishing all your life goals. Think of this as the realization of all your life dreams. "
                    "Now, write about what you imagined.”"
                ),
            },
            {
                "key": "bps_king_time_machine",
                "label": "Step 2 — about 5 minutes",
                "placeholder": "Let the advice flow out — no polishing yet.",
                "hint": (
                    "Again, no self-editing or criticism—keep the pen moving. Use this prompt: "
                    "“Imagine that your 109-year-old self had access to a time machine. They jumped into that time machine and arrived at this very moment in time. "
                    "They climb out, sit next to you and give you advice. What would they say?” Write down everything."
                ),
            },
            {
                "key": "bps_king_actions",
                "label": "Step 3 — about 2 minutes",
                "placeholder": "Bullet-style is fine — what will you actually remember day to day?",
                "hint": (
                    "From that advice, create a list of action points. Focus on the top three action points to keep in mind every day."
                ),
            },
        ],
    },
    {
        "id": "cognitive_reframing",
        "title": "Cognitive reframing",
        "summary": (
            "📝 Pause the spiral. Is there another way to look at this that still fits the facts?"
        ),
        "category": "core",
        "duration_approx": "About 8 minutes",
        "fields": [
            {
                "key": "cr_hot",
                "label": "💭 Original Thought\n(What’s the exact worry in your mind?)",
                "hint": "",
                "placeholder": "Write your thought exactly as it sounds — messy is okay.",
            },
            {
                "key": "cr_evidence_for",
                "label": "🔍 Supporting Evidence\n(What facts actually support this thought?)",
                "hint": "",
                "placeholder": "List only real evidence — it’s okay if there’s not much.",
            },
            {
                "key": "cr_evidence_against",
                "label": "⚖️ Contradicting Evidence\n(What doesn’t fully fit this thought?)",
                "hint": "Think: times it went okay, your skills, support, or things you can control",
                "placeholder": "What evidence goes against this?",
            },
            {
                "key": "cr_balanced",
                "label": "🌱 Balanced Perspective\n(A more realistic, less extreme version)",
                "hint": "Try using “and” or “but” to hold both sides",
                "placeholder": "Rewrite this in a more balanced way.",
            },
        ],
    },
    {
        "id": "savoring",
        "title": "Savoring",
        "summary": "Stretch a good moment: notice it with your senses and words before it slips away.",
        "category": "core",
        "duration_approx": "About 6 minutes",
        "fields": [
            {
                "key": "sv_moment",
                "label": "One small good moment",
                "hint": "Anything counts — a sip, a message, light, sound.",
                "placeholder": "e.g. the first sip of tea, a text, sunlight on the wall…",
            },
            {
                "key": "sv_senses",
                "label": "What you noticed",
                "hint": "What you saw, heard, or felt.",
                "placeholder": "Colors, sounds, temperature, texture — whatever stood out.",
            },
            {
                "key": "sv_extend",
                "label": "How to stretch it a little",
                "hint": "What you’d linger on for half a minute more.",
                "placeholder": "What would you pay attention to for 30 more seconds?",
            },
        ],
    },
    {
        "id": "breathing_grounding",
        "title": "Breathing & grounding",
        "summary": "Lower physical tension first; thoughts get easier after.",
        "category": "core",
        "duration_approx": "About 5 minutes",
        "session_type": "meditation",
        "fields": [],
    },
] + CURRICULUM_INTERVENTIONS


def catalog_by_id(intervention_id: str) -> dict[str, Any] | None:
    for item in INTERVENTION_CATALOG:
        if item["id"] == intervention_id:
            return item
    return None
