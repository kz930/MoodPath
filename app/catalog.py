from __future__ import annotations

from typing import Any

from .catalog_wb2 import WB2_INTERVENTIONS

# Keys in `fields` are stable for stored `responses` JSON.
INTERVENTION_CATALOG: list[dict[str, Any]] = [
    {
        "id": "gratitude",
        "title": "Gratitude",
        "summary": "Shift attention to what's already supporting you, even in small ways.",
        "category": "core",
        "duration_hint_min": 8,
        "fields": [
            {
                "key": "g1",
                "label": "First thing you’re grateful for",
                "hint": "Be specific: who, what, or situation—and how it helped, even a little.",
            },
            {
                "key": "g2",
                "label": "Second",
                "hint": "Something from today or something steady you usually overlook.",
            },
            {
                "key": "g3",
                "label": "Third",
                "hint": "Stuck? Basics count: your body, food, weather, internet—anything.",
            },
            {
                "key": "g_action",
                "label": "One tiny follow-up for tomorrow",
                "hint": "One sentence: what small action might you do about one of these?",
            },
        ],
    },
    {
        "id": "best_possible_self",
        "title": "Best possible self",
        "summary": "Picture a future where things go well enough—enough to feel hope and direction.",
        "category": "core",
        "duration_hint_min": 10,
        "fields": [
            {
                "key": "bps_time",
                "label": "Time horizon",
                "hint": "e.g. three months, one term—close enough to feel motivating, not fantasy.",
            },
            {
                "key": "bps_day",
                "label": "That day, from morning to night",
                "hint": "A few sentences: where you are, who you’re with, what you’re doing, how it feels.",
            },
            {
                "key": "bps_habits",
                "label": "Habits that would hold that life up",
                "hint": "Two or three concrete habits (how often, how long).",
            },
            {
                "key": "bps_step",
                "label": "One small step today",
                "hint": "Single thing you could start in the next five minutes.",
            },
        ],
    },
    {
        "id": "cognitive_reframing",
        "title": "Cognitive reframing",
        "summary": "Pause the doom loop and check if there’s another story that still fits the facts.",
        "category": "core",
        "duration_hint_min": 8,
        "fields": [
            {
                "key": "cr_hot",
                "label": "The worry thought, verbatim",
                "hint": "Copy the line from your head—no polishing.",
            },
            {
                "key": "cr_evidence_for",
                "label": "Facts that seem to support it",
                "hint": "Facts only; if there isn’t much, say so.",
            },
            {
                "key": "cr_evidence_against",
                "label": "What doesn’t fit or weakens it",
                "hint": "Past times it went okay, people, skills, anything you can control a bit.",
            },
            {
                "key": "cr_balanced",
                "label": "A more balanced line",
                "hint": "Try “and,” “but,” “I can still…”—closer to real life.",
            },
        ],
    },
    {
        "id": "savoring",
        "title": "Savoring",
        "summary": "Stretch a good moment: notice it with your senses and words before it slips away.",
        "category": "core",
        "duration_hint_min": 6,
        "fields": [
            {
                "key": "sv_moment",
                "label": "One small good moment",
                "hint": "A drink, a line of chat, a song—anything counts.",
            },
            {
                "key": "sv_senses",
                "label": "What you noticed",
                "hint": "See, hear, touch, smell, taste—whatever you can grab.",
            },
            {
                "key": "sv_extend",
                "label": "How to make it last 30 seconds longer",
                "hint": "What would you slow down? Where would attention go?",
            },
        ],
    },
    {
        "id": "breathing_grounding",
        "title": "Breathing & grounding",
        "summary": "Lower the body’s alarm first; then thoughts are easier to work with.",
        "category": "core",
        "duration_hint_min": 5,
        "fields": [
            {
                "key": "bg_before",
                "label": "Body before",
                "hint": "Tight chest, shoulders, fast heart—a few words.",
            },
            {
                "key": "bg_rounds",
                "label": "What you did",
                "hint": "e.g. inhale 4, hold 2, exhale 6, six rounds.",
            },
            {
                "key": "bg_after",
                "label": "After",
                "hint": "Tension 0–10? Mind clearer or not?",
            },
            {
                "key": "bg_anchor",
                "label": "One short phrase for next time",
                "hint": "Short—ten words or less.",
            },
        ],
    },
] + WB2_INTERVENTIONS


def catalog_by_id(intervention_id: str) -> dict[str, Any] | None:
    for item in INTERVENTION_CATALOG:
        if item["id"] == intervention_id:
            return item
    return None
