from __future__ import annotations

from typing import Any

CURRICULUM_INTERVENTIONS: list[dict[str, Any]] = [
    {
        "id": "perma_baseline_authentic_happiness",
        "title": "Baseline Assessment of Well-Being",
        "summary": (
            "Snapshot your wellbeing at the Authentic Happiness Test Center and paste scores below. "
            "You’ll repeat around week 10 to see what changed.\n\n"
            "• Sign up, complete the surveys, note the date you finished.\n"
            "• Percentiles may reflect age, region, and other factors.\n"
            "• Add other scores too (stress, optimism, etc.) if you like—then answer the questions."
        ),
        "duration_approx": "About 45 minutes",
        "category": "assessment",
        "fields": [
            {
                "key": "ah_link_note",
                "label": "Test Center — when you completed",
                "hint": (
                    "Site: https://www.authentichappiness.sas.upenn.edu/testcenter "
                    "(create an account). Note the date you finished."
                ),
            },
            {
                "key": "perma_scores",
                "label": "1a. PERMA Questionnaire — your scores",
                "hint": "Scores and percentiles if the site gives them.",
            },
            {
                "key": "ghq_scores",
                "label": "1b. General Happiness Questionnaire — your scores",
                "hint": "Scores and percentiles if given.",
            },
            {
                "key": "swls_scores",
                "label": "1c. Satisfaction With Life Test — your scores",
                "hint": "Scores and percentiles if given.",
            },
            {
                "key": "other_measures",
                "label": "1d. Other measures",
                "hint": "Any other questionnaires you want for week 1 (Test Center or other sources).",
            },
            {
                "key": "q_surprise",
                "label": "2. Were you surprised by any results? Why or why not? Which survey in particular?",
                "hint": "",
            },
            {
                "key": "q_movable",
                "label": (
                    "3. Do you think any of these are moveable—could scores be quite different "
                    "in a few weeks or months? Why or why not? Which scale(s) might move the most?"
                ),
                "hint": "",
            },
            {
                "key": "q_free",
                "label": (
                    "4. Other comments — reactions, what you hope to work on this quarter, "
                    "or notes (you’ll do more self-assessments later; you might keep a section "
                    "for all wellbeing scores and mark it in a table of contents)."
                ),
                "hint": "",
            },
        ],
    },
    {
        "id": "gratitude_letter_wb2",
        "title": "Gratitude letter",
        "summary": "Write to someone who mattered; ideally read it to them. Here you capture the experience, not necessarily the full letter.",
        "duration_approx": "About 40 minutes",
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
        "title": "Savoring practices",
        "summary": "Plan a pleasant experience and use savoring strategies; note kill-joy thoughts too.",
        "duration_approx": "About 60 minutes",
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
        "title": "Three good things gratitude exercise",
        "summary": (
            "Each time, list three things that went well and briefly why—classic Seligman exercise. "
            "Do this at least three times this week (about 5–10 minutes per session; end of day often works).\n\n"
            "• Write here or on paper—not only in your head.\n"
            "• For each item: short title, what happened, how you felt then and now, why you think it happened.\n"
            "• Small wins and big wins both count. If you drift negative, gently return to the good event.\n\n"
            "If your course shares a 3GT video (e.g. Seligman) or a printable “3 Good Things Activity,” use those too. "
            "Use the end-of-week box below to reflect on how it went."
        ),
        "duration_approx": "About 5–10 min per session · 3+ times this week",
        "category": "curriculum",
        "fields": [
            {
                "key": "tgt_session_date",
                "label": "Date / which session this week",
                "hint": "e.g. Wed — 2 of 3 this week.",
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
                "label": "End-of-week report",
                "hint": (
                    "How it worked for you; what specific emotions, behaviors, or symptoms changed; "
                    "what you thought about the activity; whether you think you’ll keep doing it."
                ),
            },
        ],
    },
    {
        "id": "hope_plan_wb2",
        "title": "Hope plan (Snyder)",
        "summary": "Short- and long-term goals, pathways, obstacles, strengths, and resources.",
        "duration_approx": "About 35 minutes",
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
        "title": "Learning about your own optimistic style",
        "summary": (
            "Take the questionnaires online (links in the fields), then enter your scores below.\n\n"
            "Rough research context only—samples vary; not a diagnosis.\n\n"
            "• LOT-R: many adults land near the mid-teens on common 0–4 totals; your form’s guide matters most.\n"
            "• Adult Hope Scale: scores often cluster mid-to-upper; follow your version’s scoring.\n\n"
            "Official percentiles or norms from the test site beat any rough average."
        ),
        "duration_approx": "About 30 minutes",
        "category": "assessment",
        "fields": [
            {
                "key": "opt_lot_r",
                "label": "LOT-R — your scores",
                "hint": (
                    "Take the test (or use materials your instructor provides). "
                    "UPenn Positive Psychology Center overview: "
                    "https://ppc.sas.upenn.edu/resources/questionnaires-research/life-orientation-test-revised-lot-r "
                    "— enter totals/subscales exactly as your form shows."
                ),
            },
            {
                "key": "opt_ahs",
                "label": "Adult Hope Scale — your scores",
                "hint": (
                    "UPenn overview (agency, pathways): "
                    "https://ppc.sas.upenn.edu/resources/questionnaires-research/adult-hope-scale "
                    "— enter scores as instructed on your version."
                ),
            },
            {
                "key": "opt_other",
                "label": "Other optimism / hope measures",
                "hint": "Name the scale, link if any, and your scores.",
            },
            {
                "key": "opt_reaction",
                "label": "Your reaction: what matched your expectations? Anything surprising across scales?",
                "hint": "",
            },
            {
                "key": "opt_lecture_takeaway",
                "label": "One takeaway from readings or lecture",
                "hint": "",
            },
            {
                "key": "opt_boost",
                "label": "Ideas to build hope or optimism this term",
                "hint": "",
            },
        ],
    },
    {
        "id": "best_possible_self_expanded_wb2",
        "title": "Best possible self (expanded version)",
        "summary": (
            "Picture your life after everything has gone as well as it could—then write it out.\n\n"
            "• Three sessions this week (~15–20 minutes each; e.g. Mon / Wed / Fri).\n"
            "• Be specific: places, people, routines—not just “I’m happy.” Describe success as already real.\n"
            "• Keep it private and honest.\n\n"
            "After your last session, use the reflection boxes below (purpose, hope pathways, hedonic benefits)."
        ),
        "duration_approx": "About 15–20 min per session",
        "category": "curriculum",
        "fields": [
            {
                "key": "bps_ex_session",
                "label": "This session (1, 2, or 3) and date",
                "hint": "e.g. “Session 2 — Wednesday.”",
            },
            {
                "key": "bps_ex_body",
                "label": "Your writing for this session",
                "hint": (
                    "Prompt: “Take a moment to imagine your life in the future—let’s say 5 to 10 years from now. "
                    "Imagine that everything has gone as well as it possibly could. You have worked hard and succeeded at accomplishing all of your life goals. "
                    "Think of this as the realization of all of your dreams. "
                    "Now, write about what you see. Be specific. Don’t worry about grammar or punctuation; just focus on the details of your career, relationships, hobbies, and health. "
                    "How do you feel? What does your daily life look like?”"
                ),
            },
            {
                "key": "bps_ex_ref_purpose",
                "label": "After your final session — Cultivating purpose",
                "hint": (
                    "How did visualizing your “Best Possible Self” help you identify your core values? "
                    "In what ways does having a clear image of your future self provide a sense of profound purpose "
                    "(meaningful direction) in your current daily life?"
                ),
            },
            {
                "key": "bps_ex_ref_pathway",
                "label": "After your final session — Agency & pathways (Snyder’s Hope Theory)",
                "hint": (
                    "Hope requires both “willpower” (agency) and “waypower” (pathways). "
                    "Which specific pathway or step can you take this semester to move toward the version of yourself you described?"
                ),
            },
            {
                "key": "bps_ex_ref_hedonic",
                "label": "After your final session — Hedonic benefits",
                "hint": (
                    "What emotion changes happened while doing this or after? "
                    "How could you incorporate this into some type of regular practice to regularly experience these benefits?"
                ),
            },
        ],
    },
    {
        "id": "awe_walk_wb2",
        "title": "Awe walk",
        "summary": "Spend time outdoors where awe is likely; use the prompts below after your outing.",
        "duration_approx": "About 45 minutes",
        "category": "curriculum",
        "fields": [
            {
                "key": "awe_setting",
                "label": "Where you went",
                "hint": "Park, hilltop, water, night sky, sunrise…",
            },
            {
                "key": "awe_q1",
                "label": (
                    "1. Why do you think people feel awe in the first place? "
                    "Can you think of an advantage that experiencing awe might afford that makes it helpful to human survival?"
                ),
                "hint": "",
            },
            {
                "key": "awe_q2",
                "label": (
                    "2. During your Awe Outing, did you experience any notable physical sensations or did any memorable "
                    "questions arise in your mind? Did you notice any new kind of understanding, or have any special "
                    "thoughts or cool ideas? Did you notice any differences in your feelings or judgements about yourself, "
                    "other people, or your social connections – both close others and humanity at large?"
                ),
                "hint": "",
            },
            {
                "key": "awe_last_three",
                "label": "3. Open writing reflection: Briefly describe the last three experiences in your life where you felt awe.",
                "hint": "",
            },
            {
                "key": "awe_quiz",
                "label": "Berkeley awe quiz — score & ideas to get more awe",
                "hint": "https://greatergood.berkeley.edu/quizzes/take_quiz/awe",
            },
        ],
    },
    {
        "id": "nature_challenge_30x30_wb2",
        "title": "Awe walk 30×30 nature challenge",
        "summary": (
            "30 minutes outside every day for 30 days. On Home → Your habits, use the Awe walk 30×30 section: "
            "pick a start day, tap days on the calendar for mood and a short note, then when the month is done "
            "mark finished and write your overall reflection."
        ),
        "duration_approx": "30 min daily × 30 days",
        "category": "nature30",
        "fields": [
            {
                "key": "n30_commit",
                "label": "Start date & how you’ll stay on track",
                "hint": "Calendar, checklist, or this app’s tracker—whatever you’ll actually use.",
            },
            {
                "key": "n30_daily_json",
                "label": "Daily mood log",
                "hint": "Use the tracker above; this field is filled automatically when you save.",
            },
            {
                "key": "n30_reflection",
                "label": "When you’re done: overall reflection",
                "hint": (
                    "At least a paragraph: completion, emotions, focus, connection, meaning, or anything else that stood out."
                ),
            },
        ],
    },
]
