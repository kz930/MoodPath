// MoodPath app — router, auth, real API integration
const { useState: uS, useEffect: uE, useReducer, useMemo: uM, useCallback: uCb } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "moodStyle": "circles",
  "stickerDensity": "some",
  "showDailyChip": true,
  "paperTone": "warm",
  "streakOverride": 0
}/*EDITMODE-END*/;

// ─── Auth & API ────────────────────────────────────────────────
const TOKEN_KEY = 'moodpath_token';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('moodpath:logout'));
  }
  return res;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Mood scale (1..5) ↔ backend energy/stress
function moodToScores(mood) {
  const map = { 1: { e: 2, s: 8 }, 2: { e: 4, s: 6 }, 3: { e: 5, s: 5 }, 4: { e: 7, s: 3 }, 5: { e: 9, s: 2 } };
  return map[mood] || map[3];
}
function scoresToMood(energy, stress) {
  if (energy == null || stress == null) return null;
  const v = energy - stress;
  if (v <= -5) return 1;
  if (v <= -2) return 2;
  if (v <= 1) return 3;
  if (v <= 4) return 4;
  return 5;
}
function tagsToMood(tags) {
  if (!Array.isArray(tags)) return null;
  for (const t of tags) {
    const m = /^mood_([1-5])$/.exec(t);
    if (m) return Number(m[1]);
  }
  return null;
}

// ─── Reducer for local Today screen state ─────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return { ...state, ...action.value };
    case 'set_mood':
      return { ...state, mood: action.mood };
    case 'set_good': {
      const next = [...state.goodThings];
      next[action.i] = action.value;
      return { ...state, goodThings: next };
    }
    case 'save_good': {
      const next = [...state.savedGoodThings];
      next[action.i] = state.goodThings[action.i];
      return { ...state, savedGoodThings: next };
    }
    case 'set_streak':
      return { ...state, streak: action.value };
    case 'set_score':
      return { ...state, [action.key]: action.value };
    case 'reset':
      return initialState();
    default:
      return state;
  }
}

function initialState() {
  return {
    mood: null,
    energy: null,
    stress: null,
    goodThings: ['', '', ''],
    savedGoodThings: ['', '', ''],
    streak: 0,
    dailyPracticeShown: true,
  };
}

// ─── Auth screen ───────────────────────────────────────────────
function AuthScreen({ onAuthed }) {
  const [tab, setTab] = uS('login');
  const [user, setUser] = uS('');
  const [pass, setPass] = uS('');
  const [err, setErr] = uS('');
  const [busy, setBusy] = uS(false);

  async function submit() {
    setErr(''); setBusy(true);
    try {
      const path = tab === 'login' ? '/auth/login' : '/auth/register';
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.detail || 'could not sign in');
        return;
      }
      const data = await r.json();
      setToken(data.access_token);
      onAuthed();
    } finally { setBusy(false); }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#efe6d4',
      backgroundImage: `
        radial-gradient(circle at 25% 30%, rgba(244,192,209,0.18), transparent 50%),
        radial-gradient(circle at 75% 70%, rgba(159,225,203,0.14), transparent 50%)
      `,
    }}>
      <div className="paper-bg" style={{
        width: 360, padding: '32px 28px',
        borderRadius: 18,
        position: 'relative',
        boxShadow: '0 4px 20px rgba(74,27,12,0.08)',
      }}>
        <div className="washi" style={{ marginTop: -24, marginBottom: 18 }}>
          <div className="washi-stripes"/>
          <span style={{ position: 'relative' }}>welcome</span>
        </div>
        <h1 className="serif" style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 500 }}>moodpath</h1>
        <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 14, marginBottom: 18 }}>
          a small, kind notebook
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(74,27,12,0.05)', padding: 4, borderRadius: 999, marginBottom: 14 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="serif" style={{
              flex: 1, padding: '7px 10px', border: 'none',
              borderRadius: 999,
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--ink)' : 'var(--ink-soft)',
              fontStyle: 'italic', cursor: 'pointer',
            }}>{t === 'login' ? 'log in' : 'sign up'}</button>
          ))}
        </div>
        <label className="serif" style={{ display: 'block', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', margin: '8px 0 4px' }}>
          username
        </label>
        <DashedInput value={user} onChange={setUser} placeholder="3+ characters" />
        <label className="serif" style={{ display: 'block', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', margin: '12px 0 4px' }}>
          password
        </label>
        <DashedInput type="password" value={pass} onChange={setPass} placeholder="6+ characters" />
        {err && <div style={{ color: '#A33B1F', fontSize: 13, marginTop: 10 }}>{err}</div>}
        <button onClick={submit} disabled={busy || !user.trim() || pass.length < 6} className="btn btn-primary"
          style={{ width: '100%', marginTop: 16, opacity: busy ? 0.6 : 1 }}>
          {busy ? '…' : (tab === 'login' ? 'log in' : 'create account')}
        </button>
      </div>
    </div>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────
// Fallback catalog matching app/catalog.py — used when backend is unreachable
const FALLBACK_CATALOG = [
  { id: 'gratitude', title: 'Gratitude', summary: 'Notice small things that helped you today. Even tiny ones count.', category: 'core', duration_approx: 'About 8 minutes',
    fields: [
      { key: 'g1', label: 'One thing you are thankful for', hint: 'Anything that helped, even a little.', placeholder: 'A person, food, song, or moment.' },
      { key: 'g2', label: 'A second thing', hint: 'Easy things to miss are okay.', placeholder: 'Maybe a friend, the weather, or a small win.' },
      { key: 'g3', label: 'A third thing', hint: 'Simple is fine — food, rest, a kind text.', placeholder: 'Anything that made today a bit better.' },
      { key: 'g_action', label: 'One small step for tomorrow', hint: 'One short sentence.', placeholder: 'Something easy you can really do.' },
    ] },
  { id: 'best_possible_self', title: 'Best future self', summary: 'Picture your life going really well. Write what you see, then turn it into small steps.', category: 'core', duration_approx: 'About 12 minutes',
    fields: [
      { key: 'bps_king_109', label: 'Step 1 — about 5 minutes', hint: 'Imagine you are 109 years old. Everything has gone as well as you hoped. Write what your life looks like.', placeholder: 'Keep writing. Do not stop to fix words.' },
      { key: 'bps_king_time_machine', label: 'Step 2 — about 5 minutes', hint: 'Your 109-year-old self visits you today. What do they say?', placeholder: 'Let the words come. No editing.' },
      { key: 'bps_king_actions', label: 'Step 3 — about 2 minutes', hint: 'Pick the top 3 things to remember every day.', placeholder: 'Bullet points are fine.' },
    ] },
  { id: 'cognitive_reframing', title: 'Cognitive reframing', summary: 'Slow down a worry. Look at it again. Find a kinder, true way to see it.', category: 'core', duration_approx: 'About 8 minutes',
    fields: [
      { key: 'cr_hot', label: 'The worry', hint: 'Messy is fine.', placeholder: 'Write the thought just like it sounds in your head.' },
      { key: 'cr_evidence_for', label: 'Facts that support it', hint: 'Only real facts.', placeholder: 'What makes this thought feel true?' },
      { key: 'cr_evidence_against', label: 'Facts that go against it', hint: 'Times it went okay, your skills, or help you have.', placeholder: 'What does not fully fit this thought?' },
      { key: 'cr_balanced', label: 'A kinder, balanced view', hint: 'Try using "and" or "but" to hold both sides.', placeholder: 'Write a calmer version that still feels true.' },
    ] },
  { id: 'savoring', title: 'Savoring', summary: 'Pick one good moment. Stay with it for a minute. Notice it before it passes.', category: 'core', duration_approx: 'About 6 minutes',
    fields: [
      { key: 'sv_moment', label: 'One small good moment', hint: 'A sip, a text, a song, or light on the wall.', placeholder: 'What was it?' },
      { key: 'sv_senses', label: 'What you noticed', hint: 'What did you see, hear, or feel?', placeholder: 'Colors, sounds, warmth — any small detail.' },
      { key: 'sv_extend', label: 'How to make it last a little longer', hint: 'What could you stay with for 30 more seconds?', placeholder: 'One thing to slow down on next time.' },
    ] },
  { id: 'breathing_grounding', title: 'Breathing & grounding', summary: 'Calm your body first. Thoughts get easier after.', category: 'core', duration_approx: 'About 5 minutes', session_type: 'breathing', video_id: '-G89S77iJm8', phase_label: 'Inhale 4 · exhale 6', fields: [] },
  { id: 'meditation', title: 'Meditation', summary: 'Sit. Breathe. Let thoughts pass like clouds.', category: 'core', duration_approx: 'About 10 minutes', session_type: 'meditation', video_id: 'x0nZ1ZLephQ', phase_label: 'Notice. Let go. Return.', fields: [] },
];

function useCatalog() {
  const [items, setItems] = uS(FALLBACK_CATALOG);
  uE(() => {
    apiFetch('/interventions/catalog').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.items?.length) setItems(d.items);
    }).catch(() => {});
  }, []);
  return items;
}

function useTimeline() {
  const [records, setRecords] = uS([]);
  const reload = uCb(async () => {
    const r = await apiFetch('/timeline?days=365');
    if (r.ok) {
      const d = await r.json();
      setRecords(d.records || []);
    }
  }, []);
  uE(() => { reload(); }, [reload]);
  return [records, reload];
}

// Today's recommended exercise based on user's mood/energy/stress
function useRecommendation(authed, todayRecord) {
  const [rec, setRec] = uS(null);
  uE(() => {
    if (!authed || !todayRecord) { setRec(null); return; }
    const iso = todayISO();
    apiFetch(`/daily-plan?target_date=${iso}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.intervention?.selected_intervention) {
          setRec({
            id: d.intervention.selected_intervention,
            reason: d.intervention.reason,
            steps: d.intervention.steps || [],
            duration_min: d.intervention.duration_min,
          });
        } else {
          setRec(null);
        }
      })
      .catch(() => setRec(null));
  }, [authed, todayRecord?.energy_score, todayRecord?.stress_score, todayRecord?.mood_tags?.[0]]);
  return rec;
}

function computeStreak(records) {
  if (!records || !records.length) return 0;
  const set = new Set(records.map(r => r.date));
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (set.has(iso)) { n += 1; d.setDate(d.getDate() - 1); }
    else break;
  }
  return n;
}

// ─── App ────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = uS(true); // demo mode: bypass auth so prototype runs without backend
  const [user, setUser] = uS(null);
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [route, setRoute] = uS({ name: 'today' });
  const catalog = useCatalog();
  const [timeline, reloadTimeline] = useTimeline();

  // Today's record (from timeline) — used for recommendation
  const todayRecord = uM(() => {
    if (!timeline?.length) return null;
    const iso = todayISO();
    return timeline.find(r => r.date === iso) || null;
  }, [timeline]);
  const recommendation = useRecommendation(authed, todayRecord);

  // Listen for auto-logout (e.g. 401)
  uE(() => {
    const onLogout = () => { setAuthed(false); setUser(null); };
    window.addEventListener('moodpath:logout', onLogout);
    return () => window.removeEventListener('moodpath:logout', onLogout);
  }, []);

  // Validate token + load /auth/me
  uE(() => {
    if (!authed) return;
    apiFetch('/auth/me').then(r => r.ok ? r.json() : null).then(u => {
      if (u) setUser(u);
      // demo: don't clear auth if /auth/me fails (no backend)
    }).catch(() => {});
  }, [authed]);

  // Load today's check-in into local state
  uE(() => {
    if (!authed) return;
    const iso = todayISO();
    apiFetch(`/me/checkin?date=${iso}`).then(r => r.ok ? r.json() : null).then(c => {
      if (!c) return;
      const mood = tagsToMood(c.mood_tags) || scoresToMood(c.energy_score, c.stress_score);
      const lines = (c.journal_text || '').split('\n').map(l => l.replace(/^\d+\.\s*/, '')).filter(Boolean);
      const goodThings = [lines[0] || '', lines[1] || '', lines[2] || ''];
      dispatch({ type: 'load', value: {
        mood,
        energy: c.energy_score ?? null,
        stress: c.stress_score ?? null,
        goodThings,
        savedGoodThings: [...goodThings],
      } });
    });
  }, [authed]);

  // Recompute streak from timeline
  uE(() => {
    dispatch({ type: 'set_streak', value: computeStreak(timeline) });
  }, [timeline]);

  // Apply paper tone via CSS var override
  uE(() => {
    const root = document.documentElement;
    if (tweaks.paperTone === 'cool') {
      root.style.setProperty('--paper', '#EDEEDD');
      root.style.setProperty('--paper-soft', '#E0E2CC');
    } else if (tweaks.paperTone === 'soft') {
      root.style.setProperty('--paper', '#F5EFE3');
      root.style.setProperty('--paper-soft', '#EDE5D2');
    } else {
      root.style.setProperty('--paper', '#FAEEDA');
      root.style.setProperty('--paper-soft', '#F6E6CC');
    }
  }, [tweaks.paperTone]);

  const effectiveStreak = tweaks.streakOverride > 0 ? tweaks.streakOverride : state.streak;
  const renderedState = { ...state, streak: effectiveStreak };

  // Persist a check-in (mood + good things) to backend.
  // Mood is optional — if not picked yet, save with neutral defaults so 3 good things are recorded.
  // Energy/stress prefer the user's slider values; fall back to mood-derived if not set.
  async function persistCheckin(nextState) {
    const iso = todayISO();
    const mood = nextState.mood;
    const seeded = mood == null ? { e: 5, s: 5 } : moodToScores(mood);
    const energy = nextState.energy ?? seeded.e;
    const stress = nextState.stress ?? seeded.s;
    const journal = (nextState.savedGoodThings || nextState.goodThings || [])
      .map((g, i) => g && g.trim() ? `${i + 1}. ${g.trim()}` : '')
      .filter(Boolean)
      .join('\n');
    const hasContent = mood != null || journal.length > 0;
    if (!hasContent) return;
    const payload = {
      journal_text: journal,
      mood_tags: mood != null ? [`mood_${mood}`] : [],
      sleep_hours: 0,
      energy_score: energy,
      stress_score: stress,
    };
    await apiFetch(`/checkin?target_date=${iso}`, { method: 'POST', body: JSON.stringify(payload) });

    // Also save the three good things as a practice record so it shows up in
    // the user's practice history. Upsert to avoid duplicates per day.
    const goods = nextState.savedGoodThings || nextState.goodThings || [];
    const filledCount = goods.filter(g => g && g.trim()).length;
    if (filledCount > 0) {
      const responses = {};
      if (goods[0] && goods[0].trim()) responses.tgt_1_detail = goods[0].trim();
      if (goods[1] && goods[1].trim()) responses.tgt_2_detail = goods[1].trim();
      if (goods[2] && goods[2].trim()) responses.tgt_3_detail = goods[2].trim();
      await apiFetch('/practice/submit', {
        method: 'POST',
        body: JSON.stringify({
          date: iso,
          intervention_type: 'three_good_things_wb2',
          completed: filledCount === 3,
          helpfulness: 4,
          notes: '',
          responses,
          upsert: true,
        }),
      }).catch(() => {});
    }

    reloadTimeline();
  }

  function nav(r) { setRoute(r); }

  function logout() {
    clearToken();
    setAuthed(false);
    setUser(null);
    setRoute({ name: 'today' });
  }

  if (!authed) {
    return <AuthScreen onAuthed={() => setAuthed(true)} />;
  }

  const showTabBar = ['today', 'treehole', 'timeline', 'forest', 'practices', 'chat', 'me'].includes(route.name);

  const screenProps = {
    state: renderedState,
    dispatch,
    onNav: nav,
    tweaks,
    catalog,
    timeline,
    reloadTimeline,
    persistCheckin,
    user,
    onLogout: logout,
    todayRecord,
    recommendation,
  };

  let screen = null;
  switch (route.name) {
    case 'today':
      screen = <TodayScreen {...screenProps} />; break;
    case 'timeline':
    case 'forest':
      screen = <TimelineScreen {...screenProps} />; break;
    case 'practices':
      screen = <PracticesScreen {...screenProps} />; break;
    case 'treehole':
      screen = <TreeHoleScreen {...screenProps} />; break;
    case 'chat':
      screen = <ChatScreen {...screenProps} />; break;
    case 'practiceDetail':
      screen = <PracticeDetailScreen {...screenProps} id={route.id} />; break;
    case 'practiceDone':
      screen = <PracticeDoneScreen {...screenProps} id={route.id} />; break;
    case 'me':
      screen = <MeScreen {...screenProps} />; break;
    case 'weeklyReport':
      screen = <WeeklyReportScreen {...screenProps} />; break;
    case 'entryDetail':
      screen = <EntryDetailScreen {...screenProps} data={route.data} />; break;
    default:
      screen = <TodayScreen {...screenProps} />;
  }

  return (
    <div data-screen-label={`MoodPath / ${route.name}`} style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#efe6d4',
      backgroundImage: `
        radial-gradient(circle at 25% 30%, rgba(244,192,209,0.18), transparent 50%),
        radial-gradient(circle at 75% 70%, rgba(159,225,203,0.14), transparent 50%)
      `,
    }}>
      <IOSDevice width={390} height={844}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {screen}
          {showTabBar && <TabBar active={route.name} onChange={(t) => setRoute({ name: t })} />}
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection title="aesthetic">
          <TweakRadio
            label="paper tone"
            value={tweaks.paperTone}
            onChange={(v) => setTweak('paperTone', v)}
            options={[
              { label: 'warm', value: 'warm' },
              { label: 'soft', value: 'soft' },
              { label: 'cool', value: 'cool' },
            ]}
          />
          <TweakSelect
            label="sticker density"
            value={tweaks.stickerDensity}
            onChange={(v) => setTweak('stickerDensity', v)}
            options={[
              { label: 'none', value: 'none' },
              { label: 'some', value: 'some' },
              { label: 'lots', value: 'lots' },
            ]}
          />
        </TweakSection>
        <TweakSection title="today screen">
          <TweakSelect
            label="mood selector"
            value={tweaks.moodStyle}
            onChange={(v) => setTweak('moodStyle', v)}
            options={[
              { label: 'circles', value: 'circles' },
              { label: 'rail', value: 'rail' },
              { label: 'big', value: 'big' },
            ]}
          />
          <TweakToggle
            label="daily practice chip"
            value={tweaks.showDailyChip}
            onChange={(v) => setTweak('showDailyChip', v)}
          />
        </TweakSection>
        <TweakSection title="navigate">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['today', 'timeline', 'practices', 'chat', 'me'].map(n => (
              <TweakButton key={n} onClick={() => setRoute({ name: n })}>{n}</TweakButton>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <TweakButton onClick={logout}>log out</TweakButton>
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
