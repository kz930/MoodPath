const TOKEN_KEY = "mindpath_token";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const interventionLabels = {
  gratitude: "Gratitude",
  best_possible_self: "Best possible future self (Laura King)",
  cognitive_reframing: "Cognitive reframing",
  savoring: "Savoring",
  breathing_grounding: "Breathing & grounding",
  perma_baseline_authentic_happiness: "Baseline Assessment of Well-Being",
  gratitude_letter_wb2: "Gratitude letter",
  savoring_homework_wb2: "Savoring practices",
  three_good_things_wb2: "Three good things gratitude exercise",
  best_future_self_109_king: "109-year self + time machine",
  hope_plan_wb2: "Hope plan",
  optimism_style_self_report_wb2: "Learning about your own optimistic style",
  best_possible_self_expanded_wb2: "Best possible self (expanded version)",
  awe_walk_wb2: "Awe walk",
  nature_challenge_30x30_wb2: "Awe walk 30×30 nature challenge",
};

const QUICK_MOODS = [
  { id: "calm", tag: "calm", emoji: "😌", label: "Calm" },
  { id: "anxious", tag: "anxious", emoji: "😰", label: "Anxious" },
  { id: "empty", tag: "empty", emoji: "🫥", label: "Empty" },
  { id: "overwhelmed", tag: "stress", emoji: "😵", label: "Stressed" },
  { id: "sad", tag: "sad", emoji: "😢", label: "Sad" },
  { id: "angry", tag: "anger", emoji: "😤", label: "Angry" },
  { id: "tired", tag: "tired", emoji: "😴", label: "Tired" },
  { id: "hopeful", tag: "hopeful", emoji: "🌤", label: "Hopeful" },
];

/** Chill playlist (check-in + More) */
const CHILL_EMBED_BASE = "https://www.youtube.com/embed/j6UN0SH1rek?list=RDj6UN0SH1rek&rel=0";

/** Guided session: main video + matching YouTube playlist for “Sound during session”. */
const SESSION_VIDEO_EMBED = {
  breathing: "https://www.youtube.com/embed/-G89S77iJm8?rel=0",
  meditation: "https://www.youtube.com/embed/x0nZ1ZLephQ?rel=0",
};

const SESSION_SOUND_EMBED = {
  breathing: "https://www.youtube.com/embed/4vSzefD9oh4?rel=0",
  meditation: "https://www.youtube.com/embed/FjHGZj2IjBk?list=RDFjHGZj2IjBk&rel=0",
};

/** Exercise library cards — mountains, river, snow, leaves, spring, summer */
const PLAN_CARD_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  "https://images.unsplash.com/photo-1432405972618-c60b2fc57d95?w=600&q=80",
  "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&q=80",
  "https://images.unsplash.com/photo-1507783548789-75a7cac8c1be?w=600&q=80",
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
];

const JOURNAL_PROMPTS = [
  "What do you need to be kinder to yourself about today?",
  "What went okay today, even a little?",
  "What would you tell a friend who felt like this?",
  "What’s weighing on you — in or out of your control?",
];

let catalogCache = [];
let selectedQuickMood = null;
let historyDays = 7;
let padNodes = null;
let promptIndex = 0;
let sessionReturnTab = "home";
let sessionTimerId = null;
let sessionSecondsLeft = 120;
let sessionGuidedVariant = "breathing";

const SESSION_WELLNESS_INSTRUCTION =
  "Finding a quiet space, sitting comfortably with a straight back, and focusing on your breath for 5–10 minutes.";

const SESSION_BREATHING_PHASE = "Inhale 4 · exhale 6";

function getDefaultSessionSeconds() {
  return sessionGuidedVariant === "meditation" ? 600 : 120;
}

function formatSessionCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function setGuidedSessionTimerPaused(paused) {
  $("#session-body-guided")?.classList.toggle("is-timer-paused", paused);
}

const HABITS_STORAGE_KEY = "mindpath_habits_v3";
const HABITS_LEGACY_V2_KEY = "mindpath_habits_v2";
let habitRollingDays = 7;

const HABIT_RECOMMENDATIONS = [
  { id: "rec_stretch", title: "5-minute stretch" },
  { id: "rec_water", title: "Glass of water after waking" },
  { id: "rec_gratitude_line", title: "One-line gratitude before bed" },
];

const HABIT_PRESETS = [
  { id: "bps_expanded_week", title: "Best possible self (expanded) — 3× this week" },
  { id: "tgt_three_week", title: "Three good things — 3× this week" },
  { id: "n30_habit", title: "Awe walk 30×30 challenge" },
];

/** Legacy daily-only map; migrated into NATURE30_CHALLENGE_KEY */
const NATURE_DAILY_LOG_KEY = "mindpath_n30_daily_v1";
const NATURE30_CHALLENGE_KEY = "mindpath_n30_challenge_v2";

/** Which day is open for mood/note in the 30×30 home calendar */
let n30SelectedISO = null;

const RESPONSE_KEY_LABELS = {
  after_note: "After the session",
  bfs_step1: "Step 1 — at 109",
  bfs_step2: "Step 2 — time-machine advice",
  bfs_step3: "Step 3 — action points",
  bps_time: "Time horizon",
  bps_day: "That day",
  bps_habits: "Habits",
  bps_step: "One small step",
  bps_king_109: "Step 1 — at 109",
  bps_king_time_machine: "Step 2 — time-machine advice",
  bps_king_actions: "Step 3 — top action points",
  opt_scores: "Your scores",
  opt_norms: "Norms you noted",
  opt_lot_r: "LOT-R — your scores",
  opt_ahs: "Adult Hope Scale — your scores",
  opt_other: "Other measures",
  n30_daily_json: "Daily mood log",
};

function catalogTitle(c) {
  return c.title || c.title_zh || c.id;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getToken() {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = sessionStorage.getItem(TOKEN_KEY);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
  return t;
}

function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

async function authFetch(path, opts = {}) {
  const headers = { ...opts.headers, ...authHeaders() };
  if (opts.body && typeof opts.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(path, { ...opts, headers });
}

function showAuth() {
  $("#view-auth").classList.remove("hidden");
  $("#view-app").classList.add("hidden");
  stopPad();
}

function showApp() {
  $("#view-auth").classList.add("hidden");
  $("#view-app").classList.remove("hidden");
}

function showTab(name, options = {}) {
  const navKey = options.navTab ?? name;
  $$(".screen").forEach((s) => s.classList.remove("is-active"));
  const screen = $(`#screen-${name}`);
  if (screen) screen.classList.add("is-active");
  $$(".bottom-nav .nav-item").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === navKey);
  });
  if (name === "checkin") {
    promptIndex = (promptIndex + 1) % JOURNAL_PROMPTS.length;
    const el = $("#journal-prompt");
    if (el) el.textContent = JOURNAL_PROMPTS[promptIndex];
    applyCheckinChillEmbed();
  }
}

function applyCheckinChillEmbed() {
  const on = localStorage.getItem("mindpath_checkin_chill_on") !== "0";
  const iframe = $("#checkin-chill-embed");
  const wrap = $("#checkin-chill-player-wrap");
  const btn = $("#btn-checkin-chill-toggle");
  if (btn) {
    btn.textContent = on ? "On" : "Off";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  if (wrap) wrap.classList.toggle("hidden", !on);
  if (iframe) {
    if (!on) {
      iframe.src = "";
      return;
    }
    iframe.src = `${CHILL_EMBED_BASE}&autoplay=1&playsinline=1`;
  }
}

function initCheckinChillToggle() {
  $("#btn-checkin-chill-toggle")?.addEventListener("click", () => {
    const cur = localStorage.getItem("mindpath_checkin_chill_on");
    const next = cur === "0" ? "1" : "0";
    localStorage.setItem("mindpath_checkin_chill_on", next);
    applyCheckinChillEmbed();
  });
}

function initMoodEmojiRow() {
  const row = $("#mood-emoji-row");
  if (!row) return;
  row.innerHTML = "";
  QUICK_MOODS.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mood-chip";
    btn.dataset.moodId = m.id;
    btn.innerHTML = `<span class="mood-emoji">${m.emoji}</span><span>${m.label}</span>`;
    btn.addEventListener("click", () => {
      selectedQuickMood = selectedQuickMood === m.id ? null : m.id;
      row.querySelectorAll(".mood-chip").forEach((c) => {
        c.classList.toggle("is-on", c.dataset.moodId === selectedQuickMood);
      });
    });
    row.appendChild(btn);
  });
}

function applyMoodTagsFromCheckin(tags) {
  const row = $("#mood-emoji-row");
  if (!row) return;
  selectedQuickMood = null;
  row.querySelectorAll(".mood-chip").forEach((c) => c.classList.remove("is-on"));
  if (!tags || !tags.length) return;
  const m = QUICK_MOODS.find((x) => tags.includes(x.tag));
  if (!m) return;
  selectedQuickMood = m.id;
  const chip = row.querySelector(`[data-mood-id="${m.id}"]`);
  chip?.classList.add("is-on");
}

function stripMoodTagFooter(text) {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n*\[Mood tags\]\s*[^\n]*$/i, "")
    .trim();
}

async function applyCheckinToForm(isoDate) {
  const r = await authFetch(`/me/checkin?date=${encodeURIComponent(isoDate)}`);
  if (!r.ok) return false;
  const c = await r.json();
  const cd = $("#checkin-date");
  if (cd) cd.value = c.date;
  $("#journal").value = stripMoodTagFooter(c.journal_text || "");
  $("#sleep").value = String(c.sleep_hours ?? 6.5);
  $("#energy").value = String(c.energy_score ?? 5);
  $("#stress").value = String(c.stress_score ?? 5);
  const eo = $("#energy-out");
  const so = $("#stress-out");
  if (eo) eo.textContent = String(c.energy_score ?? 5);
  if (so) so.textContent = String(c.stress_score ?? 5);
  applyMoodTagsFromCheckin(c.mood_tags || []);
  return true;
}

function formatPracticeDetail(p) {
  const lines = [];
  const cat = catalogCache.find((x) => x.id === p.intervention_type);
  const used = new Set();
  if (cat?.fields?.length) {
    for (const f of cat.fields) {
      const v = String(p.responses?.[f.key] ?? "").trim();
      if (!v) continue;
      lines.push(`${f.label}: ${v}`);
      used.add(f.key);
    }
  }
  if (p.responses) {
    for (const [k, v] of Object.entries(p.responses)) {
      if (used.has(k)) continue;
      const s = String(v).trim();
      if (!s) continue;
      const lab = RESPONSE_KEY_LABELS[k] || k;
      lines.push(`${lab}: ${s}`);
    }
  }
  const notes = (p.notes || "").trim();
  if (notes) lines.push(`Notes: ${notes}`);
  if (!lines.length) return "No written responses for this one.";
  return lines.join("\n");
}

function buildCheckinPayload() {
  let journal = $("#journal").value.trim();
  const tags = [];
  if (selectedQuickMood) {
    const m = QUICK_MOODS.find((x) => x.id === selectedQuickMood);
    if (m) tags.push(m.tag);
  }
  if (tags.length && !journal.includes("[Mood tags]")) {
    journal = journal
      ? `${journal}\n[Mood tags] ${tags.join(", ")}`
      : `[Mood tags] ${tags.join(", ")}`;
  }
  return {
    journal_text: journal,
    mood_tags: tags,
    sleep_hours: Number($("#sleep").value) || 0,
    energy_score: Number($("#energy").value),
    stress_score: Number($("#stress").value),
  };
}

async function refreshMe() {
  const r = await authFetch("/auth/me");
  if (!r.ok) throw new Error("Session expired — please log in again.");
  const me = await r.json();
  const greet = $("#home-greeting");
  const nm = $("#home-name");
  if (greet) greet.textContent = getGreeting();
  if (nm) nm.textContent = me.username || "friend";
  const pu = $("#profile-user");
  if (pu) pu.textContent = `Signed in as ${me.username}`;
  return me;
}

async function refreshHome() {
  const sleepEl = $("#home-sleep");
  const energyEl = $("#home-energy");
  const stressEl = $("#home-stress");
  const insights = $("#home-insights");
  if (!sleepEl) return;

  const t = await authFetch("/timeline?days=1");
  if (t.ok) {
    const data = await t.json();
    const rec = (data.records || []).find((x) => x.date === todayISO());
    if (rec) {
      sleepEl.textContent = `${rec.sleep_hours} hrs`;
      energyEl.textContent = `${Math.round((rec.energy_score / 10) * 100)}%`;
      stressEl.textContent = `${rec.stress_score}/10`;
    } else {
      sleepEl.textContent = "—";
      energyEl.textContent = "—";
      stressEl.textContent = "—";
    }
  } else {
    sleepEl.textContent = "—";
    energyEl.textContent = "—";
    stressEl.textContent = "—";
  }

  if (insights) {
    const p = await authFetch(`/daily-plan?target_date=${encodeURIComponent(todayISO())}`);
    if (p.ok) {
      const plan = await p.json();
      const bullets = [];
      if (plan.pattern?.patterns?.length) {
        plan.pattern.patterns.slice(0, 2).forEach((x) => bullets.push(`Pattern note: ${x.replace(/_/g, " ")}.`));
      }
      if (plan.emotion?.primary_emotion) {
        bullets.push(`Today’s signal leans “${plan.emotion.primary_emotion}”.`);
      }
      if (plan.risk?.risk_level && plan.risk.risk_level !== "low") {
        bullets.push("Stress or sleep may need extra care — see AI plan for ideas.");
      }
      insights.innerHTML = "";
      (bullets.length ? bullets : ["Save a check-in to see gentle insights here."]).forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        insights.appendChild(li);
      });
    } else {
      insights.innerHTML = "<li>Save a check-in to see gentle insights here.</li>";
    }
  }
}

async function loadCatalog() {
  const r = await fetch("/interventions/catalog");
  if (!r.ok) throw new Error("Could not load exercise list");
  const data = await r.json();
  catalogCache = data.items || [];
  return catalogCache;
}

function fillPracticeSelect() {
  const sel = $("#practice-pick");
  if (!sel) return;
  sel.innerHTML = "";
  catalogCache.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = catalogTitle(c);
    sel.appendChild(opt);
  });
}

function readN30ChallengeState() {
  try {
    const raw = localStorage.getItem(NATURE30_CHALLENGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return {
        startISO: o.startISO ?? null,
        daily: o.daily && typeof o.daily === "object" ? o.daily : {},
        userFinished: !!o.userFinished,
        reflection: typeof o.reflection === "string" ? o.reflection : "",
      };
    }
  } catch {
    /* ignore */
  }
  try {
    const old = JSON.parse(localStorage.getItem(NATURE_DAILY_LOG_KEY) || "{}");
    if (old && typeof old === "object" && Object.keys(old).length) {
      return { startISO: null, daily: { ...old }, userFinished: false, reflection: "" };
    }
  } catch {
    /* ignore */
  }
  return { startISO: null, daily: {}, userFinished: false, reflection: "" };
}

function writeN30ChallengeState(st) {
  localStorage.setItem(NATURE30_CHALLENGE_KEY, JSON.stringify(st));
}

function readNatureDailyLog() {
  return readN30ChallengeState().daily;
}

function writeNatureDailyLog(log) {
  const st = readN30ChallengeState();
  st.daily = log;
  writeN30ChallengeState(st);
}

function addDaysISO(isoStr, n) {
  const d = new Date(`${isoStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function n30WindowISOs(startISO) {
  const out = [];
  for (let i = 0; i < 30; i++) out.push(addDaysISO(startISO, i));
  return out;
}

function n30ChallengeEndISO(startISO) {
  return addDaysISO(startISO, 29);
}

function syncN30HiddenDailyJson() {
  const hid = $("#pf-n30_daily_json");
  if (hid) hid.value = JSON.stringify(readN30ChallengeState().daily || {});
}

function renderN30ChallengeSection() {
  const root = $("#n30-challenge-root");
  if (!root) return;
  root.innerHTML = "";
  const st = readN30ChallengeState();
  const today = todayISO();

  const h = document.createElement("h3");
  h.id = "n30-challenge-heading";
  h.className = "n30-challenge-title";
  h.textContent = "Awe walk 30×30 challenge";
  root.appendChild(h);

  const intro = document.createElement("div");
  intro.className = "n30-challenge-intro";
  intro.innerHTML = `
    <p class="n30-challenge-lede">30 minutes outside every day for 30 days. Choose your start day, then tap each day in your window to log mood and a short note.</p>
    <p class="n30-challenge-sub">Daily mood check-in — one row per day for the last 30 days — mood and a short note if you want.</p>
  `;
  root.appendChild(intro);

  if (!st.startISO) {
    const setup = document.createElement("div");
    setup.className = "n30-challenge-setup";
    const lab = document.createElement("label");
    lab.className = "n30-plain-label";
    lab.htmlFor = "n30-start-date";
    lab.textContent = "Start day";
    const row = document.createElement("div");
    row.className = "n30-start-row";
    const inp = document.createElement("input");
    inp.type = "date";
    inp.id = "n30-start-date";
    inp.className = "input-full";
    inp.max = today;
    inp.value = today;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary btn-block";
    btn.textContent = "Begin challenge";
    btn.addEventListener("click", () => {
      const v = inp.value;
      if (!v || v > today) return;
      const next = readN30ChallengeState();
      next.startISO = v;
      writeN30ChallengeState(next);
      const w = n30WindowISOs(v);
      const end = w[29];
      if (today >= v && today <= end) n30SelectedISO = today;
      else n30SelectedISO = w[0];
      renderN30ChallengeSection();
      renderHabitsLists();
    });
    row.appendChild(inp);
    setup.appendChild(lab);
    setup.appendChild(row);
    setup.appendChild(btn);
    root.appendChild(setup);
    return;
  }

  const windowDays = n30WindowISOs(st.startISO);
  const endISO = n30ChallengeEndISO(st.startISO);
  const canFinish = today >= endISO && !st.userFinished;

  const meta = document.createElement("p");
  meta.className = "meta n30-challenge-meta";
  const idxToday = windowDays.indexOf(today);
  const dayNum = idxToday >= 0 ? idxToday + 1 : null;
  meta.textContent =
    dayNum != null
      ? `Started ${st.startISO} · through ${endISO} · day ${dayNum} of 30`
      : `Started ${st.startISO} · window ${windowDays[0]}–${endISO}`;
  root.appendChild(meta);

  const cal = document.createElement("div");
  cal.className = "n30-cal";
  const wk = document.createElement("div");
  wk.className = "n30-cal-weekdays";
  ["S", "M", "T", "W", "T", "F", "S"].forEach((L) => {
    const s = document.createElement("span");
    s.textContent = L;
    wk.appendChild(s);
  });
  cal.appendChild(wk);

  const grid = document.createElement("div");
  grid.className = "n30-cal-grid";
  const first = new Date(`${windowDays[0]}T12:00:00`);
  const pad = first.getDay();
  for (let i = 0; i < pad; i++) {
    const ph = document.createElement("div");
    ph.className = "n30-cal-pad";
    grid.appendChild(ph);
  }

  windowDays.forEach((iso, idx) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "n30-cal-cell";
    const isFuture = iso > today;
    const has = !!(st.daily[iso]?.mood || (st.daily[iso]?.note || "").trim());
    if (iso === today) cell.classList.add("is-today");
    if (isFuture) cell.classList.add("is-future");
    if (has) cell.classList.add("has-data");
    if (n30SelectedISO === iso) cell.classList.add("is-selected");
    const dn = document.createElement("span");
    dn.className = "n30-cal-daynum";
    dn.textContent = String(idx + 1);
    const ds = document.createElement("span");
    ds.className = "n30-cal-dshort";
    const dt = new Date(`${iso}T12:00:00`);
    ds.textContent = `${dt.getMonth() + 1}/${dt.getDate()}`;
    cell.appendChild(dn);
    cell.appendChild(ds);
    if (has) {
      const dot = document.createElement("span");
      dot.className = "n30-cal-dot";
      cell.appendChild(dot);
    }
    cell.setAttribute(
      "aria-label",
      `Day ${idx + 1} of 30, ${iso}${isFuture ? ", upcoming" : ""}`,
    );
    cell.addEventListener("click", () => {
      n30SelectedISO = iso;
      renderN30ChallengeSection();
    });
    grid.appendChild(cell);
  });
  cal.appendChild(grid);
  root.appendChild(cal);

  if (n30SelectedISO && windowDays.includes(n30SelectedISO)) {
    const idxSel = windowDays.indexOf(n30SelectedISO);
    const panel = document.createElement("div");
    panel.className = "n30-day-panel";
    const nav = document.createElement("div");
    nav.className = "n30-day-nav";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "n30-day-nav-btn";
    prev.textContent = "← Previous day";
    prev.disabled = idxSel <= 0;
    prev.addEventListener("click", () => {
      n30SelectedISO = windowDays[idxSel - 1];
      renderN30ChallengeSection();
    });
    const next = document.createElement("button");
    next.type = "button";
    next.className = "n30-day-nav-btn";
    next.textContent = "Next day →";
    next.disabled = idxSel >= 29;
    next.addEventListener("click", () => {
      n30SelectedISO = windowDays[idxSel + 1];
      renderN30ChallengeSection();
    });
    nav.appendChild(prev);
    nav.appendChild(next);
    const ptitle = document.createElement("p");
    ptitle.className = "n30-day-panel-title";
    ptitle.textContent = `Day ${idxSel + 1} of 30 · ${n30SelectedISO}`;
    const mood = document.createElement("select");
    mood.className = "n30-plain-select";
    mood.setAttribute("aria-label", "Mood");
    mood.innerHTML = [
      '<option value="">Mood</option>',
      '<option value="1">1 — very low</option>',
      '<option value="2">2 — low</option>',
      '<option value="3">3 — okay</option>',
      '<option value="4">4 — good</option>',
      '<option value="5">5 — great</option>',
    ].join("");
    mood.value = st.daily[n30SelectedISO]?.mood || "";
    const note = document.createElement("input");
    note.type = "text";
    note.className = "n30-plain-input";
    note.placeholder = "Short note (optional)";
    note.value = st.daily[n30SelectedISO]?.note || "";
    const save = () => {
      const cur = readN30ChallengeState();
      if (!mood.value && !note.value.trim()) {
        delete cur.daily[n30SelectedISO];
      } else {
        cur.daily[n30SelectedISO] = { mood: mood.value, note: note.value.trim() };
      }
      writeN30ChallengeState(cur);
      syncN30HiddenDailyJson();
    };
    mood.addEventListener("change", save);
    note.addEventListener("input", save);
    panel.appendChild(nav);
    panel.appendChild(ptitle);
    panel.appendChild(mood);
    panel.appendChild(note);
    root.appendChild(panel);
  }

  if (canFinish) {
    const fin = document.createElement("div");
    fin.className = "n30-finish-banner";
    const p = document.createElement("p");
    p.className = "n30-finish-text";
    p.textContent = "Finished!";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-primary btn-block";
    b.textContent = "Mark finished";
    b.addEventListener("click", () => {
      const cur = readN30ChallengeState();
      cur.userFinished = true;
      writeN30ChallengeState(cur);
      renderN30ChallengeSection();
    });
    fin.appendChild(p);
    fin.appendChild(b);
    root.appendChild(fin);
  }

  if (st.userFinished) {
    const ref = document.createElement("div");
    ref.className = "n30-reflection-block";
    const rh = document.createElement("h4");
    rh.className = "n30-reflection-heading";
    rh.textContent = "When you’re done: overall reflection";
    const rp = document.createElement("p");
    rp.className = "n30-reflection-lede";
    rp.textContent =
      "At least a paragraph: completion, emotions, focus, connection, meaning, or anything else that stood out.";
    const ta = document.createElement("textarea");
    ta.className = "n30-reflection-area";
    ta.rows = 8;
    ta.value = st.reflection || "";
    ta.placeholder = "Write your reflection…";
    ta.addEventListener("input", () => {
      const cur = readN30ChallengeState();
      cur.reflection = ta.value;
      writeN30ChallengeState(cur);
      const pf = $("#pf-n30_reflection");
      if (pf) pf.value = ta.value;
    });
    ref.appendChild(rh);
    ref.appendChild(rp);
    ref.appendChild(ta);
    root.appendChild(ref);
  }

  syncN30HiddenDailyJson();
}

function renderNatureChallengeFields(item, host) {
  item.fields.forEach((f) => {
    if (f.key === "n30_daily_json") {
      const hid = document.createElement("textarea");
      hid.classList.add("hidden");
      hid.hidden = true;
      hid.dataset.key = f.key;
      hid.id = "pf-n30_daily_json";
      hid.value = JSON.stringify(readN30ChallengeState().daily || {});
      host.appendChild(hid);
      const hint = document.createElement("p");
      hint.className = "meta";
      hint.textContent =
        "Daily moods are logged on Home under Awe walk 30×30 challenge. This field updates when you save practice.";
      host.appendChild(hint);
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "practice-field-wrap";
    const lab = document.createElement("label");
    lab.htmlFor = `pf-${f.key}`;
    lab.textContent = f.label;
    const ta = document.createElement("textarea");
    ta.id = `pf-${f.key}`;
    ta.dataset.key = f.key;
    let rows = f.label.length > 140 ? 5 : 3;
    if (item.id === "cognitive_reframing") rows = 4;
    if (f.key === "n30_reflection") {
      ta.rows = 10;
      ta.value = readN30ChallengeState().reflection || "";
      ta.className = "journal-area n30-practice-reflection";
      ta.addEventListener("input", () => {
        const cur = readN30ChallengeState();
        cur.reflection = ta.value;
        writeN30ChallengeState(cur);
      });
    } else {
      ta.rows = rows;
      const defPh = "Write for yourself — messy is fine.";
      ta.placeholder = f.placeholder !== undefined ? f.placeholder : defPh;
      ta.className = "journal-area";
    }
    wrap.appendChild(lab);
    if (f.hint) {
      const hint = document.createElement("p");
      hint.className = "field-hint";
      hint.textContent = f.hint;
      wrap.appendChild(hint);
    }
    wrap.appendChild(ta);
    host.appendChild(wrap);
  });
}

function fillPracticeIntro(introHost, summaryText) {
  introHost.innerHTML = "";
  const raw = (summaryText || "").trim();
  if (!raw) return;
  const bulletLine = /^[\u2022\-*]\s+/;
  const blocks = raw.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  blocks.forEach((block) => {
    const lines = block.split("\n").map((s) => s.trim()).filter(Boolean);
    const isBulletBlock = lines.length > 0 && lines.every((ln) => bulletLine.test(ln));
    if (isBulletBlock) {
      const ul = document.createElement("ul");
      ul.className = "practice-intro-bullets";
      lines.forEach((ln) => {
        const li = document.createElement("li");
        li.textContent = ln.replace(bulletLine, "").trim();
        ul.appendChild(li);
      });
      introHost.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.className = "practice-intro-para";
      p.textContent = lines.join(" ");
      introHost.appendChild(p);
    }
  });
}

function renderPracticeFields() {
  const id = $("#practice-pick")?.value;
  const item = catalogCache.find((x) => x.id === id);
  const host = $("#practice-fields");
  const intro = $("#practice-intro");
  const hintEl = $("#practice-mode-hint");
  if (!host || !intro) return;
  host.innerHTML = "";
  intro.innerHTML = "";
  if (!item) {
    return;
  }
  if (item.id === "breathing_grounding") {
    if (hintEl) {
      hintEl.textContent =
        "Two guided options — breathing & grounding vs meditation. Optional note after you finish.";
    }
    fillPracticeIntro(intro, item.summary || "");
    const p = document.createElement("p");
    p.className = "meta practice-guided-note";
    p.textContent = "Follow audio or video first — nothing to type until you’re done.";
    const row = document.createElement("div");
    row.className = "practice-guided-pair";
    const b1 = document.createElement("button");
    b1.type = "button";
    b1.className = "btn btn-primary btn-block";
    b1.textContent = "Breathing & grounding";
    b1.addEventListener("click", () => showSession("breathing", "breathing"));
    const b2 = document.createElement("button");
    b2.type = "button";
    b2.className = "btn btn-outline btn-block";
    b2.textContent = "Meditation";
    b2.addEventListener("click", () => showSession("breathing", "meditation"));
    row.appendChild(b1);
    row.appendChild(b2);
    host.appendChild(p);
    host.appendChild(row);
    return;
  }
  if (item.session_type === "meditation") {
    if (hintEl) {
      hintEl.textContent = "Guided session — open below. Optional note after you finish.";
    }
    fillPracticeIntro(intro, item.summary || "");
    const p = document.createElement("p");
    p.className = "meta practice-guided-note";
    p.textContent = "Follow audio or video first — nothing to type until you’re done.";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary btn-block";
    btn.textContent = "Open guided meditation";
    btn.addEventListener("click", () => showSession("breathing", "meditation"));
    host.appendChild(p);
    host.appendChild(btn);
    return;
  }
  fillPracticeIntro(intro, item.summary || "");
  if (item.duration_approx) {
    const dm = document.createElement("p");
    dm.className = "meta practice-duration-meta";
    dm.textContent = item.duration_approx;
    intro.appendChild(dm);
  }
  if (item.id === "nature_challenge_30x30_wb2") {
    renderNatureChallengeFields(item, host);
    return;
  }
  const defaultPlaceholder = "Write for yourself — messy is fine.";
  item.fields.forEach((f) => {
    const wrap = document.createElement("div");
    wrap.className = "practice-field-wrap";
    const lab = document.createElement("label");
    lab.htmlFor = `pf-${f.key}`;
    lab.textContent = f.label;
    if ((f.label || "").includes("\n")) {
      lab.classList.add("practice-field-label--multiline");
    }
    const ta = document.createElement("textarea");
    ta.id = `pf-${f.key}`;
    ta.dataset.key = f.key;
    let rows = f.label.length > 140 ? 5 : 3;
    if (item.id === "cognitive_reframing") rows = 4;
    ta.rows = rows;
    ta.placeholder = f.placeholder !== undefined ? f.placeholder : defaultPlaceholder;
    ta.className = "journal-area";
    wrap.appendChild(lab);
    if (f.hint) {
      const hint = document.createElement("p");
      hint.className = "field-hint";
      hint.textContent = f.hint;
      wrap.appendChild(hint);
    }
    wrap.appendChild(ta);
    host.appendChild(wrap);
  });
}

function collectPracticeResponses() {
  const out = {};
  $$("#practice-fields textarea[data-key]").forEach((ta) => {
    out[ta.dataset.key] = ta.value.trim();
  });
  return out;
}

function setRecommendedPlan(sel, inv, dateStr) {
  window.__recExercise = sel;
  window.__recDate = dateStr;
  const wrap = $("#dash-recommended");
  const title = $("#plan-rec-title");
  const meta = $("#plan-rec-meta");
  const desc = $("#plan-rec-desc");
  if (title) title.textContent = interventionLabels[sel] || sel;
  if (meta) {
    const dm = inv?.duration_min;
    const ok = dm != null && dm !== "" && Number.isFinite(Number(dm));
    meta.textContent = ok ? `About ${dm} minutes` : "Flexible length";
  }
  if (desc) desc.textContent = inv.reason || "";
  if (wrap) wrap.classList.remove("hidden");
}

function exerciseGroup(c) {
  if (c.id === "breathing_grounding") return "mental_wellness";
  if (c.session_type === "meditation") return "mental_wellness";
  if (c.id === "nature_challenge_30x30_wb2") return "nature30";
  if (c.category === "assessment") return "interesting_assessments";
  if (c.category === "curriculum") return "curriculum";
  if (c.category === "nature30") return "nature30";
  return "reflection";
}

const GROUP_LABELS = {
  mental_wellness: "Mental wellness exercise",
  interesting_assessments: "Interesting assessments",
  reflection: "Reflection & writing",
  curriculum: "Deeper curriculum",
  nature30: "Awe walk 30×30",
};

function openPracticeExercise(exerciseId) {
  showTab("profile");
  const pick = $("#practice-pick");
  if (pick) pick.value = exerciseId;
  const pd = $("#practice-date");
  if (pd) pd.value = todayISO();
  renderPracticeFields();
}

function openExerciseFromPlan(c) {
  if (c.id === "breathing_grounding") {
    showSession("breathing", "breathing");
    return;
  }
  if (c.session_type === "meditation") {
    showSession("breathing", "meditation");
    return;
  }
  openPracticeExercise(c.id);
}

function fillPlanDashboard(recommendedId) {
  const host = $("#plan-dashboard");
  if (!host) return;
  host.innerHTML = "";
  const sorted = [...catalogCache].sort((a, b) => {
    const go = (x) => exerciseGroup(x);
    const order = {
      mental_wellness: 0,
      interesting_assessments: 1,
      reflection: 2,
      curriculum: 3,
      nature30: 4,
    };
    const d = (order[go(a)] ?? 99) - (order[go(b)] ?? 99);
    if (d !== 0) return d;
    return String(catalogTitle(a)).localeCompare(String(catalogTitle(b)), "en");
  });
  const groups = [
    "mental_wellness",
    "interesting_assessments",
    "reflection",
    "curriculum",
    "nature30",
  ];
  groups.forEach((gkey) => {
    const items = sorted.filter((c) => exerciseGroup(c) === gkey);
    if (!items.length && gkey !== "mental_wellness") return;
    const section = document.createElement("div");
    section.className = "plan-dash-section";
    const h = document.createElement("h4");
    h.className = "plan-dash-group-title";
    h.textContent = GROUP_LABELS[gkey];
    const grid = document.createElement("div");
    grid.className = "plan-dash-grid";
    if (gkey === "mental_wellness") {
      let cardIdx = 0;
      const breath = items.find((c) => c.id === "breathing_grounding");
      const rest = items.filter((c) => c.id !== "breathing_grounding");
      const appendCatalogCard = (c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "plan-dash-card plan-dash-card--photo" + (c.id === recommendedId ? " is-rec" : "");
        const bg = PLAN_CARD_BACKGROUNDS[cardIdx % PLAN_CARD_BACKGROUNDS.length];
        cardIdx += 1;
        btn.style.backgroundImage = `linear-gradient(165deg, rgba(45,49,66,0.25) 0%, rgba(45,49,66,0.65) 100%), url(${bg})`;
        btn.style.backgroundSize = "cover";
        btn.style.backgroundPosition = "center";
        const sum = c.summary.length > 90 ? `${c.summary.slice(0, 90)}…` : c.summary;
        const dur = c.duration_approx ? ` · ${c.duration_approx}` : "";
        btn.innerHTML = `<strong>${catalogTitle(c)}</strong><small>${sum}${dur}</small>`;
        btn.addEventListener("click", () => openExerciseFromPlan(c));
        grid.appendChild(btn);
      };
      if (breath) appendCatalogCard(breath);
      const synth = document.createElement("button");
      synth.type = "button";
      synth.className = "plan-dash-card plan-dash-card--photo";
      const bgSynth = PLAN_CARD_BACKGROUNDS[cardIdx % PLAN_CARD_BACKGROUNDS.length];
      cardIdx += 1;
      synth.style.backgroundImage = `linear-gradient(165deg, rgba(45,49,66,0.25) 0%, rgba(45,49,66,0.65) 100%), url(${bgSynth})`;
      synth.style.backgroundSize = "cover";
      synth.style.backgroundPosition = "center";
      synth.innerHTML =
        "<strong>Meditation (guided)</strong><small>Calm-focused practice — separate from breathing & grounding.</small>";
      synth.addEventListener("click", () => showSession("breathing", "meditation"));
      grid.appendChild(synth);
      rest.forEach((c) => appendCatalogCard(c));
    } else {
      items.forEach((c, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "plan-dash-card plan-dash-card--photo" + (c.id === recommendedId ? " is-rec" : "");
        const bg = PLAN_CARD_BACKGROUNDS[idx % PLAN_CARD_BACKGROUNDS.length];
        btn.style.backgroundImage = `linear-gradient(165deg, rgba(45,49,66,0.25) 0%, rgba(45,49,66,0.65) 100%), url(${bg})`;
        btn.style.backgroundSize = "cover";
        btn.style.backgroundPosition = "center";
        const sum = c.summary.length > 90 ? `${c.summary.slice(0, 90)}…` : c.summary;
        const dur = c.duration_approx ? ` · ${c.duration_approx}` : "";
        btn.innerHTML = `<strong>${catalogTitle(c)}</strong><small>${sum}${dur}</small>`;
        btn.addEventListener("click", () => openExerciseFromPlan(c));
        grid.appendChild(btn);
      });
    }
    section.appendChild(h);
    section.appendChild(grid);
    host.appendChild(section);
  });
}

async function loadDashboard() {
  const err = $("#dash-error");
  const hint = $("#dash-hint");
  const recWrap = $("#dash-recommended");
  const why = $("#plan-why-text");
  const analysis = $("#analysis-block");
  if (err) {
    err.textContent = "";
    err.classList.add("hidden");
  }
  if (recWrap) recWrap.classList.add("hidden");
  if (analysis) analysis.classList.add("hidden");
  if (why) why.textContent = "";

  await loadCatalog();
  fillPlanDashboard(null);

  const d = todayISO();
  const r = await authFetch(`/daily-plan?target_date=${encodeURIComponent(d)}`);
  if (r.status === 404) {
    if (hint) {
      hint.textContent =
        "No check-in for today yet. Do a check-in first — then you’ll see a recommendation and horizontal picks.";
    }
    if (why) why.textContent = "We’ll explain the pick once today’s check-in exists.";
    return;
  }
  if (!r.ok) {
    const t = await r.json().catch(() => ({}));
    if (err) {
      err.textContent = t.detail || r.statusText;
      err.classList.remove("hidden");
    }
    return;
  }
  if (hint) {
    hint.textContent = "Based on your latest check-in. Tap any card to open it in Practice.";
  }
  const plan = await r.json();
  const inv = plan.intervention;
  const sel = inv.selected_intervention;
  setRecommendedPlan(sel, inv, d);
  fillPlanDashboard(sel);
  if (why) why.textContent = inv.reason || "";
}

let journalPage = 1;
const journalPerPage = 1;

async function loadJournalPage() {
  const elEmpty = $("#journal-empty");
  const elBody = $("#journal-content");
  const elMeta = $("#journal-meta");
  const lbl = $("#journal-page-label");
  const r = await authFetch(`/me/journals?page=${journalPage}&per_page=${journalPerPage}`);
  if (!r.ok) throw new Error("Could not load journals");
  const data = await r.json();
  const total = data.total;
  const maxPage = Math.max(1, Math.ceil(total / journalPerPage));
  if (total > 0 && journalPage > maxPage) {
    journalPage = maxPage;
    return loadJournalPage();
  }
  const items = data.items;
  if (lbl) lbl.textContent = total === 0 ? "0 / 0" : `${journalPage} / ${maxPage}`;

  const editBtn = $("#btn-edit-checkin");
  if (total === 0) {
    elEmpty?.classList.remove("hidden");
    elBody?.classList.add("hidden");
    if (elMeta) elMeta.textContent = "";
    editBtn?.classList.add("hidden");
    window.__journalEditDate = null;
    return;
  }
  if (items.length === 0) {
    journalPage = maxPage;
    return loadJournalPage();
  }
  elEmpty?.classList.add("hidden");
  elBody?.classList.remove("hidden");
  const it = items[0];
  window.__journalEditDate = it.date;
  editBtn?.classList.remove("hidden");
  const jd = $("#journal-date");
  if (jd) jd.textContent = `Date: ${it.date}`;
  if (elBody) elBody.textContent = stripMoodTagFooter(it.journal_text || "") || "(No text)";
  if (elMeta) {
    elMeta.textContent = `Mood tags: ${(it.mood_tags || []).join(", ") || "—"} · Sleep ${it.sleep_hours}h · Energy ${it.energy_score}/10 · Stress ${it.stress_score}/10`;
  }
}

async function loadPracticeDates() {
  const r = await authFetch("/me/practice-dates");
  if (!r.ok) return;
  const data = await r.json();
  const dates = data.dates || [];
  const inp = $("#practice-filter-date");
  if (inp) {
    if (dates.length) inp.value = dates[0];
    else inp.value = todayISO();
  }
  await loadPracticeForSelectedDate();
}

async function loadPracticeForSelectedDate() {
  const d = $("#practice-filter-date")?.value || todayISO();
  const list = $("#practice-history");
  const empty = $("#profile-practice-empty");
  if (!list) return;
  list.innerHTML = "";
  const r = await authFetch(`/me/practices?date=${encodeURIComponent(d)}`);
  if (!r.ok) return;
  const data = await r.json();
  const prs = data.practices || [];
  if (prs.length === 0) {
    empty?.classList.remove("hidden");
    return;
  }
  empty?.classList.add("hidden");
  prs.forEach((p) => {
    const li = document.createElement("li");
    li.className = "practice-log-item";
    const title = interventionLabels[p.intervention_type] || p.intervention_type;
    const status = p.completed ? "Completed" : "Partial";
    const head = document.createElement("div");
    head.className = "practice-log-head";
    const tEl = document.createElement("strong");
    tEl.className = "practice-log-title";
    tEl.textContent = title;
    const stEl = document.createElement("span");
    stEl.className = "practice-log-status";
    stEl.textContent = `${status} · helpful ${p.helpfulness}/5`;
    head.appendChild(tEl);
    head.appendChild(stEl);
    const body = document.createElement("div");
    body.className = "practice-log-body";
    body.textContent = formatPracticeDetail(p);
    li.appendChild(head);
    li.appendChild(body);
    list.appendChild(li);
  });
}

function bindSliders() {
  ["energy", "stress"].forEach((id) => {
    const range = $(`#${id}`);
    const out = $(`#${id}-out`);
    if (range && out) {
      out.textContent = range.value;
      range.addEventListener("input", () => {
        out.textContent = range.value;
      });
    }
  });
}

function renderPlan(data) {
  const analysis = $("#analysis-block");
  if (analysis) analysis.classList.remove("hidden");
  $("#out-emotion").textContent = data.emotion.primary_emotion;
  $("#out-trend").textContent = data.pattern.trend;
  $("#out-patterns").textContent =
    data.pattern.patterns.length > 0 ? data.pattern.patterns.join(" · ") : "(No strong pattern flagged)";

  const ol = $("#out-steps");
  if (ol) {
    ol.innerHTML = "";
    data.intervention.steps.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      ol.appendChild(li);
    });
  }

  const risk = data.risk;
  const riskEl = $("#out-risk");
  if (riskEl) {
    riskEl.className = "risk compact " + (risk.risk_level || "");
    riskEl.innerHTML = `
    <strong>Safety (not medical advice)</strong>
    <p><span class="pill">${risk.risk_level}</span> ${risk.safe_response}</p>
    <p class="meta">${risk.resource_suggestions.join(" · ")}</p>`;
  }
}

async function doCheckin() {
  const err = $("#checkin-error");
  const msg = $("#checkin-msg");
  if (err) {
    err.textContent = "";
    err.classList.add("hidden");
  }
  if (msg) msg.textContent = "";

  const targetDate = $("#checkin-date")?.value || todayISO();
  const body = buildCheckinPayload();

  try {
    sessionStorage.setItem("mindpath_last_mood_tags", JSON.stringify(body.mood_tags || []));
  } catch {
    /* ignore */
  }

  const saveRes = await authFetch(`/checkin?target_date=${encodeURIComponent(targetDate)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!saveRes.ok) {
    const detail = await saveRes.json().catch(() => ({}));
    if (err) {
      err.textContent = detail.detail || saveRes.statusText;
      err.classList.remove("hidden");
    }
    return;
  }

  if (msg) msg.textContent = "Saved (new or updated). Here’s your plan.";

  const planRes = await authFetch(`/daily-plan?target_date=${encodeURIComponent(targetDate)}`);
  if (!planRes.ok) {
    const detail = await planRes.json().catch(() => ({}));
    if (err) {
      err.textContent = detail.detail || planRes.statusText;
      err.classList.remove("hidden");
    }
    return;
  }

  const data = await planRes.json();
  renderPlan(data);
  const inv = data.intervention;
  setRecommendedPlan(inv.selected_intervention, inv, targetDate);
  fillPlanDashboard(inv.selected_intervention);
  const why = $("#plan-why-text");
  if (why) why.textContent = inv.reason || "";
  showTab("plan");
  await refreshHome();
}

async function loadHistoryData() {
  const r = await authFetch(`/timeline?days=${historyDays}`);
  if (!r.ok) return;
  const data = await r.json();
  const records = (data.records || []).slice().reverse();
  renderStressChart(records);
  const host = $("#history-insights");
  if (!host) return;
  host.innerHTML = "";
  if (records.length < 2) {
    host.innerHTML = '<div class="mini-insight">Log a few check-ins to see stress trends.</div>';
    return;
  }
  const stresses = records.map((x) => x.stress_score);
  const avg = stresses.reduce((a, b) => a + b, 0) / stresses.length;
  const late = records.filter((_, i) => i >= Math.floor(records.length * 0.6));
  const lateAvg = late.length ? late.reduce((s, x) => s + x.stress_score, 0) / late.length : avg;
  const cards = [
    {
      t: "Stress average",
      b: `About ${avg.toFixed(1)}/10 over this window.`,
    },
    {
      t: "Recent days",
      b: lateAvg > avg + 0.5 ? "Stress has crept up toward the end of this range." : "Stress looks fairly steady lately.",
    },
    {
      t: "Sleep & mood",
      b: "Low sleep often pairs with higher stress — compare your own entries in Profile.",
    },
  ];
  cards.forEach((c) => {
    const div = document.createElement("div");
    div.className = "mini-insight";
    div.innerHTML = `<strong>${c.t}</strong><p class="meta">${c.b}</p>`;
    host.appendChild(div);
  });
}

function renderStressChart(records) {
  const svg = $("#history-chart");
  if (!svg || !records.length) return;
  const w = 300;
  const h = 120;
  const pad = 12;
  const stresses = records.map((r) => r.stress_score);
  const minS = 1;
  const maxS = 10;
  const xStep = records.length > 1 ? (w - pad * 2) / (records.length - 1) : 0;
  const pts = stresses.map((s, i) => {
    const x = pad + i * xStep;
    const y = pad + ((maxS - s) / (maxS - minS)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const line = pts.join(" ");
  svg.innerHTML = `
    <line class="grid" x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" />
    <polyline class="line" points="${line}" />
    ${stresses
      .map((s, i) => {
        const x = pad + i * xStep;
        const y = pad + ((maxS - s) / (maxS - minS)) * (h - pad * 2);
        return `<circle class="dot" cx="${x}" cy="${y}" r="3" />`;
      })
      .join("")}
  `;
}

function stopPad() {
  if (!padNodes) return;
  try {
    padNodes.f1.stop();
    padNodes.f2.stop();
    padNodes.ctx.close();
  } catch {
    /* ignore */
  }
  padNodes = null;
}

function startPad() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const g = ctx.createGain();
  g.gain.value = 0.35 * 0.08;
  const f1 = ctx.createOscillator();
  const f2 = ctx.createOscillator();
  f1.type = "sine";
  f2.type = "sine";
  f1.frequency.value = 196;
  f2.frequency.value = 293.66;
  f1.connect(g);
  f2.connect(g);
  g.connect(ctx.destination);
  f1.start();
  f2.start();
  padNodes = { ctx, f1, f2, g };
}

function rollingDates(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function monthElapsedISOs() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  const out = [];
  for (let d = 1; d <= today; d++) {
    const dt = new Date(y, m, d);
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

function habitCalendarCells() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayN = now.getDate();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(y, m, d).toISOString().slice(0, 10);
    cells.push({ day: d, iso, future: d > todayN });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function habitPeriodStats(checks) {
  if (habitRollingDays === 7) {
    const period = rollingDates(7);
    let n = 0;
    period.forEach((d) => {
      if (checks[d]) n++;
    });
    return { period, n, max: 7, mode: "week" };
  }
  const period = monthElapsedISOs();
  let n = 0;
  period.forEach((d) => {
    if (checks[d]) n++;
  });
  return { period, n, max: period.length, mode: "month" };
}

function loadHabitsState() {
  let raw = localStorage.getItem(HABITS_STORAGE_KEY);
  if (!raw) {
    const legacy = localStorage.getItem(HABITS_LEGACY_V2_KEY);
    if (legacy) {
      localStorage.setItem(HABITS_STORAGE_KEY, legacy);
      raw = legacy;
    }
  }
  let state;
  try {
    if (raw) state = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  if (!state) {
    state = { items: [], checks: {} };
  }
  if (!Array.isArray(state.items)) state.items = [];
  if (!state.checks || typeof state.checks !== "object") state.checks = {};
  state.items.forEach((it) => {
    if (!state.checks[it.id]) state.checks[it.id] = {};
  });
  return state;
}

function saveHabitsState(state) {
  localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(state));
}

function openExpandedBPSPractice() {
  openPracticeExercise("best_possible_self_expanded_wb2");
}

function openThreeGTPractice() {
  openPracticeExercise("three_good_things_wb2");
}

function openNature30Practice() {
  showTab("home");
  requestAnimationFrame(() => {
    $("#n30-challenge-root")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function deleteHabitById(habitId) {
  const st = loadHabitsState();
  st.items = st.items.filter((x) => x.id !== habitId);
  delete st.checks[habitId];
  saveHabitsState(st);
  renderHabitsLists();
}

function fillHabitManageList() {
  const wrap = $("#habit-dash-your-list-wrap");
  const list = $("#habit-dash-your-list");
  if (!wrap || !list) return;
  const state = loadHabitsState();
  list.innerHTML = "";
  if (!state.items.length) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  state.items.forEach((h) => {
    const li = document.createElement("li");
    li.className = "habit-manage-item";
    const span = document.createElement("span");
    span.className = "habit-manage-title";
    span.textContent = h.title;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn btn-ghost habit-manage-remove";
    rm.textContent = "Remove";
    rm.setAttribute("aria-label", `Remove ${h.title}`);
    rm.addEventListener("click", () => {
      if (window.confirm("Remove this habit from your list?")) {
        deleteHabitById(h.id);
        fillHabitDashboardChips();
      }
    });
    li.appendChild(span);
    li.appendChild(rm);
    list.appendChild(li);
  });
}

function renderHabitRow(h, state, container) {
  const checks = state.checks[h.id] || {};
  const stats = habitPeriodStats(checks);
  const { n, max, mode } = stats;
  const safeMax = Math.max(1, max);

  const wrap = document.createElement("div");
  wrap.className = "habit-track-block";
  wrap.dataset.habitId = h.id;

  const row = document.createElement("div");
  row.className = "habit-row";
  const head = document.createElement("div");
  head.className = "habit-row-head";
  const text = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "habit-title";
  title.textContent = h.title;
  const prog = document.createElement("p");
  prog.className = "habit-progress-text";
  prog.textContent =
    mode === "month" ? `${n} / ${max} days this month` : `${n} / ${max} days`;
  text.appendChild(title);
  if (h.id === "bps_expanded_week") {
    const open = document.createElement("button");
    open.type = "button";
    open.className = "btn btn-ghost habit-open-practice";
    open.textContent = "Open writing page";
    open.addEventListener("click", openExpandedBPSPractice);
    text.appendChild(open);
  }
  if (h.id === "tgt_three_week") {
    const open = document.createElement("button");
    open.type = "button";
    open.className = "btn btn-ghost habit-open-practice";
    open.textContent = "Open writing page";
    open.addEventListener("click", openThreeGTPractice);
    text.appendChild(open);
  }
  if (h.id === "n30_habit") {
    const open = document.createElement("button");
    open.type = "button";
    open.className = "btn btn-ghost habit-open-practice";
    open.textContent = "Open awe walk 30×30";
    open.addEventListener("click", openNature30Practice);
    text.appendChild(open);
  }
  text.appendChild(prog);
  const today = todayISO();
  const isOn = !!checks[today];
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "habit-check";
  toggle.setAttribute("aria-label", "Check in for today");
  toggle.setAttribute("aria-pressed", isOn ? "true" : "false");
  toggle.textContent = isOn ? "✓" : "";
  toggle.addEventListener("click", () => {
    const st = loadHabitsState();
    if (!st.checks[h.id]) st.checks[h.id] = {};
    const cur = !!st.checks[h.id][today];
    if (cur) delete st.checks[h.id][today];
    else st.checks[h.id][today] = true;
    saveHabitsState(st);
    renderHabitsLists();
  });
  head.appendChild(text);
  head.appendChild(toggle);
  row.appendChild(head);

  const toggleDay = (d) => {
    const st = loadHabitsState();
    if (!st.checks[h.id]) st.checks[h.id] = {};
    if (st.checks[h.id][d]) delete st.checks[h.id][d];
    else st.checks[h.id][d] = true;
    saveHabitsState(st);
    renderHabitsLists();
  };

  if (mode === "week") {
    const weekRow = document.createElement("div");
    weekRow.className = "habit-week";
    const dow = ["S", "M", "T", "W", "T", "F", "S"];
    stats.period.forEach((d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "habit-day" + (checks[d] ? " on" : "");
      const dt = new Date(`${d}T12:00:00`);
      b.textContent = dow[dt.getDay()];
      b.title = d;
      b.setAttribute("aria-pressed", checks[d] ? "true" : "false");
      b.setAttribute("aria-label", `Toggle ${d}`);
      b.addEventListener("click", () => toggleDay(d));
      weekRow.appendChild(b);
    });
    row.appendChild(weekRow);
  } else {
    const cal = document.createElement("div");
    cal.className = "habit-cal";
    const wk = document.createElement("div");
    wk.className = "habit-cal-weekdays";
    ["S", "M", "T", "W", "T", "F", "S"].forEach((L) => {
      const s = document.createElement("span");
      s.textContent = L;
      wk.appendChild(s);
    });
    cal.appendChild(wk);
    const grid = document.createElement("div");
    grid.className = "habit-cal-grid";
    habitCalendarCells().forEach((cell) => {
      const b = document.createElement("button");
      b.type = "button";
      if (!cell) {
        b.className = "habit-cal-cell habit-cal-cell--pad";
        b.disabled = true;
        b.textContent = "";
      } else {
        b.className =
          "habit-cal-cell" +
          (checks[cell.iso] ? " on" : "") +
          (cell.future ? " future" : "");
        b.textContent = String(cell.day);
        b.title = cell.iso;
        b.disabled = cell.future;
        b.setAttribute("aria-pressed", checks[cell.iso] ? "true" : "false");
        b.setAttribute("aria-label", `Toggle ${cell.iso}`);
        if (!cell.future) b.addEventListener("click", () => toggleDay(cell.iso));
      }
      grid.appendChild(b);
    });
    cal.appendChild(grid);
    row.appendChild(cal);
  }

  const track = document.createElement("div");
  track.className = "habit-progress-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuenow", String(n));
  track.setAttribute("aria-valuemax", String(max));
  const fill = document.createElement("span");
  fill.className = "habit-progress-fill";
  fill.style.width = `calc(100% * ${n} / ${safeMax})`;
  track.appendChild(fill);
  row.appendChild(track);

  wrap.appendChild(row);
  container.appendChild(wrap);
}

function fillHabitDashboardChips() {
  fillHabitManageList();
  const state = loadHabitsState();
  const have = new Set(state.items.map((x) => x.id));
  const presets = $("#habit-dash-presets");
  const sugg = $("#habit-dash-suggested");
  if (presets) {
    presets.innerHTML = "";
    HABIT_PRESETS.forEach((rec) => {
      if (have.has(rec.id)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "habit-rec-chip";
      btn.textContent = rec.title;
      btn.addEventListener("click", () => {
        const st = loadHabitsState();
        if (st.items.some((x) => x.id === rec.id)) return;
        st.items.push({ id: rec.id, title: rec.title });
        st.checks[rec.id] = {};
        saveHabitsState(st);
        fillHabitDashboardChips();
        renderHabitsLists();
        const hint = $("#habits-add-hint");
        if (hint) {
          hint.textContent = "Added to Home.";
          hint.classList.remove("hidden");
        }
      });
      presets.appendChild(btn);
    });
    if (!presets.children.length) {
      const p = document.createElement("p");
      p.className = "meta soft";
      p.textContent = "All course habits are on your Home list.";
      presets.appendChild(p);
    }
  }
  if (sugg) {
    sugg.innerHTML = "";
    HABIT_RECOMMENDATIONS.forEach((rec) => {
      if (have.has(rec.id)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "habit-rec-chip";
      btn.textContent = rec.title;
      btn.addEventListener("click", () => {
        const st = loadHabitsState();
        if (st.items.some((x) => x.id === rec.id)) return;
        st.items.push({ id: rec.id, title: rec.title });
        st.checks[rec.id] = {};
        saveHabitsState(st);
        fillHabitDashboardChips();
        renderHabitsLists();
        const hint = $("#habits-add-hint");
        if (hint) {
          hint.textContent = "Added to Home.";
          hint.classList.remove("hidden");
        }
      });
      sugg.appendChild(btn);
    });
    if (!sugg.children.length) {
      const p = document.createElement("p");
      p.className = "meta soft";
      p.textContent = "You’ve added these quick ideas.";
      sugg.appendChild(p);
    }
  }
}

function setHabitDashboardOpen(open) {
  const dash = $("#habit-dashboard");
  if (!dash) return;
  dash.classList.toggle("hidden", !open);
  dash.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) fillHabitDashboardChips();
}

function renderHabitsLists() {
  const state = loadHabitsState();
  const home = $("#habits-tracker-list");
  const hist = $("#history-habits-embed");
  if (home) {
    home.innerHTML = "";
    if (!state.items.length) {
      const empty = document.createElement("p");
      empty.className = "meta habits-empty";
      empty.textContent = "No habits yet — tap + Add habit to choose from course habits or add your own.";
      home.appendChild(empty);
    } else {
      state.items.forEach((h) => renderHabitRow(h, state, home));
    }
  }
  if (hist) {
    hist.innerHTML = "";
    if (!state.items.length) {
      const empty = document.createElement("p");
      empty.className = "meta habits-empty";
      empty.textContent = "No habits on your list yet.";
      hist.appendChild(empty);
    } else {
      state.items.forEach((h) => renderHabitRow(h, state, hist));
    }
  }
  renderN30ChallengeSection();
}

function applyGuidedSessionVideo() {
  const el = $("#session-video-guided");
  if (!el) return;
  const key = sessionGuidedVariant === "meditation" ? "meditation" : "breathing";
  el.src = SESSION_VIDEO_EMBED[key] || SESSION_VIDEO_EMBED.breathing;
}

function showSession(kind, guidedMode) {
  stopPad();
  sessionReturnTab =
    document.querySelector(".bottom-nav .nav-item.active")?.getAttribute("data-tab") || "home";
  $$(".screen").forEach((s) => s.classList.remove("is-active"));
  const sess = $("#screen-session");
  const guided = $("#session-body-guided");
  const wind = $("#session-body-winddown");
  if (kind === "breathing") {
    if (guidedMode === "meditation" || guidedMode === "breathing") {
      sessionGuidedVariant = guidedMode;
    } else {
      sessionGuidedVariant = "breathing";
    }
    $("#session-title").textContent =
      sessionGuidedVariant === "meditation" ? "Meditation" : "Breathing & grounding";
    guided?.classList.remove("hidden");
    guided?.setAttribute("data-guided-variant", sessionGuidedVariant);
    wind?.classList.add("hidden");
    applyGuidedSessionVideo();
    resetBreathingSessionUi();
  } else {
    $("#session-title").textContent = "Wind-down routine";
    wind?.classList.remove("hidden");
    guided?.classList.add("hidden");
    $("#session-after-winddown")?.classList.add("hidden");
    $("#winddown-reflection").value = "";
  }
  sess?.classList.add("is-active");
  sess?.setAttribute("aria-hidden", "false");
  document.querySelector(".phone-shell")?.classList.add("session-open");
}

function hideSession() {
  const sess = $("#screen-session");
  sess?.classList.remove("is-active");
  sess?.setAttribute("aria-hidden", "true");
  document.querySelector(".phone-shell")?.classList.remove("session-open");
  if (sessionTimerId) {
    clearInterval(sessionTimerId);
    sessionTimerId = null;
  }
  stopSessionSound();
  showTab(sessionReturnTab);
}

function resetBreathingSessionUi() {
  sessionSecondsLeft = getDefaultSessionSeconds();
  $("#session-timer-display").textContent = formatSessionCountdown(sessionSecondsLeft);
  $("#session-after-breathing")?.classList.add("hidden");
  $("#session-reflection").value = "";
  $("#btn-session-timer-toggle").textContent =
    sessionGuidedVariant === "meditation" ? "Start 10-minute timer" : "Start 2-minute timer";
  if (sessionGuidedVariant === "meditation") {
    const sm = $("#session-music-mode");
    if (sm) sm.value = "youtube";
    $("#session-phase").textContent = SESSION_WELLNESS_INSTRUCTION;
  } else {
    $("#session-phase").textContent = SESSION_BREATHING_PHASE;
  }
  setGuidedSessionTimerPaused(false);
  const orb = $("#breath-orb");
  orb?.classList.remove("is-exhale");
  updateSessionMusicNote();
}

function getSessionMusicModeValue() {
  let raw = $("#session-music-mode")?.value || "youtube";
  if (raw === "stream" || raw === "mood" || raw === "pad") raw = "youtube";
  return raw;
}

function updateSessionMusicNote() {
  const el = $("#session-music-note");
  if (!el) return;
  const mode = getSessionMusicModeValue();
  if (mode === "off") {
    el.textContent = "";
    return;
  }
  el.textContent = "Starts the chill playlist on YouTube when you start the timer.";
}

function stopSessionSound() {
  stopPad();
  const a = $("#session-youtube-audio");
  if (a) a.src = "";
  const w = $("#session-youtube-audio-wrap");
  w?.classList.add("hidden");
  w?.setAttribute("aria-hidden", "true");
}

function startSessionSoundForMode() {
  stopSessionSound();
  const mode = getSessionMusicModeValue();
  if (mode === "off") return;
  const a = $("#session-youtube-audio");
  const wrap = $("#session-youtube-audio-wrap");
  const base = SESSION_SOUND_EMBED.breathing;
  if (a && wrap && base) {
    a.src = `${base}&autoplay=1`;
    wrap.classList.remove("hidden");
    wrap.setAttribute("aria-hidden", "false");
  }
}

function updateTimerDisplay() {
  const el = $("#session-timer-display");
  if (el) el.textContent = formatSessionCountdown(sessionSecondsLeft);
}

function initSessionControls() {
  $("#btn-session-close")?.addEventListener("click", hideSession);

  $("#btn-session-timer-toggle")?.addEventListener("click", () => {
    const btn = $("#btn-session-timer-toggle");
    if (sessionTimerId) {
      clearInterval(sessionTimerId);
      sessionTimerId = null;
      btn.textContent = "Resume";
      stopSessionSound();
      setGuidedSessionTimerPaused(true);
      return;
    }
    if (sessionSecondsLeft <= 0) {
      sessionSecondsLeft = getDefaultSessionSeconds();
      updateTimerDisplay();
      $("#session-after-breathing")?.classList.add("hidden");
      $("#session-phase").textContent =
        sessionGuidedVariant === "meditation" ? SESSION_WELLNESS_INSTRUCTION : SESSION_BREATHING_PHASE;
    }
    btn.textContent = "Pause";
    setGuidedSessionTimerPaused(false);
    startSessionSoundForMode();
    const orb = $("#breath-orb");
    sessionTimerId = setInterval(() => {
      sessionSecondsLeft -= 1;
      updateTimerDisplay();
      orb?.classList.toggle("is-exhale", sessionSecondsLeft % 10 < 6);
      if (sessionSecondsLeft <= 0) {
        clearInterval(sessionTimerId);
        sessionTimerId = null;
        btn.textContent = "Start again";
        stopSessionSound();
        setGuidedSessionTimerPaused(false);
        $("#session-after-breathing")?.classList.remove("hidden");
        $("#session-phase").textContent = "Done — optional note below.";
      }
    }, 1000);
  });

  $("#session-music-mode")?.addEventListener("change", () => {
    updateSessionMusicNote();
    if (sessionTimerId) {
      stopSessionSound();
      startSessionSoundForMode();
    }
  });

  $("#btn-session-save-breathing")?.addEventListener("click", async () => {
    const err = $("#practice-error");
    err?.classList.add("hidden");
    const reflection = $("#session-reflection")?.value.trim() || "";
    const body = {
      date: todayISO(),
      intervention_type: "breathing_grounding",
      completed: true,
      helpfulness: 4,
      notes: "",
      responses: reflection ? { after_note: reflection } : {},
    };
    const r = await authFetch("/practice/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      if (err) {
        err.textContent = d.detail || "Could not save";
        err.classList.remove("hidden");
      }
      return;
    }
    hideSession();
    showTab("profile");
    $("#practice-pick").value = "breathing_grounding";
    const msg = $("#practice-msg");
    if (msg) {
      msg.textContent = "Breathing session saved.";
      msg.classList.remove("hidden");
    }
  });

  $("#btn-winddown-finish")?.addEventListener("click", () => {
    $("#session-after-winddown")?.classList.remove("hidden");
  });

  $("#btn-winddown-save-note")?.addEventListener("click", () => {
    const note = $("#winddown-reflection")?.value.trim() || "";
    try {
      const key = "mindpath_winddown_notes";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({ date: todayISO(), note });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* ignore */
    }
    hideSession();
  });
}

function initAdaptiveHabits() {
  $("#btn-habit-try-winddown")?.addEventListener("click", () => {
    showSession("winddown");
  });

  $("#habit-range-toggle")?.addEventListener("click", (e) => {
    const t = e.target.closest("[data-habit-range]");
    if (!t) return;
    habitRollingDays = Number(t.getAttribute("data-habit-range"));
    $$("#habit-range-toggle .filter-tab").forEach((btn) => {
      btn.classList.toggle(
        "active",
        Number(btn.getAttribute("data-habit-range")) === habitRollingDays
      );
    });
    renderHabitsLists();
  });

  $("#btn-habits-add")?.addEventListener("click", () => {
    $("#habits-add-hint")?.classList.add("hidden");
    setHabitDashboardOpen(true);
    $("#habit-dash-custom")?.focus();
  });
  $("#btn-habits-manage")?.addEventListener("click", () => {
    $("#habits-add-hint")?.classList.add("hidden");
    setHabitDashboardOpen(true);
    requestAnimationFrame(() => {
      $("#habit-dash-your-list-wrap")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  $("#habit-dashboard-backdrop")?.addEventListener("click", () => setHabitDashboardOpen(false));
  $("#btn-habit-dashboard-close")?.addEventListener("click", () => setHabitDashboardOpen(false));

  $("#btn-habit-dash-add-custom")?.addEventListener("click", () => {
    const titleInp = $("#habit-dash-custom");
    const title = titleInp?.value?.trim() || "";
    if (!title) {
      const hint = $("#habits-add-hint");
      if (hint) {
        hint.textContent = "Enter a short name for your custom habit.";
        hint.classList.remove("hidden");
      }
      return;
    }
    const st = loadHabitsState();
    const id = `h_${Date.now()}`;
    st.items.push({ id, title });
    st.checks[id] = {};
    saveHabitsState(st);
    if (titleInp) titleInp.value = "";
    fillHabitDashboardChips();
    renderHabitsLists();
    const hint = $("#habits-add-hint");
    if (hint) {
      hint.textContent = "Added to Home.";
      hint.classList.remove("hidden");
    }
  });

  renderHabitsLists();
}

function initMoreScreen() {
  $("#btn-more-baseline")?.addEventListener("click", () => {
    openPracticeExercise("perma_baseline_authentic_happiness");
  });
  $("#btn-more-hope")?.addEventListener("click", () => {
    openPracticeExercise("optimism_style_self_report_wb2");
  });
  $("#btn-more-history")?.addEventListener("click", async () => {
    showTab("history", { navTab: "more" });
    try {
      await loadHistoryData();
    } catch (e) {
      console.error(e);
    }
    renderHabitsLists();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMoodEmojiRow();
  initAdaptiveHabits();
  initMoreScreen();
  initSessionControls();
  bindSliders();
  const cd = $("#checkin-date");
  if (cd) cd.value = todayISO();
  const pd = $("#practice-date");
  if (pd) pd.value = todayISO();
  const pfd = $("#practice-filter-date");
  if (pfd) pfd.value = todayISO();

  $("#tab-login")?.addEventListener("click", () => {
    $("#tab-login")?.classList.add("active");
    $("#tab-register")?.classList.remove("active");
    $("#panel-login")?.classList.remove("hidden");
    $("#panel-register")?.classList.add("hidden");
  });
  $("#tab-register")?.addEventListener("click", () => {
    $("#tab-register")?.classList.add("active");
    $("#tab-login")?.classList.remove("active");
    $("#panel-register")?.classList.remove("hidden");
    $("#panel-login")?.classList.add("hidden");
  });

  async function afterLogin() {
    showApp();
    await refreshMe();
    await loadCatalog();
    fillPracticeSelect();
    renderPracticeFields();
    try {
      await loadDashboard();
    } catch (e) {
      $("#dash-error").textContent = String(e.message || e);
      $("#dash-error").classList.remove("hidden");
    }
    await refreshHome();
    renderHabitsLists();
    showTab("home");
  }

  $("#btn-login")?.addEventListener("click", async () => {
    const err = $("#auth-error");
    err?.classList.add("hidden");
    const r = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: $("#login-user").value.trim(),
        password: $("#login-pass").value,
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      if (err) {
        err.textContent = d.detail || "Log in failed";
        err.classList.remove("hidden");
      }
      return;
    }
    const data = await r.json();
    setToken(data.access_token);
    await afterLogin();
  });

  $("#btn-register")?.addEventListener("click", async () => {
    const err = $("#auth-error");
    err?.classList.add("hidden");
    const r = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: $("#reg-user").value.trim(),
        password: $("#reg-pass").value,
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      if (err) {
        err.textContent = d.detail || "Sign up failed";
        err.classList.remove("hidden");
      }
      return;
    }
    const data = await r.json();
    setToken(data.access_token);
    await afterLogin();
  });

  const handleLogout = () => {
    clearToken();
    showAuth();
  };
  $("#btn-more-logout")?.addEventListener("click", handleLogout);

  $$(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tab = btn.getAttribute("data-tab");
      if (!tab) return;
      showTab(tab);
      if (tab === "plan") {
        try {
          await loadDashboard();
        } catch (e) {
          $("#dash-error").textContent = String(e.message || e);
          $("#dash-error").classList.remove("hidden");
        }
      }
      if (tab === "home") await refreshHome();
      if (tab === "profile") {
        journalPage = 1;
        try {
          await loadJournalPage();
          await loadPracticeDates();
        } catch (e) {
          console.error(e);
        }
      }
    });
  });

  $("#btn-start-checkin")?.addEventListener("click", () => {
    const cd = $("#checkin-date");
    if (cd) cd.value = todayISO();
    showTab("checkin");
  });

  $("#btn-edit-checkin")?.addEventListener("click", async () => {
    const d = window.__journalEditDate;
    if (!d) return;
    const ok = await applyCheckinToForm(d);
    if (!ok) return;
    const msg = $("#checkin-msg");
    if (msg) msg.textContent = "Update your check-in below, then save.";
    showTab("checkin");
  });

  $("#btn-checkin")?.addEventListener("click", async () => {
    try {
      await doCheckin();
    } catch (e) {
      $("#checkin-error").textContent = String(e.message || e);
      $("#checkin-error").classList.remove("hidden");
    }
  });

  let sessionListenerBound = false;
  const bindStartSession = () => {
    const b = $("#btn-start-session");
    if (!b || sessionListenerBound) return;
    sessionListenerBound = true;
    b.addEventListener("click", () => {
      const sel = window.__recExercise;
      if (!sel) return;
      if (sel === "breathing_grounding") {
        showSession("breathing", "breathing");
        return;
      }
      const recItem = catalogCache.find((x) => x.id === sel);
      if (recItem?.session_type === "meditation") {
        showSession("breathing", "meditation");
        return;
      }
      showTab("profile");
      const pick = $("#practice-pick");
      if (pick) pick.value = sel;
      $("#practice-date").value = window.__recDate || todayISO();
      renderPracticeFields();
    });
  };
  bindStartSession();

  $("#btn-open-breathing")?.addEventListener("click", () => {
    showSession("breathing", "breathing");
  });
  $("#btn-open-meditation")?.addEventListener("click", () => {
    showSession("breathing", "meditation");
  });

  $("#practice-pick")?.addEventListener("change", renderPracticeFields);

  $("#btn-practice-submit")?.addEventListener("click", async () => {
    const err = $("#practice-error");
    const msg = $("#practice-msg");
    err?.classList.add("hidden");
    msg?.classList.add("hidden");
    if ($("#practice-pick")?.value === "nature_challenge_30x30_wb2") {
      const hid = $("#pf-n30_daily_json");
      if (hid) hid.value = JSON.stringify(readN30ChallengeState().daily || {});
      const ref = $("#pf-n30_reflection");
      if (ref) {
        const cur = readN30ChallengeState();
        cur.reflection = ref.value;
        writeN30ChallengeState(cur);
      }
    }
    const body = {
      date: $("#practice-date").value || todayISO(),
      intervention_type: $("#practice-pick").value,
      completed: $("#practice-done").value === "true",
      helpfulness: Number($("#practice-help").value),
      notes: $("#practice-notes").value.trim(),
      responses: collectPracticeResponses(),
    };
    const r = await authFetch("/practice/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      if (err) {
        err.textContent = d.detail || "Could not save";
        err.classList.remove("hidden");
      }
      return;
    }
    const out = await r.json();
    if (msg) {
      msg.textContent = `${out.personalized_feedback} ${out.next_micro_action}`;
      msg.classList.remove("hidden");
    }
  });

  $("#journal-prev")?.addEventListener("click", async () => {
    if (journalPage <= 1) return;
    journalPage -= 1;
    await loadJournalPage();
  });
  $("#journal-next")?.addEventListener("click", async () => {
    const probe = await authFetch(`/me/journals?page=${journalPage + 1}&per_page=${journalPerPage}`);
    if (!probe.ok) return;
    const data = await probe.json();
    if (!data.items || data.items.length === 0) return;
    journalPage += 1;
    await loadJournalPage();
  });

  $("#practice-filter-date")?.addEventListener("change", loadPracticeForSelectedDate);

  $("#history-tabs")?.addEventListener("click", async (e) => {
    const t = e.target.closest(".filter-tab");
    if (!t) return;
    const days = Number(t.getAttribute("data-days"));
    if (!days) return;
    historyDays = days;
    $$("#history-tabs .filter-tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    await loadHistoryData();
  });

  const sessionMusic = $("#session-music-mode");
  if (
    sessionMusic &&
    (sessionMusic.value === "stream" || sessionMusic.value === "mood" || sessionMusic.value === "pad")
  ) {
    sessionMusic.value = "youtube";
  }

  initCheckinChillToggle();

  if (getToken()) {
    refreshMe()
      .then(async () => {
        await afterLogin();
      })
      .catch(() => {
        clearToken();
        showAuth();
      });
  } else {
    showAuth();
  }
});
