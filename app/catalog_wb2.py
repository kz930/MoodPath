from __future__ import annotations

from typing import Any

CURRICULUM_INTERVENTIONS: list[dict[str, Any]] = [
    {
        "id": "perma_baseline_authentic_happiness",
        "title": "Baseline well-being check",
        "summary": (
            "Take a few short surveys online. They give you a snapshot of how you are doing right now.\n\n"
            "• Sign up at the test site, finish each survey, and write down the date.\n"
            "• Scores may be shaped by your age, where you live, and other things.\n"
            "• You can do this again later (around week 10) to see what changed."
        ),
        "duration_approx": "About 45 minutes",
        "category": "assessment",
        "fields": [
            {
                "key": "ah_link_note",
                "label": "When you finished the surveys",
                "hint": (
                    "Site: https://www.authentichappiness.sas.upenn.edu/testcenter "
                    "(make a free account). Write down the date you finished."
                ),
            },
            {
                "key": "perma_scores",
                "label": "1a. PERMA survey — your scores",
                "hint": "Write the scores. Add the percentile if the site shows one.",
            },
            {
                "key": "ghq_scores",
                "label": "1b. General Happiness survey — your scores",
                "hint": "Scores and percentile if shown.",
            },
            {
                "key": "swls_scores",
                "label": "1c. Life Satisfaction survey — your scores",
                "hint": "Scores and percentile if shown.",
            },
            {
                "key": "other_measures",
                "label": "1d. Any other surveys you took",
                "hint": "Name the survey and your scores.",
            },
            {
                "key": "q_surprise",
                "label": "2. Did any score surprise you? Why?",
                "hint": "",
            },
            {
                "key": "q_movable",
                "label": "3. Could any of these scores change in a few weeks? Which ones, and why?",
                "hint": "",
            },
            {
                "key": "q_free",
                "label": "4. Other thoughts — what you want to work on or anything else.",
                "hint": "",
            },
        ],
    },
    {
        "id": "gratitude_letter_wb2",
        "title": "Gratitude letter",
        "summary": (
            "Write a thank-you letter to someone who helped you. "
            "If you can, share it with them. You do not need to write the whole letter here — short notes are fine."
        ),
        "duration_approx": "About 40 minutes",
        "category": "curriculum",
        "fields": [
            {
                "key": "recipient",
                "label": "Who is it for?",
                "hint": "A name, or just a label like \"my old coach.\"",
            },
            {
                "key": "letter_outline",
                "label": "What does the letter say? (short notes are fine)",
                "hint": "What they did, how it helped, and how you remember it now.",
            },
            {
                "key": "gl_q1",
                "label": "How did you feel while writing it?",
                "hint": "",
            },
            {
                "key": "gl_q2",
                "label": "How did they reply? How did that feel for you?",
                "hint": "",
            },
            {
                "key": "gl_q3",
                "label": "How long did the good feeling last after?",
                "hint": "",
            },
            {
                "key": "gl_q4",
                "label": "Will you think about this in the next few days?",
                "hint": "",
            },
            {
                "key": "gl_q5",
                "label": "Anyone else you want to thank? Who, and why?",
                "hint": "",
            },
            {
                "key": "gl_q6",
                "label": "How could this change the way you live going forward?",
                "hint": "",
            },
        ],
    },
    {
        "id": "savoring_homework_wb2",
        "title": "Savoring practice",
        "summary": (
            "Plan a fun thing on purpose. While doing it, slow down and enjoy each part. "
            "Notice any thoughts that try to ruin it."
        ),
        "duration_approx": "About 60 minutes",
        "category": "curriculum",
        "fields": [
            {
                "key": "sv_plan_date",
                "label": "Date and what you plan to do",
                "hint": "Half a day or a full day if you can. Put it on your calendar.",
            },
            {
                "key": "sv_plan_detail",
                "label": "Plan: where, who, when?",
                "hint": "Pictures or a small keepsake can help you remember it later.",
            },
            {
                "key": "sv_techniques_intended",
                "label": "Ways you want to enjoy it more",
                "hint": "Examples: share it, take a mental photo, focus, feel proud.",
            },
            {
                "key": "sv_techniques_used",
                "label": "What did you actually do? What worked best?",
                "hint": "",
            },
            {
                "key": "sv_killjoy",
                "label": "Any thoughts that ruined the fun? How did you handle them?",
                "hint": "Examples: comparing, \"I should be working,\" small worries.",
            },
        ],
    },
    {
        "id": "three_good_things_wb2",
        "title": "Three good things",
        "summary": (
            "Each time, list 3 good things from the day. Add a short note about why.\n\n"
            "• Try it 3 times this week. About 5–10 minutes each. Bedtime works well.\n"
            "• Write it down — not just in your head.\n"
            "• Small wins count too. If your mind drifts to the bad, gently come back.\n"
            "• Use the box at the end to share how the week went."
        ),
        "duration_approx": "About 5–10 min per session · 3+ times this week",
        "category": "curriculum",
        "fields": [
            {
                "key": "tgt_session_date",
                "label": "Date / which session this week",
                "hint": "Example: Wed — 2 of 3 this week.",
            },
            {
                "key": "tgt_1_title",
                "label": "Good thing 1 — title",
                "hint": "Like a short headline.",
            },
            {
                "key": "tgt_1_detail",
                "label": "Good thing 1 — what happened",
                "hint": "What did you and others say or do?",
            },
            {
                "key": "tgt_1_feel",
                "label": "Good thing 1 — how you felt then and now",
                "hint": "",
            },
            {
                "key": "tgt_1_why",
                "label": "Good thing 1 — why do you think it happened?",
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
                "label": "Good thing 2 — how you felt",
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
                "label": "Good thing 3 — how you felt",
                "hint": "",
            },
            {
                "key": "tgt_3_why",
                "label": "Good thing 3 — why",
                "hint": "",
            },
            {
                "key": "tgt_report",
                "label": "End-of-week notes",
                "hint": "How did it go? What changed? Will you keep doing it?",
            },
        ],
    },
    {
        "id": "hope_plan_wb2",
        "title": "Hope plan",
        "summary": "Pick a short goal and a long goal. Write the steps, the blocks, your strengths, and who can help.",
        "duration_approx": "About 35 minutes",
        "category": "curriculum",
        "fields": [
            {
                "key": "hp_short_goal",
                "label": "Short goal (this term or this month)",
                "hint": "",
            },
            {
                "key": "hp_long_goal",
                "label": "Long goal (a few years from now)",
                "hint": "",
            },
            {
                "key": "hp_pathways_short",
                "label": "Short goal — 1 or 2 ways to reach it, things in the way, and how your strengths help",
                "hint": "",
            },
            {
                "key": "hp_pathways_long",
                "label": "Long goal — 1 or 2 ways to reach it, things in the way, strengths, and people who help",
                "hint": "Friends, family, routines, anything that keeps you going.",
            },
            {
                "key": "hp_agency",
                "label": "What is in your control right now?",
                "hint": "",
            },
            {
                "key": "hp_summary_para",
                "label": "Short note: what did you learn?",
                "hint": "Do the goals fit together? Did this make you feel more hopeful?",
            },
        ],
    },
    {
        "id": "optimism_style_self_report_wb2",
        "title": "Your hope and optimism style",
        "summary": (
            "Take 2 short tests online. Then write your scores below.\n\n"
            "These give a rough idea — they are not a diagnosis.\n\n"
            "• LOT-R: most adults score around the middle on a 0–4 scale. Use your test's own guide.\n"
            "• Adult Hope Scale: scores often fall in the middle to upper range.\n\n"
            "Trust the official scores from the test site over any rough average."
        ),
        "duration_approx": "About 30 minutes",
        "category": "assessment",
        "fields": [
            {
                "key": "opt_lot_r",
                "label": "LOT-R — your scores",
                "hint": (
                    "Take the test (or use what your teacher gives you). "
                    "More info: https://ppc.sas.upenn.edu/resources/questionnaires-research/life-orientation-test-revised-lot-r "
                    "Write the scores just as your test shows them."
                ),
            },
            {
                "key": "opt_ahs",
                "label": "Adult Hope Scale — your scores",
                "hint": (
                    "More info: https://ppc.sas.upenn.edu/resources/questionnaires-research/adult-hope-scale "
                    "Write the scores just as your test shows them."
                ),
            },
            {
                "key": "opt_other",
                "label": "Any other hope or optimism tests",
                "hint": "Name the test, link if any, and your scores.",
            },
            {
                "key": "opt_reaction",
                "label": "How did you feel about the scores? Anything that surprised you?",
                "hint": "",
            },
            {
                "key": "opt_lecture_takeaway",
                "label": "One thing you learned from class or the readings",
                "hint": "",
            },
            {
                "key": "opt_boost",
                "label": "Ideas to grow your hope or optimism this term",
                "hint": "",
            },
        ],
    },
    {
        "id": "best_possible_self_expanded_wb2",
        "title": "Best possible self (longer version)",
        "summary": (
            "Picture your life going really well. Then write it out in detail.\n\n"
            "• Do this 3 times this week (about 15–20 minutes each — like Mon, Wed, Fri).\n"
            "• Be very specific. Name places, people, and routines. Do not just say \"I'm happy.\" Write as if it is real.\n"
            "• Keep it private and honest.\n\n"
            "After your last session, fill in the boxes about purpose, hope, and feelings."
        ),
        "duration_approx": "About 15–20 min per session",
        "category": "curriculum",
        "fields": [
            {
                "key": "bps_ex_session",
                "label": "Which session is this (1, 2, or 3) and the date",
                "hint": "Example: \"Session 2 — Wednesday.\"",
            },
            {
                "key": "bps_ex_body",
                "label": "Your writing for this session",
                "hint": (
                    "Picture your life 5 to 10 years from now. Everything has gone as well as you hoped. "
                    "You worked hard and reached your goals. "
                    "Write what you see. Be specific. Do not worry about grammar. "
                    "Talk about your job, friends, family, hobbies, and health. "
                    "How do you feel? What does a normal day look like?"
                ),
            },
            {
                "key": "bps_ex_ref_purpose",
                "label": "After your last session — your purpose",
                "hint": "What does this picture say about what matters to you? Does it give your day-to-day life more meaning?",
            },
            {
                "key": "bps_ex_ref_pathway",
                "label": "After your last session — one real next step",
                "hint": "Hope needs a plan. What is one step you can take this term to move toward this future self?",
            },
            {
                "key": "bps_ex_ref_hedonic",
                "label": "After your last session — how it felt",
                "hint": "Did your mood change while you wrote? How could you make this a regular habit?",
            },
        ],
    },
    {
        "id": "awe_walk_wb2",
        "title": "Awe walk",
        "summary": "Spend time outside in a place that feels big or beautiful. Then answer the questions below.",
        "duration_approx": "About 45 minutes",
        "category": "curriculum",
        "fields": [
            {
                "key": "awe_setting",
                "label": "Where did you go?",
                "hint": "A park, a hill, water, the night sky, a sunrise.",
            },
            {
                "key": "awe_q1",
                "label": "1. Why do you think people feel awe? How might it have helped people long ago?",
                "hint": "",
            },
            {
                "key": "awe_q2",
                "label": (
                    "2. On your walk, did your body feel different? Did any new questions or ideas come up? "
                    "Did you feel different about yourself or the people around you?"
                ),
                "hint": "",
            },
            {
                "key": "awe_last_three",
                "label": "3. Write about the last 3 times you felt awe in your life.",
                "hint": "",
            },
        ],
    },
    {
        "id": "nature_challenge_30x30_wb2",
        "title": "30×30 nature challenge",
        "summary": (
            "Spend 30 minutes outside every day for 30 days. "
            "On Home → Your habits, open the 30×30 section. Pick a start day. "
            "Each day, tap the day and add a quick mood and note. "
            "When the month is done, mark it finished and write your overall thoughts."
        ),
        "duration_approx": "30 min daily × 30 days",
        "category": "nature30",
        "fields": [
            {
                "key": "n30_commit",
                "label": "Start date and how you will keep going",
                "hint": "A calendar, a checklist, or this app — whatever you will really use.",
            },
            {
                "key": "n30_daily_json",
                "label": "Daily mood log",
                "hint": "Use the tracker above. This box fills in for you when you save.",
            },
            {
                "key": "n30_reflection",
                "label": "When you finish — overall thoughts",
                "hint": "At least one paragraph. How did it feel? What changed? What stood out?",
            },
        ],
    },
    {
        "id": "curiosity_practice_wb2",
        "title": "Practice being curious",
        "summary": (
            "Stretch your curiosity in real life. Pick ONE of three options:\n\n"
            "• Option 1 — Curiosity Stretch: for 3 days, find one moment you'd usually tune out, "
            "and stay curious instead. Ask a question, look for something new, or try to understand why.\n"
            "• Option 2 — Deep Dive: spend 20–30 min exploring something that already pulls your interest. "
            "Watch, read, follow tangents.\n"
            "• Option 3 — Curiosity in Relationships: have one conversation where your only goal is to be "
            "deeply curious about the other person."
        ),
        "duration_approx": "About 20–30 minutes (Option 2/3) · 3 short moments (Option 1)",
        "category": "weekly",
        "fields": [
            {
                "key": "cur_option",
                "label": "Which option did you pick? (1, 2, or 3)",
                "hint": "1 = stretch, 2 = deep dive, 3 = relationships.",
            },
            {
                "key": "cur_what_you_did",
                "label": "What did you do?",
                "hint": "Describe it like you'd tell a friend.",
                "placeholder": "Where, when, what, with whom…",
            },
            {
                "key": "cur_what_happened",
                "label": "What happened as a result?",
                "hint": "Did you notice anything surprising?",
            },
            {
                "key": "cur_mood_change",
                "label": "Did it change your mood, stress, or how you felt about others?",
                "hint": "",
            },
            {
                "key": "cur_more",
                "label": "Any extra notes",
                "hint": "Optional — anything that stuck with you.",
            },
        ],
    },
    {
        "id": "wellbeing_writing_analysis_wb2",
        "title": "Measure your well-being in writing",
        "summary": (
            "Pick 2 samples of your own writing (each 250+ words). They could be journal entries, "
            "social media posts, texts, or stories.\n\n"
            "Then look for what kinds of words and themes show up. You can do this by hand, or use "
            "tools like LIWC or LexHub that count word categories (positive emotion, social, etc.).\n\n"
            "Tap \"analyze with AI\" below to get a quick read on themes in your samples."
        ),
        "duration_approx": "About 30 minutes",
        "category": "weekly",
        "supports_ai_analysis": True,
        "fields": [
            {
                "key": "ww_sample_1",
                "label": "Sample 1 — paste your writing",
                "hint": "About 250 words or more.",
                "placeholder": "Paste a journal entry, post, or letter…",
                "multi": True,
            },
            {
                "key": "ww_sample_2",
                "label": "Sample 2 — paste another piece",
                "hint": "Different type if you can — e.g. one journal + one text/post.",
                "placeholder": "A second sample…",
                "multi": True,
            },
            {
                "key": "ww_sources",
                "label": "1. What did you use as your writing source?",
                "hint": "",
            },
            {
                "key": "ww_categories",
                "label": "2. What word categories or themes were most common?",
                "hint": "Examples: positive feelings, social words, growth, regret.",
            },
            {
                "key": "ww_correlation",
                "label": "3. Do your word choices match how you actually feel? Why or why not?",
                "hint": "",
            },
            {
                "key": "ww_pros_cons",
                "label": "4. Pros, cons, and ethics of using writing to measure well-being",
                "hint": "What's good about it? What does it miss? Any concerns?",
            },
        ],
    },
    {
        "id": "earth_day_wb2",
        "title": "Earth Day activity",
        "summary": (
            "Pick ONE of six Earth Day options, then write a short reflection.\n\n"
            "1. Sensory nature walk (savoring + mindfulness)\n"
            "2. Nature gratitude journaling (gratitude + awe)\n"
            "3. \"Why I love Earth\" + your strengths (values + self-efficacy)\n"
            "4. Upcycled art / crafts (flow + competence)\n"
            "5. Nature-based meditation (nature relatedness)\n"
            "6. Volunteer / cleanup (altruism + meaning)"
        ),
        "duration_approx": "About 20–60 minutes",
        "category": "weekly",
        "fields": [
            {
                "key": "ed_option",
                "label": "Which option did you pick?",
                "hint": "1, 2, 3, 4, 5, or 6.",
            },
            {
                "key": "ed_experience",
                "label": "What did you do? Where did you go?",
                "hint": "A short description of the setting and your actions.",
            },
            {
                "key": "ed_pp_concept",
                "label": "Which positive psychology idea did you feel most? (savoring, flow, awe, altruism…)",
                "hint": "",
            },
            {
                "key": "ed_outcomes",
                "label": "How did your mood or stress shift? Did you feel more connected or meaningful?",
                "hint": "",
            },
            {
                "key": "ed_integration",
                "label": "How could you bring this feeling into other parts of life?",
                "hint": "",
            },
        ],
    },
    {
        "id": "pay_it_forward_wb2",
        "title": "Pay it forward day",
        "summary": (
            "Do at least one (better: three) acts of kindness today, with no expectation of return. "
            "Examples: leave a compliment, buy a coffee for the next person, mentor a peer, volunteer.\n\n"
            "Then write a short reflection using ideas from class (helper's high, ripple effect, meaning)."
        ),
        "duration_approx": "About 20 minutes (plus the acts)",
        "category": "weekly",
        "fields": [
            {
                "key": "pif_acts",
                "label": "Acts of kindness you did today",
                "hint": "Just a quick list — 1, 2, 3.",
            },
            {
                "key": "pif_emotions",
                "label": "How did you feel before, during, and after?",
                "hint": "Nervous? Warm? Lighter? Compare to your normal state.",
            },
            {
                "key": "pif_connection",
                "label": "Did the acts make you feel more connected, or less stuck in your own head?",
                "hint": "",
            },
            {
                "key": "pif_meaning",
                "label": "Did this give you any sense of meaning?",
                "hint": "",
            },
            {
                "key": "pif_ripple",
                "label": "Did you see (or imagine) a ripple effect? Will the person pass it on?",
                "hint": "",
            },
            {
                "key": "pif_apply",
                "label": "How could you bring this into normal life, not just one day?",
                "hint": "",
            },
        ],
    },
    {
        "id": "strengths_use_wb2",
        "title": "Use your strengths (1 week)",
        "summary": (
            "Pick 3 of your top strengths. Plan one way to use each strength every day for a week. "
            "Try to use them in NEW ways or new contexts when you can.\n\n"
            "After the week, write a short reflection on how it went."
        ),
        "duration_approx": "10 min planning · 1 week of practice",
        "category": "weekly",
        "fields": [
            {
                "key": "su_top_3",
                "label": "Three strengths you'll work on this week",
                "hint": "Examples: creativity, kindness, curiosity, leadership, humor.",
            },
            {
                "key": "su_plan",
                "label": "Your plan — one strength per day, what you'll do",
                "hint": "Mon: ___ Tue: ___ Wed: ___ … (a few days using a strength in a new way is great).",
                "multi": True,
            },
            {
                "key": "su_reflection",
                "label": "End of week — how did it go?",
                "hint": "Did your mood, stress, confidence change? Was it easy or hard?",
                "multi": True,
            },
        ],
    },
    {
        "id": "flow_intervention_wb2",
        "title": "Design your own flow",
        "summary": (
            "Pick a regular activity you usually dislike. Tweak it to feel more like flow:\n\n"
            "• Add a challenge (timer, speed run)\n"
            "• Add a constraint (no using one word, do it left-handed)\n"
            "• Break a vague goal into small ones with quick feedback\n"
            "• Remove distractions"
        ),
        "duration_approx": "A few short tries across a week",
        "category": "weekly",
        "fields": [
            {
                "key": "fl_activity",
                "label": "What activity did you focus on?",
                "hint": "Something you have to do but find boring.",
            },
            {
                "key": "fl_change",
                "label": "What did you change to make it more like flow? Why?",
                "hint": "Tie it back to flow theory if you can.",
                "multi": True,
            },
            {
                "key": "fl_worked",
                "label": "What worked? What didn't?",
                "hint": "Be honest — failures are useful.",
                "multi": True,
            },
            {
                "key": "fl_apply",
                "label": "What does this mean for other boring tasks in your life?",
                "hint": "",
            },
        ],
    },
    {
        "id": "kindness_self_other_wb2",
        "title": "Kindness — self & others",
        "summary": (
            "Over a weekend, do TWO sets of 3 acts of kindness:\n\n"
            "• One day: 3 intentional acts of kindness for YOURSELF (favorite meal, hobby time, "
            "small treat). Plan them in advance.\n"
            "• One day: 3 intentional acts of kindness for OTHERS (a card, a chore, a kind text). "
            "Try to do something new — not your usual routine.\n\n"
            "After each day, rate how you felt on 4 emotions (1–7 scale): positive, negative, "
            "socially connected, life meaning."
        ),
        "duration_approx": "Across one weekend",
        "category": "weekly",
        "fields": [
            {
                "key": "ksk_self_acts",
                "label": "SELF day — three acts of kindness you did for yourself",
                "hint": "1, 2, 3.",
                "multi": True,
            },
            {
                "key": "ksk_self_emotions",
                "label": "SELF day — emotions (1–7 each): positive · negative · connected · life meaning",
                "hint": "Example: positive 6, negative 2, connected 4, life meaning 5.",
            },
            {
                "key": "ksk_other_acts",
                "label": "OTHER day — three acts of kindness you did for others",
                "hint": "1, 2, 3.",
                "multi": True,
            },
            {
                "key": "ksk_other_emotions",
                "label": "OTHER day — emotions (1–7 each): positive · negative · connected · life meaning",
                "hint": "",
            },
            {
                "key": "ksk_compare",
                "label": "1. How did your emotional profile differ between the two days?",
                "hint": "Look at \"connected\" and \"life meaning\" — were those higher on one day?",
                "multi": True,
            },
            {
                "key": "ksk_strategy",
                "label": "2. How could you use these as tools during a stressful week?",
                "hint": "When would you choose self-kindness vs other-kindness?",
                "multi": True,
            },
        ],
    },
]
