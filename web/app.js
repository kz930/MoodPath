const TOKEN_KEY = "mindpath_token";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const interventionLabels = {
  gratitude: "Gratitude",
  best_possible_self: "Best possible self",
  cognitive_reframing: "Cognitive reframing",
  savoring: "Savoring",
  breathing_grounding: "Breathing & grounding",
  perma_baseline_authentic_happiness: "Baseline (PERMA & scales)",
  gratitude_letter_wb2: "Gratitude letter",
  savoring_homework_wb2: "Savoring homework",
  three_good_things_wb2: "Three good things",
  best_future_self_109_king: "109-year self + time machine",
  hope_plan_wb2: "Hope plan",
  optimism_style_self_report_wb2: "Hope & optimism self-report",
  best_possible_self_expanded_wb2: "Best possible self (expanded)",
  awe_walk_wb2: "Awe walk",
  nature_challenge_30x30_wb2: "30×30 nature challenge",
};

const MOOD_TAGS = [
  { value: "happy", label: "Happy" },
  { value: "anxious", label: "Anxious" },
  { value: "stress", label: "Stressed" },
  { value: "sad", label: "Sad" },
  { value: "angry", label: "Angry" },
  { value: "calm", label: "Calm" },
  { value: "tired", label: "Tired" },
  { value: "excited", label: "Excited" },
  { value: "lonely", label: "Lonely" },
  { value: "confused", label: "Confused" },
  { value: "hopeful", label: "Hopeful" },
  { value: "empty", label: "Empty" },
  { value: "grateful", label: "Grateful" },
];

let catalogCache = [];

function catalogTitle(c) {
  return c.title || c.title_zh || c.id;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(t) {
  sessionStorage.setItem(TOKEN_KEY, t);
}

function clearToken() {
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

function initMoodTags() {
  const host = $("#mood-tags");
  if (!host) return;
  host.innerHTML = "";
  MOOD_TAGS.forEach((m, i) => {
    const id = `mood-${i}`;
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.className = "tag";
    inp.id = id;
    inp.value = m.value;
    const lab = document.createElement("label");
    lab.className = "tag-pill";
    lab.htmlFor = id;
    lab.textContent = m.label;
    host.appendChild(inp);
    host.appendChild(lab);
  });
}

function selectedMoodTags() {
  const tags = [];
  $$("#mood-tags .tag:checked").forEach((el) => tags.push(el.value));
  return tags;
}

function buildCheckinPayload() {
  let journal = $("#journal").value.trim();
  const tags = selectedMoodTags();
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

function showAuth() {
  $("#view-auth").classList.remove("hidden");
  $("#view-app").classList.add("hidden");
}

function showApp() {
  $("#view-auth").classList.add("hidden");
  $("#view-app").classList.remove("hidden");
}

function showPanel(name) {
  $$("[data-panel]").forEach((el) => el.classList.add("hidden"));
  const panel = $(`#panel-${name}`);
  if (panel) panel.classList.remove("hidden");
  $$(".top-nav button[data-nav]").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-nav") === name);
  });
}

async function refreshMe() {
  const r = await authFetch("/auth/me");
  if (!r.ok) throw new Error("Session expired — please log in again.");
  const me = await r.json();
  $("#nav-user").textContent = me.username;
  $("#profile-user").textContent = `Signed in as ${me.username}`;
  return me;
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
  sel.innerHTML = "";
  catalogCache.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = catalogTitle(c);
    sel.appendChild(opt);
  });
}

function renderPracticeFields() {
  const id = $("#practice-pick").value;
  const item = catalogCache.find((x) => x.id === id);
  const host = $("#practice-fields");
  const intro = $("#practice-intro");
  host.innerHTML = "";
  if (!item) {
    intro.textContent = "";
    return;
  }
  intro.textContent = `${item.summary} (~${item.duration_hint_min} min)`;
  item.fields.forEach((f) => {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "0.85rem";
    const lab = document.createElement("label");
    lab.htmlFor = `pf-${f.key}`;
    lab.textContent = f.label;
    const hint = document.createElement("p");
    hint.className = "field-hint";
    hint.textContent = f.hint || "";
    const ta = document.createElement("textarea");
    ta.id = `pf-${f.key}`;
    ta.dataset.key = f.key;
    ta.rows = 3;
    ta.placeholder = "Write for yourself — messy is fine.";
    wrap.appendChild(lab);
    if (f.hint) wrap.appendChild(hint);
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

async function loadDashboard() {
  const grid = $("#dash-grid");
  const err = $("#dash-error");
  const recWrap = $("#dash-recommended");
  const recCard = $("#dash-rec-card");
  err.textContent = "";
  err.classList.add("hidden");
  recWrap.classList.add("hidden");

  await loadCatalog();
  catalogCache.sort((a, b) => {
    const rank = (x) => (x.category === "core" ? 0 : 1);
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return String(catalogTitle(a)).localeCompare(String(catalogTitle(b)), "en");
  });
  grid.innerHTML = "";

  catalogCache.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ex-card";
    btn.dataset.exId = c.id;
    btn.innerHTML = `<strong>${catalogTitle(c)}</strong><small>${c.summary}</small>`;
    btn.addEventListener("click", () => {
      showPanel("practice");
      $("#practice-pick").value = c.id;
      $("#practice-date").value = todayISO();
      renderPracticeFields();
    });
    grid.appendChild(btn);
  });

  const d = todayISO();
  const r = await authFetch(`/daily-plan?target_date=${encodeURIComponent(d)}`);
  if (r.status === 404) {
    $("#dash-hint").textContent =
      "No check-in for today yet — we can’t suggest a pick until you save one. You can still open any exercise below.";
    return;
  }
  if (!r.ok) {
    const t = await r.json().catch(() => ({}));
    throw new Error(t.detail || r.statusText);
  }
  $("#dash-hint").textContent =
    "Below is one guess based on your check-in. Ignore it if another exercise fits better.";
  const plan = await r.json();
  const inv = plan.intervention;
  const sel = inv.selected_intervention;
  recCard.innerHTML = `<strong>${interventionLabels[sel] || sel}</strong><small>${inv.reason}</small>`;
  recCard.onclick = () => {
    showPanel("practice");
    $("#practice-pick").value = sel;
    $("#practice-date").value = d;
    renderPracticeFields();
  };
  recWrap.classList.remove("hidden");

  grid.querySelectorAll(".ex-card").forEach((btn) => {
    btn.classList.toggle("recommended", btn.dataset.exId === sel);
  });
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
  lbl.textContent = total === 0 ? "0 / 0" : `${journalPage} / ${maxPage}`;

  if (total === 0) {
    elEmpty.classList.remove("hidden");
    elBody.classList.add("hidden");
    elMeta.textContent = "";
    return;
  }
  if (items.length === 0) {
    journalPage = maxPage;
    return loadJournalPage();
  }
  elEmpty.classList.add("hidden");
  elBody.classList.remove("hidden");
  const it = items[0];
  $("#journal-date").textContent = `Date: ${it.date}`;
  elBody.textContent = it.journal_text || "(No journal text that day)";
  elMeta.textContent = `Tags: ${(it.mood_tags || []).join(", ") || "—"} · Sleep ${it.sleep_hours}h · Energy ${it.energy_score} · Stress ${it.stress_score}`;
}

async function loadPracticeDates() {
  const r = await authFetch("/me/practice-dates");
  if (!r.ok) return;
  const data = await r.json();
  const dates = data.dates || [];
  const inp = $("#practice-filter-date");
  if (dates.length) {
    inp.value = dates[0];
  } else {
    inp.value = todayISO();
  }
  await loadPracticeForSelectedDate();
}

async function loadPracticeForSelectedDate() {
  const d = $("#practice-filter-date").value || todayISO();
  const list = $("#practice-history");
  const empty = $("#profile-practice-empty");
  list.innerHTML = "";
  const r = await authFetch(`/me/practices?date=${encodeURIComponent(d)}`);
  if (!r.ok) return;
  const data = await r.json();
  const prs = data.practices || [];
  if (prs.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  prs.forEach((p) => {
    const li = document.createElement("li");
    const title = interventionLabels[p.intervention_type] || p.intervention_type;
    const resp = Object.entries(p.responses || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
    li.innerHTML = `<strong>${title}</strong> · Done: ${p.completed ? "yes" : "no"} · Helpfulness ${p.helpfulness}<br/><span class="meta">${resp || p.notes || "—"}</span>`;
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
  $("#out-emotion").textContent = data.emotion.primary_emotion;
  $("#out-valence").textContent = data.emotion.valence;
  $("#out-arousal").textContent = data.emotion.arousal;
  $("#out-trend").textContent = data.pattern.trend;
  $("#out-patterns").textContent =
    data.pattern.patterns.length > 0 ? data.pattern.patterns.join(" · ") : "(No strong pattern flagged)";

  const inv = data.intervention;
  $("#out-intervention-name").textContent =
    interventionLabels[inv.selected_intervention] || inv.selected_intervention;
  $("#out-intervention-reason").textContent = inv.reason;
  $("#out-duration").textContent = inv.duration_min;

  const ol = $("#out-steps");
  ol.innerHTML = "";
  inv.steps.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    ol.appendChild(li);
  });

  const risk = data.risk;
  const riskEl = $("#out-risk");
  riskEl.className = "result-block risk " + (risk.risk_level || "");
  riskEl.innerHTML = `
    <h3>Safety note (not medical advice)</h3>
    <p><span class="pill">${risk.risk_level}</span> ${risk.safe_response}</p>
    <p class="meta">${risk.resource_suggestions.join(" · ")}</p>
  `;
}

async function doCheckin() {
  const err = $("#checkin-error");
  const msg = $("#checkin-msg");
  const planBox = $("#checkin-plan");
  err.textContent = "";
  err.classList.add("hidden");
  msg.textContent = "";
  planBox.classList.add("hidden");

  const targetDate = $("#target-date").value || todayISO();
  const body = buildCheckinPayload();

  const saveRes = await authFetch(
    `/checkin?target_date=${encodeURIComponent(targetDate)}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  if (!saveRes.ok) {
    const detail = await saveRes.json().catch(() => ({}));
    err.textContent = detail.detail || saveRes.statusText;
    err.classList.remove("hidden");
    return;
  }

  msg.textContent = "Saved.";

  const planRes = await authFetch(`/daily-plan?target_date=${encodeURIComponent(targetDate)}`);
  if (!planRes.ok) {
    const detail = await planRes.json().catch(() => ({}));
    err.textContent = detail.detail || planRes.statusText;
    err.classList.remove("hidden");
    return;
  }

  const data = await planRes.json();
  renderPlan(data);
  planBox.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  initMoodTags();
  bindSliders();
  $("#target-date").value = todayISO();
  $("#practice-date").value = todayISO();
  $("#practice-filter-date").value = todayISO();

  $("#tab-login").addEventListener("click", () => {
    $("#tab-login").classList.add("active");
    $("#tab-register").classList.remove("active");
    $("#panel-login").classList.remove("hidden");
    $("#panel-register").classList.add("hidden");
  });
  $("#tab-register").addEventListener("click", () => {
    $("#tab-register").classList.add("active");
    $("#tab-login").classList.remove("active");
    $("#panel-register").classList.remove("hidden");
    $("#panel-login").classList.add("hidden");
  });

  $("#btn-login").addEventListener("click", async () => {
    const err = $("#auth-error");
    err.classList.add("hidden");
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
      err.textContent = d.detail || "Log in failed";
      err.classList.remove("hidden");
      return;
    }
    const data = await r.json();
    setToken(data.access_token);
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
    showPanel("dashboard");
  });

  $("#btn-register").addEventListener("click", async () => {
    const err = $("#auth-error");
    err.classList.add("hidden");
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
      err.textContent = d.detail || "Sign up failed";
      err.classList.remove("hidden");
      return;
    }
    const data = await r.json();
    setToken(data.access_token);
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
    showPanel("dashboard");
  });

  $("#btn-logout").addEventListener("click", () => {
    clearToken();
    showAuth();
  });

  $$(".top-nav button[data-nav]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.getAttribute("data-nav");
      showPanel(name);
      if (name === "dashboard") {
        try {
          await loadDashboard();
        } catch (e) {
          $("#dash-error").textContent = String(e.message || e);
          $("#dash-error").classList.remove("hidden");
        }
      }
      if (name === "profile") {
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

  $("#btn-checkin").addEventListener("click", async () => {
    try {
      await doCheckin();
    } catch (e) {
      $("#checkin-error").textContent = String(e.message || e);
      $("#checkin-error").classList.remove("hidden");
    }
  });

  $("#practice-pick").addEventListener("change", renderPracticeFields);

  $("#btn-practice-submit").addEventListener("click", async () => {
    const err = $("#practice-error");
    const msg = $("#practice-msg");
    err.classList.add("hidden");
    msg.classList.add("hidden");
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
      err.textContent = d.detail || "Could not save";
      err.classList.remove("hidden");
      return;
    }
    const out = await r.json();
    msg.textContent = `${out.personalized_feedback} ${out.next_micro_action}`;
    msg.classList.remove("hidden");
  });

  $("#journal-prev").addEventListener("click", async () => {
    if (journalPage <= 1) return;
    journalPage -= 1;
    await loadJournalPage();
  });
  $("#journal-next").addEventListener("click", async () => {
    const probe = await authFetch(`/me/journals?page=${journalPage + 1}&per_page=${journalPerPage}`);
    if (!probe.ok) return;
    const data = await probe.json();
    if (!data.items || data.items.length === 0) return;
    journalPage += 1;
    await loadJournalPage();
  });

  $("#practice-filter-date").addEventListener("change", loadPracticeForSelectedDate);

  if (getToken()) {
    refreshMe()
      .then(async () => {
        showApp();
        await loadCatalog();
        fillPracticeSelect();
        renderPracticeFields();
        await loadDashboard();
        showPanel("dashboard");
      })
      .catch(() => {
        clearToken();
        showAuth();
      });
  } else {
    showAuth();
  }
});
