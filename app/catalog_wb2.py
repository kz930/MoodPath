from __future__ import annotations

from typing import Any

WB2_INTERVENTIONS: list[dict[str, Any]] = [
    {
        "id": "perma_baseline_authentic_happiness",
        "title": "Baseline: PERMA & happiness scales",
        "summary": "Take established surveys online and save scores as a baseline you can compare later (e.g. week 10).",
        "duration_hint_min": 45,
        "category": "curriculum",
        "fields": [
            {
                "key": "ah_link_note",
                "label": "Where & when you completed them",
                "hint": "UPenn Authentic Happiness Test Center (create an account): https://www.authentichappiness.sas.upenn.edu/testcenter — note the date.",
            },
            {
                "key": "perma_scores",
                "label": "PERMA profile: scores and percentiles",
                "hint": "Write scores; add percentiles for age/region if the site gives them.",
            },
            {
                "key": "ghq_scores",
                "label": "General Happiness Questionnaire: scores",
                "hint": "Same as above.",
            },
            {
                "key": "swls_scores",
                "label": "Satisfaction With Life (SWLS): scores",
                "hint": "Same as above.",
            },
            {
                "key": "other_measures",
                "label": "Other measures (optional)",
                "hint": "Stress, optimism, etc.—say where they came from and when.",
            },
            {
                "key": "q_scores_summary",
                "label": "Your scores in one place",
                "hint": "A simple list for future you.",
            },
            {
                "key": "q_surprise",
                "label": "Anything surprise you? Which scale most?",
                "hint": "",
            },
            {
                "key": "q_movable",
                "label": "What feels changeable? What might shift in weeks or months?",
                "hint": "",
            },
            {
                "key": "q_free",
                "label": "Anything else",
                "hint": "Reactions, what you want to work on this term, leaving pages for later scores, etc.",
            },
        ],
    },
    {
        "id": "gratitude_letter_wb2",
        "title": "Gratitude letter",
        "summary": "Write to someone who mattered; ideally read it to them. Here you capture the experience, not necessarily the full letter.",
        "duration_hint_min": 40,
        "category": "curriculum",
        "fields": [
            {
                "key": "recipient",
                "label": "Who it’s for",
                "hint": "Name or a label like “my high-school coach.”",
            },
            {
                "key": "letter_outline",
                "label": "What the letter covers (optional outline)",
                "hint": "What they did, how it affected you, how you remember it now. Outline only if the full text is too private.",
            },
            {
                "key": "gl_q1",
                "label": "How did you feel while writing?",
                "hint": "",
            },
            {
                "key": "gl_q2",
                "label": "How did they respond? How did that land for you?",
                "hint": "",
            },
            {
                "key": "gl_q3",
                "label": "How long did the feelings last after sharing (or if long ago, how long then)?",
                "hint": "",
            },
            {
                "key": "gl_q4",
                "label": "Will you think about this in the coming days? Mood impact?",
                "hint": "",
            },
            {
                "key": "gl_q5",
                "label": "Anyone else you’d like to thank? Who and why?",
                "hint": "",
            },
            {
                "key": "gl_q6",
                "label": "How might this shape how you move forward?",
                "hint": "",
            },
        ],
    },
    {
        "id": "savoring_homework_wb2",
        "title": "Savoring homework",
        "summary": "Plan a pleasant experience and use savoring strategies; note kill-joy thoughts too.",
        "duration_hint_min": 60,
        "category": "curriculum",
        "fields": [
            {
                "key": "sv_plan_date",
                "label": "On (date) I plan to:",
                "hint": "Half or full day if you can; put it on the calendar so it doesn’t keep slipping.",
            },
            {
                "key": "sv_plan_detail",
                "label": "Plan: where, who, when",
                "hint": "Sharing before/after, photos or a small memento—whatever helps you relive it.",
            },
            {
                "key": "sv_techniques_intended",
                "label": "Savoring strategies you mean to try",
                "hint": "e.g. sharing with others, mental snapshots, pride, sharpening attention, absorption (Bryant & Veroff; Seligman).",
            },
            {
                "key": "sv_techniques_used",
                "label": "What you actually used; what worked best?",
                "hint": "",
            },
            {
                "key": "sv_killjoy",
                "label": "Kill-joy thoughts? How did you handle them?",
                "hint": "Comparing, “should be doing work,” random worries…",
            },
        ],
    },
    {
        "id": "three_good_things_wb2",
        "title": "Three good things",
        "summary": "Classic Seligman exercise: three things that went well and why—often before bed, several times per week.",
        "duration_hint_min": 10,
        "category": "curriculum",
        "fields": [
            {
                "key": "tgt_session_date",
                "label": "Date / which session this week",
                "hint": "e.g. “Wed, 2 of 3.”",
            },
            {
                "key": "tgt_1_title",
                "label": "Good thing 1 — title",
                "hint": "Like a headline.",
            },
            {
                "key": "tgt_1_detail",
                "label": "Good thing 1 — what happened",
                "hint": "What you and others said or did—details help.",
            },
            {
                "key": "tgt_1_feel",
                "label": "Good thing 1 — feelings then and now",
                "hint": "",
            },
            {
                "key": "tgt_1_why",
                "label": "Good thing 1 — why you think it happened",
                "hint": "",
            },
            {
                "key": "tgt_2_title",
                "label": "Good thing 2 — title",
                "hint": "",
            },
            {
                "key": "tgt_2_detail",
                "label": "Good thing 2 — what happened",
                "hint": "",
            },
            {
                "key": "tgt_2_feel",
                "label": "Good thing 2 — feelings",
                "hint": "",
            },
            {
                "key": "tgt_2_why",
                "label": "Good thing 2 — why",
                "hint": "",
            },
            {
                "key": "tgt_3_title",
                "label": "Good thing 3 — title",
                "hint": "",
            },
            {
                "key": "tgt_3_detail",
                "label": "Good thing 3 — what happened",
                "hint": "",
            },
            {
                "key": "tgt_3_feel",
                "label": "Good thing 3 — feelings",
                "hint": "",
            },
            {
                "key": "tgt_3_why",
                "label": "Good thing 3 — why",
                "hint": "",
            },
            {
                "key": "tgt_report",
                "label": "End-of-week note (optional)",
                "hint": "Mood, behavior, will you keep doing it?",
            },
        ],
    },
    {
        "id": "best_future_self_109_king",
        "title": "109-year-old self + time machine (Laura King style)",
        "summary": "Free-write your life at 109 if all went well; then what that self would tell you now; then action bullets.",
        "duration_hint_min": 25,
        "category": "curriculum",
        "fields": [
            {
                "key": "bfs_step1",
                "label": "Step 1 (~5 min): You at 109, life went as well as it could",
                "hint": "Timer on. No editing—just write.",
            },
            {
                "key": "bfs_step2",
                "label": "Step 2 (~5 min): That self sits beside you—what do they say?",
                "hint": "Same: keep the pen moving.",
            },
            {
                "key": "bfs_step3",
                "label": "Step 3 (~2 min): Pull out action bullets",
                "hint": "Top three to focus on in the next few days.",
            },
        ],
    },
    {
        "id": "hope_plan_wb2",
        "title": "Hope plan (Snyder)",
        "summary": "Short- and long-term goals, pathways, obstacles, strengths, and resources.",
        "duration_hint_min": 35,
        "category": "curriculum",
        "fields": [
            {
                "key": "hp_short_goal",
                "label": "Short-term goal (this term / quarter)",
                "hint": "",
            },
            {
                "key": "hp_long_goal",
                "label": "Longer-term goal (e.g. ~5 years after graduation)",
                "hint": "",
            },
            {
                "key": "hp_pathways_short",
                "label": "Short goal: 1–2 pathways, obstacles, how strengths help",
                "hint": "",
            },
            {
                "key": "hp_pathways_long",
                "label": "Long goal: 1–2 pathways, obstacles, strengths & resources",
                "hint": "Inside/outside support, people, routines that keep motivation.",
            },
            {
                "key": "hp_agency",
                "label": "Agency: what’s actually in your control?",
                "hint": "",
            },
            {
                "key": "hp_summary_para",
                "label": "Short paragraph: what you learned",
                "hint": "Do goals connect? Did pathways/resources change how hopeful you feel?",
            },
        ],
    },
    {
        "id": "optimism_style_self_report_wb2",
        "title": "Hope & optimism self-report",
        "summary": "Record scores (e.g. Adult Hope Scale, LOT-R, learned optimism) and compare to published averages if you find them.",
        "duration_hint_min": 30,
        "category": "curriculum",
        "fields": [
            {
                "key": "opt_scores",
                "label": "Your scores (which tests, what numbers)",
                "hint": "Date and source.",
            },
            {
                "key": "opt_norms",
                "label": "Norms or averages you looked up",
                "hint": "Quick citation is enough.",
            },
            {
                "key": "opt_reaction",
                "label": "Your reaction: expected? Consistent across scales?",
                "hint": "",
            },
            {
                "key": "opt_lecture_takeaway",
                "label": "One takeaway from readings or lecture",
                "hint": "",
            },
            {
                "key": "opt_boost",
                "label": "Strategies to build optimism",
                "hint": "",
            },
        ],
    },
    {
        "id": "best_possible_self_expanded_wb2",
        "title": "Best possible self (expanded, repeated)",
        "summary": "5–10 years out, everything went well—write several times this week, then reflect on purpose, pathways, and mood.",
        "duration_hint_min": 20,
        "category": "curriculum",
        "fields": [
            {
                "key": "bps_ex_session",
                "label": "Which session / date",
                "hint": "e.g. “3rd write, Friday night.”",
            },
            {
                "key": "bps_ex_body",
                "label": "Your scene",
                "hint": "Work, relationships, health, weekends, how you feel—story style, grammar optional.",
            },
            {
                "key": "bps_ex_ref_purpose",
                "label": "Reflection: values or sense of purpose showing through?",
                "hint": "",
            },
            {
                "key": "bps_ex_ref_pathway",
                "label": "Reflection: one pathway or step this term (Snyder’s hope theory)",
                "hint": "",
            },
            {
                "key": "bps_ex_ref_hedonic",
                "label": "Reflection: mood during/after? How to make this a small repeatable habit?",
                "hint": "",
            },
        ],
    },
    {
        "id": "awe_walk_wb2",
        "title": "Awe walk",
        "summary": "Spend time outdoors where awe is likely; optional Greater Good awe quiz.",
        "duration_hint_min": 45,
        "category": "curriculum",
        "fields": [
            {
                "key": "awe_setting",
                "label": "Where you went",
                "hint": "Park, hilltop, water, night sky, sunrise…",
            },
            {
                "key": "awe_q1",
                "label": "Why might humans feel awe? Any upside for survival?",
                "hint": "",
            },
            {
                "key": "awe_q2",
                "label": "Body sensations, thoughts, or shifts in how you see yourself or others?",
                "hint": "",
            },
            {
                "key": "awe_last_three",
                "label": "Last three times you felt awe (brief)",
                "hint": "",
            },
            {
                "key": "awe_quiz",
                "label": "Berkeley awe quiz score & ideas to get more awe",
                "hint": "https://greatergood.berkeley.edu/quizzes/take_quiz/awe",
            },
        ],
    },
    {
        "id": "nature_challenge_30x30_wb2",
        "title": "30×30 nature challenge (optional)",
        "summary": "30 minutes in nature daily for 30 days—track simply; reflect when you’re done.",
        "duration_hint_min": 30,
        "category": "curriculum",
        "fields": [
            {
                "key": "n30_commit",
                "label": "Start date & how you’ll track",
                "hint": "Checklist, notes app—whatever you’ll actually use.",
            },
            {
                "key": "n30_daily_notes",
                "label": "Snippets from along the way (optional)",
                "hint": "Mood, focus, connection, meaning—whatever matters.",
            },
            {
                "key": "n30_reflection",
                "label": "When it’s over: overall reflection",
                "hint": "Did you complete it? What shifted—positive and hard?",
            },
        ],
    },
]
