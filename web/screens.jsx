// MoodPath screens — real data, real API
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR, useCallback: useCb } = React;

// ─────────────────────────────────────────────────────────────
// Practice categorization (per user spec)
// ─────────────────────────────────────────────────────────────
// Mental wellness is its own elevated section (rendered above the categorized list).
const MENTAL_WELLNESS_IDS = ['breathing_grounding', 'meditation'];

const PRACTICE_GROUPS = [
  {
    id: 'reflection',
    title: 'reflection & writing',
    desc: 'short writing exercises.',
    ids: ['best_possible_self', 'cognitive_reframing', 'gratitude', 'savoring'],
  },
  {
    id: 'weekly',
    title: 'weekly activities',
    desc: 'longer assignments — about a week each.',
    ids: [
      'curiosity_practice_wb2',
      'wellbeing_writing_analysis_wb2',
      'earth_day_wb2',
      'pay_it_forward_wb2',
      'strengths_use_wb2',
      'flow_intervention_wb2',
      'kindness_self_other_wb2',
    ],
  },
  {
    id: 'curriculum',
    title: 'deeper curriculum',
    desc: 'longer, evidence-based work.',
    ids: ['best_possible_self_expanded_wb2', 'gratitude_letter_wb2', 'hope_plan_wb2', 'savoring_homework_wb2'],
  },
  {
    id: 'awe',
    title: 'awe outdoors',
    desc: 'go outside, notice things.',
    ids: ['awe_walk_wb2'],
  },
];

// Habit suggestions, grouped. Course habits tie to existing exercises;
// quick ideas are simple, concrete actions; custom = user-typed.
const HABIT_PRESETS_COURSE = [
  { id: 'awe_30x30', title: 'awe walk · 30×30 challenge', desc: '30 min outside, every day for 30 days', special: 'nature_30x30' },
  { id: 'three_good_daily', title: 'three good things — every night', desc: 'write three good things at the end of the day' },
  { id: 'bps_weekly', title: 'best possible self — 3× this week', desc: 'a 15-min writing session, three days this week' },
];
const HABIT_PRESETS_QUICK = [
  { id: 'stretch_5', title: '5-minute stretch', desc: 'unkink your back and shoulders' },
  { id: 'gratitude_line', title: 'one line of gratitude before bed', desc: 'one small thanks, one sentence' },
  { id: 'walk_10', title: '10-minute walk', desc: 'just step outside, no phone' },
  { id: 'water_morning', title: 'glass of water after waking', desc: 'drink it before coffee' },
  { id: 'phone_off_11', title: 'phone away by 11pm', desc: 'set it down for the night' },
  { id: 'sunlight_morning', title: '5 min of morning sunlight', desc: 'step outside soon after waking' },
];

// ─────────────────────────────────────────────────────────────
// Mood mapping helpers (also defined in app.jsx — duplicated here for safety)
// ─────────────────────────────────────────────────────────────
function moodToScoresLocal(mood) {
  const map = { 1: { e: 2, s: 8 }, 2: { e: 4, s: 6 }, 3: { e: 5, s: 5 }, 4: { e: 7, s: 3 }, 5: { e: 9, s: 2 } };
  return map[mood] || map[3];
}

function ScoreSlider({ label, value, onChange, colors, leftHint, rightHint, style }) {
  const v = Math.max(1, Math.min(10, value));
  const pct = ((v - 1) / 9) * 100;
  return (
    <div style={style}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <span className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 13 }}>{label}</span>
        <span className="serif" style={{ fontWeight: 500, fontSize: 18, color: 'var(--ink)' }}>{v}</span>
      </div>
      <div style={{ position: 'relative', height: 28 }}>
        <div style={{
          position: 'absolute', inset: '12px 0',
          height: 4, borderRadius: 999,
          background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[3]}, ${colors[4]})`,
          opacity: 0.55,
        }}/>
        <input
          type="range"
          min={1} max={10} step={1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            appearance: 'none', WebkitAppearance: 'none',
            background: 'transparent', outline: 'none',
            margin: 0, padding: 0, cursor: 'pointer',
          }}
        />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
        fontSize: 11, color: 'var(--ink-faded)',
      }}>
        <span>{leftHint}</span>
        <span>{rightHint}</span>
      </div>
    </div>
  );
}

function recordToMood(rec) {
  if (!rec) return null;
  if (Array.isArray(rec.mood_tags)) {
    for (const t of rec.mood_tags) {
      const m = /^mood_([1-5])$/.exec(t);
      if (m) return Number(m[1]);
    }
  }
  if (rec.energy_score != null && rec.stress_score != null) {
    const v = rec.energy_score - rec.stress_score;
    if (v <= -5) return 1;
    if (v <= -2) return 2;
    if (v <= 1) return 3;
    if (v <= 4) return 4;
    return 5;
  }
  return null;
}

function parseISO(s) {
  if (!s) return new Date();
  if (s instanceof Date) return s;
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function noteFromJournal(text) {
  if (!text) return '';
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  // First non-empty line, stripped of leading "1." numbering
  return lines[0].replace(/^\d+\.\s*/, '');
}

const TODAY = new Date();

// ─────────────────────────────────────────────────────────────
// TODAY screen
// ─────────────────────────────────────────────────────────────
function TodayScreen({ state, dispatch, onNav, tweaks, catalog, persistCheckin, recommendation, todayRecord }) {
  const todayLabel = formatDate(TODAY, 'long');
  const { mood, goodThings, dailyPracticeShown, streak } = state;

  // Featured = AI recommendation if we have one (mood is set), else fall back to "three good things"
  const featured = useM(() => {
    if (!catalog?.length) return null;
    if (recommendation?.id) {
      const match = catalog.find(p => p.id === recommendation.id);
      if (match) return { ...match, _reason: recommendation.reason };
    }
    return catalog.find(p => p.id === 'three_good_things_wb2')
        || catalog.find(p => p.id === 'savoring')
        || catalog[0];
  }, [catalog, recommendation]);

  function onMoodChange(m) {
    // When user picks a mood, seed energy/stress from the mood mapping if not yet set
    const seeded = moodToScoresLocal(m);
    const next = {
      ...state,
      mood: m,
      energy: state.energy ?? seeded.e,
      stress: state.stress ?? seeded.s,
    };
    dispatch({ type: 'set_mood', mood: m });
    if (state.energy == null) dispatch({ type: 'set_score', key: 'energy', value: seeded.e });
    if (state.stress == null) dispatch({ type: 'set_score', key: 'stress', value: seeded.s });
    persistCheckin(next);
  }

  function onScoreChange(key, val) {
    dispatch({ type: 'set_score', key, value: val });
    const next = { ...state, [key]: val };
    persistCheckin(next);
  }

  function onSaveGood(i, val) {
    const v = (val ?? state.goodThings[i] ?? '').trim();
    if (!v) return;
    const nextGoods = [...state.goodThings]; nextGoods[i] = v;
    const nextSaved = [...state.savedGoodThings]; nextSaved[i] = v;
    dispatch({ type: 'set_good', i, value: v });
    dispatch({ type: 'save_good', i });
    persistCheckin({ ...state, goodThings: nextGoods, savedGoodThings: nextSaved });
  }

  return (
    <Page hasTabBar>
      <WashiHeader>{todayLabel}</WashiHeader>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
        <h1 className="serif" style={{ margin: 0, fontSize: 26, fontWeight: 500, color: 'var(--ink)' }}>
          how's the weather inside?
        </h1>
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          <Sticker type="sun" size={42} rotation={14} style={{ position: 'absolute', top: 0, right: -4 }}/>
        </div>
      </div>

      {/* Mood selector */}
      <div className="card-mount" style={{ animationDelay: '40ms', marginTop: 8, marginBottom: 14 }}>
        <MoodSelector
          value={mood}
          onChange={onMoodChange}
          style={tweaks.moodStyle}
        />
        {mood != null && (
          <div className="serif" style={{
            textAlign: 'center', marginTop: 12,
            fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)',
          }}>
            feeling {MOOD_LABELS[mood]}.
          </div>
        )}
      </div>

      {/* Energy + Stress sliders (only show after mood is picked, to keep first impression simple) */}
      {mood != null && (
        <div className="card-mount notebook-card" style={{ animationDelay: '70ms', marginBottom: 18, padding: '14px 16px' }}>
          <ScoreSlider
            label="energy"
            value={state.energy ?? moodToScoresLocal(mood).e}
            onChange={(v) => onScoreChange('energy', v)}
            colors={['#F0997B', '#FAC775', '#C0DD97', '#9FE1CB', '#F4C0D1']}
            leftHint="drained"
            rightHint="lit up"
          />
          <ScoreSlider
            label="stress"
            value={state.stress ?? moodToScoresLocal(mood).s}
            onChange={(v) => onScoreChange('stress', v)}
            colors={['#F4C0D1', '#9FE1CB', '#C0DD97', '#FAC775', '#F0997B']}
            leftHint="calm"
            rightHint="overwhelmed"
            style={{ marginTop: 10 }}
          />
        </div>
      )}

      {/* Three good things */}
      <NotebookCard
        corner={tweaks.stickerDensity !== 'none' ? 'sparkle' : null}
        cornerRotation={10}
        style={{ animationDelay: '120ms', marginBottom: 16 }}
        className="notebook-card card-mount"
      >
        <div className="serif" style={{
          fontSize: 16, fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          plant three seeds
          <span style={{ color: 'var(--accent-amber)' }}>✦</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map(i => (
            <DashedInput
              key={i}
              prefix={['1.', '2.', '3.'][i]}
              value={goodThings[i] || ''}
              onChange={(v) => dispatch({ type: 'set_good', i, value: v })}
              placeholder={['something small that went right…', 'a kind moment…', 'something you noticed…'][i]}
              onSave={(val) => onSaveGood(i, val)}
            />
          ))}
        </div>
      </NotebookCard>

      {/* Daily practice chip — leaf note (top) + practice CTA (bottom) */}
      {tweaks.showDailyChip && featured && dailyPracticeShown && (() => {
        const leafIdx = _dailyLeafIdx();
        const leafNote = LEAF_NOTES[leafIdx];
        return (
          <div className="card-mount" style={{
            animationDelay: '180ms',
            position: 'relative',
            background: 'var(--accent-mint)',
            border: '1px solid rgba(74,27,12,0.08)',
            borderRadius: 14,
            padding: '16px 16px 14px',
            marginBottom: 18,
            color: 'var(--ink)',
            overflow: 'visible',
          }}>
            {/* small leaf tucked at the top-right corner */}
            <div style={{ position: 'absolute', top: -10, right: 12, transform: 'rotate(18deg)' }}>
              <svg width="44" height="44" viewBox="0 0 180 110" style={{ filter: 'drop-shadow(0 1px 2px rgba(74,27,12,0.10))' }}>
                <path d="M 20 70 C 20 30, 70 12, 160 18 C 158 60, 130 95, 30 92 C 22 88, 20 80, 20 70 Z"
                  fill="#B6C9A0" stroke="#4A1B0C" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M 22 78 Q 90 50, 158 22" stroke="#4A1B0C" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7"/>
              </svg>
            </div>
            <div className="serif" style={{
              fontStyle: 'italic', fontSize: 11, color: 'var(--ink-faded)',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
            }}>today's small thing</div>
            {/* Leaf note */}
            <p className="serif" style={{
              margin: '0 0 12px', fontSize: 16, fontStyle: 'italic',
              lineHeight: 1.45, color: 'var(--ink)', paddingRight: 36,
              textWrap: 'pretty',
            }}>
              {leafNote}
            </p>
            {/* Divider */}
            <div style={{
              borderTop: '1px dashed rgba(74,27,12,0.18)', margin: '10px -4px 12px',
            }}/>
            {/* Practice CTA */}
            <button
              onClick={() => onNav({ name: 'practiceDetail', id: featured.id })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                background: 'transparent', border: 'none',
                width: '100%', padding: 0, cursor: 'pointer', color: 'var(--ink)', gap: 4,
              }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%',
                fontFamily: 'EB Garamond, serif', fontSize: 15, fontStyle: 'italic',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sticker type={STICKER_BY_ID[featured.id] || 'sun'} size={22} rotation={-6}/>
                  {recommendation?.id === featured.id ? "an invitation — " : "a small practice — "}
                  {featured.title.toLowerCase()}
                </span>
                <span style={{ fontFamily: 'Nunito', fontSize: 18, color: 'var(--ink-soft)' }}>→</span>
              </div>
              {featured._reason && (
                <div style={{
                  fontFamily: 'Nunito', fontSize: 12, color: 'var(--ink-soft)',
                  lineHeight: 1.45, paddingLeft: 32, paddingRight: 18,
                  textAlign: 'left',
                }}>
                  {featured._reason}
                </div>
              )}
            </button>
          </div>
        );
      })()}

      {/* Small wins basket */}
      <SmallWinsBasket stickerDensity={tweaks.stickerDensity} />

      {/* Habits section */}
      <HabitsSection todayRecord={todayRecord} stickerDensity={tweaks.stickerDensity} />


      {/* Streak chip */}
      <div className="card-mount" style={{ animationDelay: '240ms', display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 12 }}>
        <StreakChip count={streak} total={7} />
      </div>
      <div className="serif" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontSize: 13, fontStyle: 'italic' }}>
        keep going.
      </div>

      {tweaks.stickerDensity === 'lots' && (
        <>
          <div style={{ position: 'absolute', top: 320, left: -8, opacity: 0.85, pointerEvents: 'none' }}>
            <Sticker type="leaf" size={36} rotation={-18}/>
          </div>
          <div style={{ position: 'absolute', top: 540, right: 6, opacity: 0.85, pointerEvents: 'none' }}>
            <Sticker type="cloud" size={40} rotation={-6}/>
          </div>
        </>
      )}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────
// HABITS — local-storage-backed daily check-off
// ─────────────────────────────────────────────────────────────
const HABITS_KEY = 'moodpath_habits_v1';

function loadHabits() {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch {/**/}
  return [];
}
function saveHabits(arr) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(arr));
}

// Bottom-sheet style habit picker — anchors to viewport bottom (escapes scroll containers)
function HabitPickerSheet({ existing, onAdd, onAddCustom, onClose }) {
  const [custom, setCustom] = useS('');

  function tryAddCustom() {
    const t = custom.trim();
    if (!t) return;
    onAddCustom(t);
    setCustom('');
  }

  function renderRow(p) {
    const already = existing.find(h => h.id === p.id);
    return (
      <button
        key={p.id}
        onClick={() => !already && onAdd(p)}
        disabled={!!already}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          gap: 2, textAlign: 'left',
          background: already ? 'rgba(74,27,12,0.04)' : 'var(--card-white)',
          border: '1px dashed var(--line-dashed)',
          borderRadius: 12, padding: '12px 14px',
          cursor: already ? 'default' : 'pointer',
          opacity: already ? 0.55 : 1,
          fontFamily: 'Nunito, sans-serif',
          width: '100%',
        }}>
        <span className="serif" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
          {p.title}{already ? ' · added' : ''}
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.desc}</span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(74,27,12,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div className="paper-bg" style={{
        width: '100%', maxWidth: 430,
        maxHeight: '78vh',
        overflowY: 'auto',
        borderRadius: '22px 22px 0 0',
        padding: '18px 22px 28px',
        boxShadow: '0 -10px 30px rgba(74,27,12,0.2)',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div className="serif" style={{
          fontSize: 18, fontWeight: 500, marginBottom: 4,
        }}>add a habit</div>
        <div className="serif" style={{
          fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14,
        }}>
          pick one to start. small is fine.
        </div>

        <div className="serif" style={{
          fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faded)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
        }}>course habits</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {HABIT_PRESETS_COURSE.map(renderRow)}
        </div>

        <div className="serif" style={{
          fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faded)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
        }}>quick ideas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {HABIT_PRESETS_QUICK.map(renderRow)}
        </div>

        <div className="serif" style={{
          fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faded)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
        }}>custom habit</div>
        <DashedInput
          value={custom}
          onChange={setCustom}
          placeholder="e.g. journal at 9pm"
        />
        <button
          onClick={tryAddCustom}
          disabled={!custom.trim()}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 10, opacity: custom.trim() ? 1 : 0.5 }}>
          add custom habit
        </button>

        <button onClick={onClose} className="btn"
          style={{ marginTop: 10, background: 'transparent', border: '1px dashed var(--line-dashed)', width: '100%' }}>
          done
        </button>
      </div>
    </div>
  );
}

// 30×30 awe walk — calendar grid + per-day check-in (mood + note) + reflection
function Habit30x30({ habit, todayKey, count, onUpdate, onRemove }) {
  const [open, setOpen] = useS(false);
  const [reflectOpen, setReflectOpen] = useS(false);
  const [dayPickIso, setDayPickIso] = useS(null);
  const [dayMood, setDayMood] = useS(3);
  const [dayNote, setDayNote] = useS('');
  const [reflection, setReflection] = useS(habit.reflection || '');

  const start = parseISO(habit.startDate);
  const finished = count >= 30;

  function buildCells() {
    const cells = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = habit.days?.[iso];
      cells.push({ idx: i + 1, iso, entry, future: d > new Date() });
    }
    return cells;
  }

  function openDay(iso, entry) {
    setDayPickIso(iso);
    if (entry && typeof entry === 'object') {
      setDayMood(entry.mood || 3);
      setDayNote(entry.note || '');
    } else if (entry === true) {
      setDayMood(3); setDayNote('');
    } else {
      setDayMood(3); setDayNote('');
    }
  }

  function saveDay() {
    if (!dayPickIso) return;
    const days = { ...(habit.days || {}) };
    days[dayPickIso] = { mood: dayMood, note: dayNote };
    onUpdate({ ...habit, days });
    setDayPickIso(null);
  }

  function clearDay() {
    if (!dayPickIso) return;
    const days = { ...(habit.days || {}) };
    delete days[dayPickIso];
    onUpdate({ ...habit, days });
    setDayPickIso(null);
  }

  function saveReflection() {
    onUpdate({ ...habit, reflection: reflection.trim() });
    setReflectOpen(false);
  }

  return (
    <div className="notebook-card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>
            {habit.title}
          </div>
          <div style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)' }}>
            {count} of 30 days{finished ? ' · done!' : ''}
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'transparent', border: '1px dashed var(--line-dashed)',
            borderRadius: 999, padding: '4px 10px',
            fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
            fontSize: 12, color: 'var(--ink)', cursor: 'pointer',
          }}>{open ? 'hide' : 'open'}</button>
        <button
          onClick={onRemove}
          aria-label="remove habit"
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--ink-faded)', fontSize: 16, cursor: 'pointer',
            padding: '4px 6px',
          }}>×</button>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, background: 'rgba(74,27,12,0.06)', borderRadius: 999,
        marginTop: 10, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, (count / 30) * 100)}%`,
          height: '100%', background: 'var(--accent-mint-deep)',
          transition: 'width 240ms',
        }}/>
      </div>

      {open && (
        <>
          <div style={{ marginTop: 14 }}>
            <div className="serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
              tap any day to check in — mood + a small note
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6,
            }}>
              {buildCells().map(c => {
                const has = !!c.entry;
                const m = has && typeof c.entry === 'object' ? c.entry.mood : null;
                const bg = m ? MOOD_COLORS[m] : (has ? 'var(--accent-mint-deep)' : 'transparent');
                return (
                  <button
                    key={c.iso}
                    onClick={() => !c.future && openDay(c.iso, c.entry)}
                    disabled={c.future}
                    title={c.iso}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      background: bg,
                      color: has ? 'var(--ink)' : 'var(--ink-soft)',
                      border: has ? '1px solid rgba(74,27,12,0.08)' : '1px dashed var(--line-dashed)',
                      cursor: c.future ? 'default' : 'pointer',
                      opacity: c.future ? 0.35 : 1,
                      fontFamily: 'EB Garamond, serif',
                      fontSize: 11,
                      padding: 0,
                    }}>
                    {c.idx}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reflection button — softer before 30 days, bold after */}
          <button
            onClick={() => setReflectOpen(true)}
            className={finished ? 'btn btn-primary' : ''}
            style={finished ? { width: '100%', marginTop: 14 } : {
              width: '100%', marginTop: 14,
              background: 'transparent', border: '1px dashed var(--line-dashed)',
              borderRadius: 12, padding: '10px 14px',
              fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
              color: 'var(--ink)', cursor: 'pointer',
            }}>
            {finished ? 'write your reflection' : (habit.reflection ? 'edit reflection' : 'write a reflection (anytime)')}
          </button>
        </>
      )}

      {/* Day check-in popover */}
      {dayPickIso && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDayPickIso(null); }}
          style={{
            position: 'absolute', inset: 0, zIndex: 60,
            background: 'rgba(74,27,12,0.35)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div className="paper-bg" style={{
            width: 300, padding: 18, borderRadius: 18, boxShadow: '0 10px 40px rgba(74,27,12,0.25)',
          }}>
            <div className="serif" style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              {dayPickIso}
            </div>
            <div className="serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>
              how was your walk today?
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map(m => (
                <button
                  key={m}
                  onClick={() => setDayMood(m)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: MOOD_COLORS[m],
                    border: dayMood === m ? '2px solid var(--ink)' : '1px solid rgba(74,27,12,0.08)',
                    cursor: 'pointer', padding: 0,
                  }}>
                  <MoodFace mood={m} size={20}/>
                </button>
              ))}
            </div>
            <DashedTextarea
              value={dayNote}
              onChange={setDayNote}
              placeholder="what did you notice on the walk?"
              rows={3}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button onClick={() => setDayPickIso(null)} className="btn"
                style={{ flex: 1, background: 'transparent', border: '1px dashed var(--line-dashed)' }}>
                cancel
              </button>
              {habit.days?.[dayPickIso] && (
                <button onClick={clearDay} className="btn"
                  style={{ background: 'transparent', border: '1px dashed var(--line-dashed)', color: '#A33B1F' }}>
                  clear
                </button>
              )}
              <button onClick={saveDay} className="btn btn-primary" style={{ flex: 1 }}>save</button>
            </div>
          </div>
        </div>
      )}

      {/* Reflection editor */}
      {reflectOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setReflectOpen(false); }}
          style={{
            position: 'absolute', inset: 0, zIndex: 60,
            background: 'rgba(74,27,12,0.35)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div className="paper-bg" style={{
            width: 320, padding: 18, borderRadius: 18, boxShadow: '0 10px 40px rgba(74,27,12,0.25)',
          }}>
            <div className="serif" style={{ fontSize: 17, fontWeight: 500, marginBottom: 4 }}>
              your reflection
            </div>
            <div className="serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>
              how did the 30 days feel? what changed? what stood out?
            </div>
            <DashedTextarea
              value={reflection}
              onChange={setReflection}
              placeholder="at least a paragraph…"
              rows={6}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button onClick={() => setReflectOpen(false)} className="btn"
                style={{ flex: 1, background: 'transparent', border: '1px dashed var(--line-dashed)' }}>
                cancel
              </button>
              <button onClick={saveReflection} className="btn btn-primary" style={{ flex: 1 }}>save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HabitsSection({ stickerDensity }) {
  const [habits, setHabits] = useS(loadHabits);
  const [picker, setPicker] = useS(false);

  function persist(next) { setHabits(next); saveHabits(next); }

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  function toggleToday(id) {
    const next = habits.map(h => {
      if (h.id !== id) return h;
      const days = { ...(h.days || {}) };
      days[todayKey] = !days[todayKey];
      return { ...h, days };
    });
    persist(next);
  }

  function addPreset(p) {
    if (habits.find(h => h.id === p.id)) { setPicker(false); return; }
    persist([...habits, { id: p.id, title: p.title, special: p.special || null, startDate: todayKey, days: {} }]);
    setPicker(false);
  }

  function removeHabit(id) {
    persist(habits.filter(h => h.id !== id));
  }

  // A "day done" can be either `true` (legacy) or `{mood, note}` object.
  const isDone = (v) => v === true || (v && typeof v === 'object');

  // Streak count for a habit (consecutive days ending today)
  function streakOf(h) {
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (isDone(h.days?.[k])) { n += 1; d.setDate(d.getDate() - 1); }
      else break;
    }
    return n;
  }

  // 30×30 progress
  function n30Progress(h) {
    if (!h.startDate) return 0;
    const start = parseISO(h.startDate);
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      if (d > today) break;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (isDone(h.days?.[k])) count += 1;
    }
    return count;
  }

  return (
    <div className="card-mount" style={{ animationDelay: '210ms', marginBottom: 18 }}>
      <div className="serif" style={{
        fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)',
        marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>tiny intentions</span>
        <button
          onClick={() => setPicker(true)}
          style={{
            background: 'transparent',
            border: '1px dashed var(--line-dashed)',
            borderRadius: 999, padding: '3px 10px',
            fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
            fontSize: 12, color: 'var(--ink)', cursor: 'pointer',
          }}>+ add</button>
      </div>

      {habits.length === 0 ? (
        <NotebookCard>
          <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-faded)', textAlign: 'center', padding: '12px 8px' }}>
            nothing planted yet — tap "+ add" to start a tiny daily.
          </div>
        </NotebookCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {habits.map(h => {
            const doneToday = !!h.days?.[todayKey];
            const isN30 = h.special === 'nature_30x30';
            const streak = streakOf(h);
            const n30 = isN30 ? n30Progress(h) : null;
            if (isN30) {
              return (
                <Habit30x30
                  key={h.id}
                  habit={h}
                  todayKey={todayKey}
                  count={n30}
                  onUpdate={(next) => persist(habits.map(x => x.id === h.id ? next : x))}
                  onRemove={() => removeHabit(h.id)}
                />
              );
            }
            return (
              <div key={h.id} className="notebook-card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif" style={{ fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>
                      {h.title}
                    </div>
                    <div style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)' }}>
                      {streak > 0 ? `${streak}-day streak` : 'tap when done today'}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleToday(h.id)}
                    aria-label={doneToday ? 'unmark today' : 'mark today done'}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: doneToday ? 'none' : '1.5px dashed var(--line-dashed)',
                      background: doneToday ? 'var(--accent-mint-deep)' : 'transparent',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, padding: 0,
                    }}
                  >{doneToday ? '✓' : ''}</button>
                  <button
                    onClick={() => removeHabit(h.id)}
                    aria-label="remove habit"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--ink-faded)', fontSize: 16, cursor: 'pointer',
                      padding: '4px 6px',
                    }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {picker && (
        <HabitPickerSheet
          existing={habits}
          onAdd={addPreset}
          onAddCustom={(title) => {
            const id = `custom_${Date.now()}`;
            const next = [...habits, { id, title, special: null, startDate: todayKey, days: {} }];
            persist(next);
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TIMELINE screen — calendar with month/year picker + week list
// ─────────────────────────────────────────────────────────────
function TimelineScreen({ timeline, onNav }) {
  const [calMonth, setCalMonth] = useS(TODAY.getMonth());
  const [calYear, setCalYear] = useS(TODAY.getFullYear());
  const [pickerOpen, setPickerOpen] = useS(false);

  // Map ISO date → record
  const byDate = useM(() => {
    const map = {};
    (timeline || []).forEach(r => { map[r.date] = r; });
    return map;
  }, [timeline]);

  // Build calendar cells
  const firstDay = new Date(calYear, calMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const isCurrentMonth = TODAY.getFullYear() === calYear && TODAY.getMonth() === calMonth;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ pad: true, key: `p${i}` });
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ key: iso, day, iso, rec: byDate[iso] || null });
  }

  // Week-grouped list of recent entries (most recent first)
  const weeks = useM(() => {
    if (!timeline?.length) return [];
    const sorted = [...timeline].sort((a, b) => (a.date < b.date ? 1 : -1));
    const groups = [];
    let curr = null;
    for (const rec of sorted) {
      const d = parseISO(rec.date);
      const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
      const k = `${ws.getFullYear()}-${ws.getMonth()}-${ws.getDate()}`;
      if (!curr || curr.key !== k) {
        curr = { key: k, start: ws, days: [] };
        groups.push(curr);
      }
      curr.days.push(rec);
    }
    return groups.slice(0, 6);
  }, [timeline]);

  function weekLabel(start, idx) {
    if (idx === 0) return 'this week';
    if (idx === 1) return 'last week';
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return `${formatDate(start, 'short')} — ${formatDate(end, 'short')}`;
  }

  function goPrev() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }
  function goNext() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }

  const monthLabel = `${MONTH_NAMES[calMonth]} ${calYear}`;

  return (
    <Page hasTabBar>
      <WashiHeader>your forest</WashiHeader>

      {/* Forest growth card */}
      <div className="card-mount" style={{
        position: 'relative',
        marginTop: 18, marginBottom: 22,
        borderRadius: 14,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #C8DCB4 0%, #9BBE92 65%, #6A9377 100%)',
        boxShadow: '0 2px 8px rgba(74,90,53,0.10)',
      }}>
        <svg viewBox="0 0 320 160" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 140 }}>
          {/* Distant hills */}
          <path d="M 0 110 Q 80 80 160 100 T 320 92 L 320 160 L 0 160 Z" fill="#6A9377" opacity="0.6"/>
          <path d="M 0 124 Q 80 100 180 120 T 320 110 L 320 160 L 0 160 Z" fill="#568366" opacity="0.7"/>
          {/* Sun / moon */}
          <circle cx="270" cy="32" r="14" fill="#FCE9B6" opacity="0.85"/>
          {/* Trees — count scales with entry density */}
          {(() => {
            const entries = (timeline || []).filter(r => r.mood != null || r.practice).length;
            const treeCount = Math.min(8, Math.max(2, Math.floor(entries / 2) + 2));
            const trees = [];
            for (let i = 0; i < treeCount; i++) {
              const x = 30 + i * (260 / Math.max(1, treeCount - 1));
              const baseY = 130 + (i % 2 ? 0 : -3);
              const size = 0.85 + ((i * 13) % 7) * 0.04;
              const isPine = i % 3 === 0;
              if (isPine) {
                trees.push(
                  <g key={i} transform={`translate(${x} ${baseY}) scale(${size})`}>
                    <rect x="-3" y="-6" width="6" height="12" fill="#5a3f24"/>
                    <path d="M -16 -8 L 0 -38 L 16 -8 Z" fill="#4A7752"/>
                    <path d="M -13 -22 L 0 -48 L 13 -22 Z" fill="#568366"/>
                    <path d="M -10 -34 L 0 -56 L 10 -34 Z" fill="#6FA378"/>
                  </g>
                );
              } else {
                trees.push(
                  <g key={i} transform={`translate(${x} ${baseY}) scale(${size})`}>
                    <rect x="-2.5" y="-4" width="5" height="10" fill="#5a3f24"/>
                    <circle cx="0" cy="-22" r="18" fill="#568366"/>
                    <circle cx="-10" cy="-18" r="11" fill="#6FA378"/>
                    <circle cx="9" cy="-19" r="10" fill="#7AAB7C"/>
                    <circle cx="0" cy="-32" r="9" fill="#A8D49B"/>
                  </g>
                );
              }
            }
            return trees;
          })()}
          {/* Foreground grass + flowers */}
          <path d="M 0 138 Q 80 132 160 138 T 320 136 L 320 160 L 0 160 Z" fill="#4A7752"/>
          <circle cx="44" cy="148" r="1.6" fill="#F5C7A1"/>
          <circle cx="118" cy="151" r="1.4" fill="#FCE9B6"/>
          <circle cx="232" cy="149" r="1.6" fill="#F5C7A1"/>
        </svg>
        <div style={{
          padding: '10px 14px 14px',
          background: 'rgba(255,253,247,0.92)',
          borderTop: '1px solid rgba(74,90,53,0.10)',
        }}>
          <div className="serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--ink)' }}>
            {(() => {
              const entries = (timeline || []).filter(r => r.mood != null || r.practice).length;
              if (entries === 0) return 'your forest is waiting for its first seed.';
              if (entries < 4) return `${entries} small things have grown.`;
              if (entries < 10) return `your forest is filling in — ${entries} entries so far.`;
              return `${entries} entries. quite a forest you've grown.`;
            })()}
          </div>
        </div>
      </div>

      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 }}>
        <button
          onClick={() => setPickerOpen(true)}
          className="serif"
          style={{
            background: 'transparent', border: '1px dashed var(--line-dashed)',
            borderRadius: 999, padding: '4px 10px',
            color: 'var(--ink)', fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
          }}>{monthLabel}</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={goPrev} className="btn-back" aria-label="previous month"
            style={{ width: 32, height: 32, fontSize: 16 }}>‹</button>
          <button onClick={goNext} className="btn-back" aria-label="next month"
            style={{ width: 32, height: 32, fontSize: 16 }}>›</button>
        </div>
      </div>

      {/* Weekday strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6,
        fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
        fontSize: 11, color: 'var(--ink-faded)', textAlign: 'center', marginBottom: 6,
      }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 22 }}>        {cells.map(c => {
          if (c.pad) return <div key={c.key} className="heat-dot" style={{ visibility: 'hidden' }}/>;
          const m = recordToMood(c.rec);
          const isToday = isCurrentMonth && c.day === TODAY.getDate();
          const hasEntry = !!c.rec;
          return (
            <button
              key={c.key}
              onClick={() => hasEntry && onNav({ name: 'entryDetail', data: c.rec })}
              disabled={!hasEntry}
              className={`heat-dot ${m == null ? 'empty' : ''} ${isToday ? 'today' : ''}`}
              style={{
                background: m ? MOOD_COLORS[m] : 'transparent',
                cursor: hasEntry ? 'pointer' : 'default',
                border: m ? '1px solid rgba(74,27,12,0.06)' : '1px dashed var(--line-dashed)',
                color: m ? 'var(--ink)' : 'rgba(74,27,12,0.4)',
              }}
              title={c.iso}
            >
              <span style={{ fontSize: 10 }}>{c.day}</span>
            </button>
          );
        })}
      </div>

      {/* Month insights — stats, words, gentle note */}
      <MonthInsights
        timeline={timeline}
        onNav={onNav}
        monthStart={new Date(calYear, calMonth, 1)}
        monthEnd={new Date(calYear, calMonth + 1, 0)}
      />

      {/* Week-grouped journals */}
      {weeks.length === 0 && (
        <div className="serif" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontStyle: 'italic', padding: '24px 8px' }}>
          no entries yet — your check-ins will show here.
        </div>
      )}
      {weeks.map((w, wi) => (
        <div key={w.key} className="card-mount" style={{ animationDelay: `${wi * 60}ms`, marginBottom: 20 }}>
          <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
            {weekLabel(w.start, wi)}
          </div>
          <NotebookCard>
            {w.days.map((rec, di) => {
              const dObj = parseISO(rec.date);
              const m = recordToMood(rec);
              const note = noteFromJournal(rec.journal_text) || `${MOOD_LABELS[m] || ''} day`;
              const isFirstAndCurrent = wi === 0 && di === 0
                && parseISO(rec.date).toDateString() === TODAY.toDateString();
              return (
                <button
                  key={rec.date}
                  onClick={() => onNav({ name: 'entryDetail', data: rec })}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 36px 1fr',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: di === w.days.length - 1 ? 'none' : '1px dashed var(--line-dashed)',
                    background: 'transparent', border: 'none',
                    width: '100%', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'Nunito, sans-serif', color: 'var(--ink)',
                  }}
                >
                  <span className="serif" style={{
                    fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic',
                  }}>
                    {isFirstAndCurrent ? 'today' : formatDate(dObj, 'short')}
                  </span>
                  {m != null ? (
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: MOOD_COLORS[m],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(74,27,12,0.08)',
                    }}>
                      <MoodFace mood={m} size={18}/>
                    </span>
                  ) : (
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: '1px dashed var(--ink-faded)',
                    }}/>
                  )}
                  <span style={{
                    fontSize: 14, color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {note || '—'}
                  </span>
                </button>
              );
            })}
          </NotebookCard>
        </div>
      ))}

      {/* Month/year picker modal */}
      {pickerOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPickerOpen(false); }}
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(74,27,12,0.35)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div className="paper-bg" style={{ width: 280, padding: 20, borderRadius: 18, boxShadow: '0 10px 40px rgba(74,27,12,0.25)' }}>
            <div className="serif" style={{ fontSize: 17, fontWeight: 500, textAlign: 'center', marginBottom: 14 }}>
              pick a month
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <select
                value={calMonth}
                onChange={(e) => setCalMonth(Number(e.target.value))}
                style={{ flex: 1, padding: '8px 10px', border: '1px dashed var(--line-dashed)', borderRadius: 10, background: '#fff', fontFamily: 'Nunito' }}
              >
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={calYear}
                onChange={(e) => setCalYear(Number(e.target.value))}
                style={{ flex: 1, padding: '8px 10px', border: '1px dashed var(--line-dashed)', borderRadius: 10, background: '#fff', fontFamily: 'Nunito' }}
              >
                {Array.from({ length: 7 }, (_, i) => TODAY.getFullYear() - 5 + i).map(y =>
                  <option key={y} value={y}>{y}</option>
                )}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPickerOpen(false)} className="btn"
                style={{ flex: 1, background: 'transparent', border: '1px dashed var(--line-dashed)' }}>cancel</button>
              <button onClick={() => setPickerOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>go</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────
// PRACTICES catalog — uses real catalog from API
// ─────────────────────────────────────────────────────────────
const STICKER_BY_ID = {
  gratitude: 'sparkle',
  best_possible_self: 'star',
  cognitive_reframing: 'cloud',
  savoring: 'sun',
  breathing_grounding: 'leaf',
  meditation: 'moon',
  perma_baseline_authentic_happiness: 'star',
  gratitude_letter_wb2: 'heart',
  savoring_homework_wb2: 'sun',
  three_good_things_wb2: 'sparkle',
  hope_plan_wb2: 'star',
  optimism_style_self_report_wb2: 'flower',
  best_possible_self_expanded_wb2: 'moon',
  awe_walk_wb2: 'leaf',
  nature_challenge_30x30_wb2: 'mushroom',
  curiosity_practice_wb2: 'sparkle',
  wellbeing_writing_analysis_wb2: 'cloud',
  earth_day_wb2: 'flower',
  pay_it_forward_wb2: 'heart',
  strengths_use_wb2: 'star',
  flow_intervention_wb2: 'bird',
  kindness_self_other_wb2: 'heart',
};

// Category mapping — groups practices into themes for the catalog screen
const CATEGORY_BY_ID = {
  gratitude: 'gratitude',
  gratitude_letter_wb2: 'gratitude',
  three_good_things_wb2: 'gratitude',
  pay_it_forward_wb2: 'gratitude',
  kindness_self_other_wb2: 'gratitude',
  savoring: 'savoring',
  savoring_homework_wb2: 'savoring',
  awe_walk_wb2: 'savoring',
  nature_challenge_30x30_wb2: 'savoring',
  earth_day_wb2: 'savoring',
  best_future_self: 'looking forward',
  hope_plan_wb2: 'looking forward',
  best_possible_self_expanded_wb2: 'looking forward',
  optimism_style_self_report_wb2: 'looking forward',
  cognitive_reframing: 'reframing',
  wellbeing_writing_analysis_wb2: 'reframing',
  breathing_grounding: 'calming',
  meditation: 'calming',
  curiosity_practice_wb2: 'exploring',
  flow_intervention_wb2: 'exploring',
  strengths_use_wb2: 'exploring',
  perma_baseline_authentic_happiness: 'exploring',
};
const CATEGORY_ORDER = ['gratitude', 'savoring', 'looking forward', 'reframing', 'calming', 'exploring'];

function shortDesc(item) {
  if (!item) return '';
  const s = (item.summary || '').replace(/\n/g, ' ').trim();
  if (s.length <= 90) return s;
  return s.slice(0, 90).trim() + '…';
}

function PracticeCard({ p, sizeBig = false, delay = 0, sticker, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card-mount notebook-card"
      style={{
        animationDelay: `${delay}ms`,
        border: 'none',
        padding: sizeBig ? '20px 18px' : '16px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'Nunito, sans-serif',
        color: 'var(--ink)',
        position: 'relative',
        overflow: 'visible',
        background: sizeBig ? 'var(--accent-mint)' : 'var(--card-white)',
      }}
    >
      <div style={{ position: 'absolute', top: -10, right: -4 }}>
        <Sticker type={sticker || STICKER_BY_ID[p.id] || 'sparkle'} size={sizeBig ? 48 : 32} rotation={sizeBig ? 12 : -6}/>
      </div>
      <div className="serif" style={{
        fontSize: sizeBig ? 20 : 16, fontWeight: 500,
        marginBottom: 4, paddingRight: 36,
      }}>{p.title.toLowerCase()}</div>
      <div style={{ fontSize: sizeBig ? 14 : 12.5, color: 'var(--ink-soft)', marginBottom: 8, lineHeight: 1.45 }}>
        {shortDesc(p)}
      </div>
      <span style={{
        display: 'inline-block',
        background: sizeBig ? 'rgba(255,255,255,0.6)' : 'var(--paper-soft)',
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 11,
        color: 'var(--ink-soft)',
      }}>{p.duration_approx || '~5 min'}</span>
    </button>
  );
}

function PracticesScreen({ catalog, onNav, recommendation }) {
  // Featured = AI recommendation if available, else "three good things"
  const featured = useM(() => {
    if (!catalog?.length) return null;
    if (recommendation?.id) {
      const m = catalog.find(p => p.id === recommendation.id);
      if (m) return { ...m, _reason: recommendation.reason };
    }
    return catalog.find(p => p.id === 'three_good_things_wb2')
        || catalog.find(p => p.id === 'savoring')
        || catalog[0];
  }, [catalog, recommendation]);

  // Build category groups with the catalog records, grouped by CATEGORY_BY_ID
  // in CATEGORY_ORDER. Anything without a known category falls through silently.
  const byId = useM(() => Object.fromEntries((catalog || []).map(p => [p.id, p])), [catalog]);
  const wellnessItems = useM(() =>
    MENTAL_WELLNESS_IDS.map(id => byId[id]).filter(Boolean),
  [byId]);
  const groups = useM(() => {
    if (!catalog?.length) return [];
    const buckets = {};
    for (const p of catalog) {
      if (MENTAL_WELLNESS_IDS.includes(p.id)) continue;
      const cat = CATEGORY_BY_ID[p.id];
      if (!cat) continue;
      (buckets[cat] = buckets[cat] || []).push(p);
    }
    return CATEGORY_ORDER
      .filter(cat => buckets[cat] && buckets[cat].length)
      .map(cat => ({ id: cat, title: cat, items: buckets[cat] }));
  }, [catalog]);

  if (!catalog?.length) {
    return (
      <Page hasTabBar>
        <WashiHeader>practices</WashiHeader>
        <div className="serif" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontStyle: 'italic', padding: 40 }}>
          loading…
        </div>
      </Page>
    );
  }

  return (
    <Page hasTabBar>
      <WashiHeader>practices</WashiHeader>

      {/* Featured: today's recommendation */}
      <div className="card-mount" style={{ marginTop: 22, marginBottom: 18 }}>
        <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
          {recommendation?.id === featured?.id ? "today's pick for you" : "always good"}
        </div>
        <PracticeCard
          p={featured}
          sizeBig
          onClick={() => onNav({ name: 'practiceDetail', id: featured.id })}
        />
        {featured._reason && (
          <div style={{
            marginTop: 8, fontSize: 12, color: 'var(--ink-soft)',
            fontFamily: 'EB Garamond, serif', fontStyle: 'italic', lineHeight: 1.5,
          }}>
            {featured._reason}
          </div>
        )}
      </div>

      {/* Mental wellness — elevated, distinct section */}
      {wellnessItems.length > 0 && (
        <div style={{ marginBottom: 20, marginTop: 6 }}>
          <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
            mental wellness
            <span style={{ color: 'var(--ink-faded)' }}> · calm the body first</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {wellnessItems.map(p => (
              <button
                key={p.id}
                onClick={() => onNav({ name: 'practiceDetail', id: p.id })}
                className="card-mount"
                style={{
                  position: 'relative',
                  background: 'var(--accent-mint)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                  color: 'var(--ink)',
                  overflow: 'visible',
                  minHeight: 120,
                }}
              >
                <div style={{ position: 'absolute', top: -10, right: -4 }}>
                  <Sticker type={STICKER_BY_ID[p.id] || 'leaf'} size={36} rotation={-8}/>
                </div>
                <div className="serif" style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, paddingRight: 30 }}>
                  {p.title.toLowerCase()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: 6 }}>
                  {shortDesc(p)}
                </div>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 10,
                  color: 'var(--ink-soft)',
                }}>{p.duration_approx || ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category groups */}
      {groups.map((g, gi) => {
        // Skip the currently-featured item to avoid duplicates
        const items = g.items.filter(p => p.id !== featured?.id);
        if (!items.length) return null;
        return (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', margin: '14px 0 8px' }}>
              {g.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((p, i) => (
                <PracticeCard
                  key={p.id}
                  p={p}
                  delay={gi * 60 + i * 40}
                  onClick={() => onNav({ name: 'practiceDetail', id: p.id })}
                />
              ))}
            </div>
          </div>
        );
      })}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────
// PRACTICE DETAIL — render dynamic fields, save to backend
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// WELLNESS SESSION — YouTube + breathing orb + timer + reflect
// ─────────────────────────────────────────────────────────────
function WellnessSessionScreen({ practice, onNav, reloadTimeline }) {
  const isMed = practice.session_type === 'meditation';
  const defaultSecs = isMed ? 600 : 120;
  const [secsLeft, setSecsLeft] = useS(defaultSecs);
  const [running, setRunning] = useS(false);
  const [reflection, setReflection] = useS('');
  const [saving, setSaving] = useS(false);
  const tickRef = useR(null);

  useE(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(tickRef.current); setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  function fmt(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const d = new Date();
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const payload = {
        date: iso,
        intervention_type: practice.id,
        completed: secsLeft === 0,
        helpfulness: 4,
        notes: reflection.trim(),
        responses: {},
      };
      await apiFetch('/practice/submit', { method: 'POST', body: JSON.stringify(payload) });
      if (reloadTimeline) reloadTimeline();
      onNav({ name: 'practiceDone', id: practice.id });
    } finally { setSaving(false); }
  }

  // Breathing orb scale animation — pulses with inhale/exhale.
  // Inhale 4s, exhale 6s for breathing variant; calmer 5/5 for meditation.
  const inhale = isMed ? 5 : 4;
  const exhale = isMed ? 5 : 6;
  const cycle = inhale + exhale;

  return (
    <div className="paper-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="scroll-area page-enter" style={{
        paddingTop: 56, paddingLeft: 22, paddingRight: 22, paddingBottom: 32,
      }}>
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
          <BackBtn onClick={() => onNav({ name: 'practices' })}/>
        </div>
        <WashiHeader>{practice.title.toLowerCase()}</WashiHeader>

        <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 14, marginBottom: 10 }}>
          {practice.summary}
        </div>

        {/* Breathing orb — CSS animation that pulses inhale/exhale */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '14px 0 12px',
        }}>
          <div style={{
            width: 150, height: 150, borderRadius: '50%',
            background: isMed
              ? 'radial-gradient(circle at 30% 30%, #C0DD97, #9FE1CB)'
              : 'radial-gradient(circle at 30% 30%, #F4C0D1, #FAC775)',
            border: '1px solid rgba(74,27,12,0.08)',
            boxShadow: '0 8px 30px rgba(244,192,209,0.35), inset 0 0 30px rgba(255,255,255,0.4)',
            animation: running ? `wellnessOrb ${cycle}s ease-in-out infinite` : 'none',
            transform: 'scale(0.85)',
            transition: 'transform 600ms ease',
          }}/>
        </div>
        <style>{`
          @keyframes wellnessOrb {
            0%   { transform: scale(0.85); }
            ${Math.round((inhale / cycle) * 100)}%  { transform: scale(1.12); }
            100% { transform: scale(0.85); }
          }
        `}</style>

        <div className="serif" style={{
          fontStyle: 'italic', textAlign: 'center', color: 'var(--ink-soft)', marginBottom: 6,
        }}>
          {practice.phase_label || (isMed ? 'just sit. notice.' : 'in 4, out 6.')}
        </div>
        <div className="serif" style={{
          textAlign: 'center', fontSize: 38, color: 'var(--ink)', margin: '0 0 12px',
          letterSpacing: '0.02em', fontWeight: 500,
        }}>{fmt(secsLeft)}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setRunning(r => !r)}
            className="btn btn-primary"
            style={{ flex: 1 }}>
            {running ? 'pause' : (secsLeft === 0 ? 'restart' : 'start')}
          </button>
          {(secsLeft !== defaultSecs) && (
            <button
              onClick={() => { setRunning(false); setSecsLeft(defaultSecs); }}
              className="btn"
              style={{ background: 'transparent', border: '1px dashed var(--line-dashed)' }}>
              reset
            </button>
          )}
        </div>

        {/* Optional video */}
        {practice.video_id && (
          <div style={{ marginBottom: 18 }}>
            <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 13, marginBottom: 6 }}>
              guided video (optional)
            </div>
            <div style={{
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 1px 0 rgba(74,27,12,0.04)',
              aspectRatio: '16 / 9',
            }}>
              <iframe
                title={practice.title}
                src={`https://www.youtube.com/embed/${practice.video_id}?rel=0`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Optional reflection */}
        <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 13, marginBottom: 6 }}>
          afterward (optional)
        </div>
        <DashedTextarea
          value={reflection}
          onChange={setReflection}
          placeholder="anything you want to remember — one line is enough."
          rows={3}
        />

        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 14, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'saving…' : 'save session'}
        </button>
      </div>
    </div>
  );
}

function PracticeDetailScreen({ id, catalog, onNav, reloadTimeline }) {
  const practice = useM(() => {
    return (catalog || []).find(p => p.id === id) || null;
  }, [catalog, id]);

  // If this is a guided wellness session (breathing/meditation), render the session screen instead.
  if (practice && practice.session_type) {
    return <WellnessSessionScreen practice={practice} onNav={onNav} reloadTimeline={reloadTimeline}/>;
  }

  const fields = practice?.fields || [];
  const [responses, setResponses] = useS({});
  const [saving, setSaving] = useS(false);
  const [analyzing, setAnalyzing] = useS(false);
  const [analysis, setAnalysis] = useS('');
  const [analyzeErr, setAnalyzeErr] = useS('');

  useE(() => {
    setResponses({}); setAnalysis(''); setAnalyzeErr('');
  }, [id]);

  async function runAnalysis() {
    if (analyzing) return;
    const samples = ['ww_sample_1', 'ww_sample_2']
      .map(k => responses[k])
      .filter(s => s && s.trim().length > 50);
    if (!samples.length) {
      setAnalyzeErr('paste at least one writing sample (50+ characters) first.');
      return;
    }
    setAnalyzing(true); setAnalyzeErr('');
    try {
      const r = await apiFetch('/analyze-writing', {
        method: 'POST',
        body: JSON.stringify({ samples }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        if (r.status === 503) setAnalyzeErr('AI analysis is off — set OPENAI_API_KEY in .env to enable.');
        else setAnalyzeErr(d.detail || 'could not analyze right now.');
        return;
      }
      const d = await r.json();
      setAnalysis(d.analysis || '');
    } catch {
      setAnalyzeErr('could not reach the analysis service.');
    } finally { setAnalyzing(false); }
  }

  const canSave = Object.values(responses).some(v => (v || '').trim().length > 0);

  function setField(key, val) {
    setResponses(prev => ({ ...prev, [key]: val }));
  }

  async function save() {
    if (!practice || saving) return;
    setSaving(true);
    try {
      const payload = {
        date: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        intervention_type: practice.id,
        completed: true,
        helpfulness: 4,
        notes: '',
        responses: Object.fromEntries(Object.entries(responses).filter(([_, v]) => v && v.trim())),
      };
      const r = await apiFetch('/practice/submit', { method: 'POST', body: JSON.stringify(payload) });
      if (r.ok) {
        if (reloadTimeline) reloadTimeline();
        onNav({ name: 'practiceDone', id: practice.id });
      }
    } finally { setSaving(false); }
  }

  if (!practice) {
    return (
      <div className="paper-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="scroll-area page-enter" style={{ paddingTop: 56, paddingLeft: 22, paddingRight: 22 }}>
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
            <BackBtn onClick={() => onNav({ name: 'practices' })}/>
          </div>
          <WashiHeader>{formatDate(TODAY, 'long')}</WashiHeader>
          <div className="serif" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontStyle: 'italic', padding: 40 }}>
            loading…
          </div>
        </div>
      </div>
    );
  }

  const stickerType = STICKER_BY_ID[practice.id] || 'sparkle';

  return (
    <div className="paper-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="scroll-area page-enter" style={{
        paddingTop: 56, paddingLeft: 22, paddingRight: 22, paddingBottom: 110,
      }}>
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
          <BackBtn onClick={() => onNav({ name: 'practices' })}/>
        </div>
        <WashiHeader>{formatDate(TODAY, 'long')}</WashiHeader>

        <div style={{ position: 'relative', marginTop: 22, marginBottom: 14 }}>
          <h1 className="serif" style={{ margin: 0, fontSize: 26, fontWeight: 500, color: 'var(--ink)', maxWidth: '78%' }}>
            {practice.title.toLowerCase()}
          </h1>
          <div style={{ position: 'absolute', top: -4, right: 0 }}>
            <Sticker type={stickerType} size={48} rotation={-10}/>
          </div>
        </div>

        {practice.summary && (
          <p className="serif" style={{
            fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)',
            marginTop: 0, marginBottom: 22,
            whiteSpace: 'pre-line',
          }}>
            {practice.summary}
          </p>
        )}

        {practice.duration_approx && (
          <div style={{ marginBottom: 18 }}>
            <span style={{
              display: 'inline-block',
              background: 'var(--paper-soft)',
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 11,
              color: 'var(--ink-soft)',
            }}>{practice.duration_approx}</span>
          </div>
        )}

        {fields.length === 0 && (
          <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 15, marginBottom: 22 }}>
            this is a guided practice — sit with it, then come back to mark it done.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {fields.map((f, i) => {
            const useTextarea = (f.label && f.label.length > 30)
              || (f.hint && f.hint.length > 60)
              || (f.placeholder && f.placeholder.length > 50);
            return (
              <div key={f.key || i} className="card-mount" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="serif" style={{
                  fontSize: 14, fontStyle: 'italic',
                  color: 'var(--ink-soft)', marginBottom: 4,
                  whiteSpace: 'pre-line',
                }}>
                  {f.label}
                </div>
                {f.hint && (
                  <div style={{ fontSize: 12, color: 'var(--ink-faded)', marginBottom: 8, lineHeight: 1.5 }}>
                    {f.hint}
                  </div>
                )}
                {useTextarea ? (
                  <DashedTextarea
                    value={responses[f.key] || ''}
                    onChange={(v) => setField(f.key, v)}
                    placeholder={f.placeholder || ''}
                    rows={3}
                  />
                ) : (
                  <DashedInput
                    value={responses[f.key] || ''}
                    onChange={(v) => setField(f.key, v)}
                    placeholder={f.placeholder || ''}
                  />
                )}
              </div>
            );
          })}

          {fields.length === 0 && (
            <div className="card-mount">
              <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6 }}>
                a quick note (optional)
              </div>
              <DashedTextarea
                value={responses.note || ''}
                onChange={(v) => setField('note', v)}
                placeholder="anything you want to remember…"
                rows={3}
              />
            </div>
          )}

          {/* AI analysis button — only for exercises that opt in via supports_ai_analysis */}
          {practice.supports_ai_analysis && (
            <div className="card-mount" style={{ marginTop: 8 }}>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="btn btn-primary"
                style={{ width: '100%', opacity: analyzing ? 0.6 : 1 }}>
                {analyzing ? 'analyzing…' : '✨ analyze with AI'}
              </button>
              {analyzeErr && (
                <div style={{ color: '#A33B1F', fontSize: 13, marginTop: 8 }}>{analyzeErr}</div>
              )}
              {analysis && (
                <div className="notebook-card" style={{
                  marginTop: 12, padding: '14px 16px',
                  background: 'var(--accent-mint)',
                  whiteSpace: 'pre-wrap',
                }}>
                  <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 12, marginBottom: 6 }}>
                    AI analysis · not a diagnosis
                  </div>
                  <div className="serif" style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>
                    {analysis}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 22px 28px',
        background: 'linear-gradient(to top, var(--paper) 60%, rgba(250,238,218,0))',
      }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', opacity: (canSave || fields.length === 0) && !saving ? 1 : 0.5, cursor: (canSave || fields.length === 0) && !saving ? 'pointer' : 'not-allowed' }}
          disabled={!(canSave || fields.length === 0) || saving}
          onClick={save}
        >
          {saving ? 'saving…' : 'save to journal'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRACTICE DONE — celebration
// ─────────────────────────────────────────────────────────────
function PracticeDoneScreen({ id, catalog, onNav }) {
  const practice = (catalog || []).find(p => p.id === id) || (catalog || [])[0];
  // count practices done this week (incl. this one)
  const weekCount = useM(() => {
    try {
      const log = JSON.parse(localStorage.getItem('moodpath_practice_log') || '[]');
      const now = new Date();
      const weekAgo = now.getTime() - 7 * 24 * 3600 * 1000;
      return log.filter(x => x.at && x.at >= weekAgo).length;
    } catch (e) { return 1; }
  }, []);
  // log this completion locally (lightweight, separate from server)
  useE(() => {
    if (!practice) return;
    try {
      const log = JSON.parse(localStorage.getItem('moodpath_practice_log') || '[]');
      log.push({ id: practice.id, at: Date.now() });
      localStorage.setItem('moodpath_practice_log', JSON.stringify(log.slice(-200)));
    } catch (e) {}
  }, []);
  const stickerType = STICKER_BY_ID[practice?.id] || 'sparkle';
  const week = Math.max(1, weekCount);
  // gentle line pool, picked deterministically from current minute so it varies each session
  const lines = [
    'you showed up today.',
    'small care, well placed.',
    'thank you for tending to yourself.',
    'tucked into your notebook.',
    'this one counts.',
    'a soft hour, well spent.',
  ];
  const line = lines[new Date().getMinutes() % lines.length];
  return (
    <div className="paper-bg" style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      {/* ambient drifting leaves/sparkles */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[
          { t: 'leaf', size: 22, left: '12%', delay: '0s', rot: -18, dur: '7s' },
          { t: 'sparkle', size: 16, left: '78%', delay: '1.4s', rot: 10, dur: '8s' },
          { t: 'flower', size: 20, left: '28%', delay: '2.8s', rot: 6, dur: '9s' },
          { t: 'leaf', size: 18, left: '64%', delay: '4.2s', rot: 22, dur: '7.5s' },
          { t: 'sparkle', size: 14, left: '46%', delay: '5.6s', rot: -8, dur: '8.5s' },
        ].map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.left, top: -40,
            animation: `gentleFall ${p.dur} linear ${p.delay} infinite`,
            opacity: 0.55,
          }}>
            <Sticker type={p.t} size={p.size} rotation={p.rot}/>
          </div>
        ))}
      </div>

      {/* corner anchors (kept faint, lower opacity than before) */}
      <div style={{ position: 'absolute', top: 80, left: 30, opacity: 0.35 }}>
        <Sticker type="leaf" size={32} rotation={-20}/>
      </div>
      <div style={{ position: 'absolute', bottom: 200, right: 36, opacity: 0.35 }}>
        <Sticker type="flower" size={32} rotation={8}/>
      </div>

      {/* hero sticker — gentle bobbing after peel */}
      <div className="sticker-peel" style={{ marginBottom: 28, animation: 'stickerPeel 700ms ease-out, gentleBob 4s ease-in-out 700ms infinite' }}>
        <Sticker type={stickerType} size={120} rotation={-6}/>
      </div>

      <div className="serif fade-up" style={{
        fontSize: 13, fontStyle: 'italic', color: 'var(--ink-faded)',
        letterSpacing: 0.5, marginBottom: 4,
      }}>
        — tucked into your notebook —
      </div>

      <h1 className="serif fade-up" style={{
        margin: 0, fontSize: 30, fontWeight: 500, color: 'var(--ink)',
        textAlign: 'center', maxWidth: 300, lineHeight: 1.2,
        animationDelay: '120ms',
      }}>
        {(practice?.title || 'practice').toLowerCase()}
      </h1>

      <p className="serif fade-up" style={{
        marginTop: 14, marginBottom: 0,
        fontSize: 16, fontStyle: 'italic', color: 'var(--ink-soft)',
        textAlign: 'center', maxWidth: 280,
        animationDelay: '320ms',
      }}>
        {line}
      </p>

      {/* weekly chip */}
      <div className="fade-up" style={{
        marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--paper-soft, rgba(225,235,210,0.5))',
        border: '1px solid rgba(74,27,12,0.10)',
        borderRadius: 999, padding: '6px 14px',
        animationDelay: '480ms',
      }}>
        <Sticker type="sparkle" size={14} rotation={-8}/>
        <span className="serif" style={{ fontSize: 13, color: 'var(--ink)' }}>
          {week} {week === 1 ? 'practice' : 'practices'} this week
        </span>
      </div>

      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 30, width: '100%', maxWidth: 280, animationDelay: '640ms' }}>
        <button
          className="btn btn-primary"
          onClick={() => onNav({ name: 'today' })}
        >
          back to today
        </button>
        <button
          onClick={() => onNav({ name: 'timeline' })}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 14,
            color: 'var(--ink-soft)', padding: '6px 8px',
          }}>
          see it in your timeline →
        </button>
      </div>

      <style>{`
        @keyframes gentleFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.55; }
          90%  { opacity: 0.45; }
          100% { transform: translateY(105vh) rotate(220deg); opacity: 0; }
        }
        @keyframes gentleBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE / ME — real journals + stats
// ─────────────────────────────────────────────────────────────
function MeScreen({ state, timeline, user, onLogout, onNav }) {
  const totalEntries = timeline?.length || 0;
  const monthEntries = useM(() => {
    if (!timeline) return 0;
    return timeline.filter(r => {
      const d = parseISO(r.date);
      return d.getFullYear() === TODAY.getFullYear() && d.getMonth() === TODAY.getMonth();
    }).length;
  }, [timeline]);

  const recent = useM(() => {
    if (!timeline) return [];
    return [...timeline].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  }, [timeline]);

  const initial = (user?.username || 'you').slice(0, 1).toUpperCase();

  return (
    <Page hasTabBar>
      <WashiHeader>your notebook</WashiHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, marginBottom: 22 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-pink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'EB Garamond, serif',
          fontSize: 28, color: 'var(--ink)',
          border: '1.5px solid rgba(74,27,12,0.1)',
        }}>{initial}</div>
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{user?.username || 'friend'}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>welcome back</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
        {[
          { v: totalEntries, l: 'entries' },
          { v: state.streak, l: 'day streak' },
          { v: monthEntries, l: 'this month' },
        ].map((s, i) => (
          <div key={i} className="card-mount notebook-card" style={{
            animationDelay: `${i * 60}ms`,
            padding: '14px 10px',
            textAlign: 'center',
          }}>
            <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)' }}>{s.v}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Weekly report — notebook spread */}
      <button
        onClick={() => onNav({ name: 'weeklyReport' })}
        className="card-mount notebook-card"
        style={{
          position: 'relative',
          width: '100%',
          textAlign: 'left',
          border: '1px solid rgba(74,27,12,0.1)',
          background: 'var(--paper, #FCFAEF)',
          padding: '16px 16px 16px 18px',
          marginBottom: 22,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          overflow: 'visible',
          fontFamily: 'Nunito, sans-serif',
        }}>
        {/* tape accent */}
        <span style={{
          position: 'absolute', top: -8, left: 22, width: 50, height: 14,
          transform: 'rotate(-4deg)',
          background: 'rgba(159, 225, 203, 0.65)',
          border: '1px dashed rgba(74,27,12,0.18)',
        }}/>
        <div style={{ flex: '0 0 auto' }}>
          <Sticker type="leaf" size={42} rotation={-12}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
            this week
          </div>
          <div className="serif" style={{
            fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 2,
          }}>
            a small spread of how it went.
          </div>
        </div>
        <span style={{ fontSize: 22, color: 'var(--ink-faded)', flex: '0 0 auto' }}>→</span>
      </button>

      {/* Monthly report folded into Forest tab. */}

      <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
        your journals
      </div>
      {recent.length === 0 ? (
        <NotebookCard style={{ marginBottom: 22 }}>
          <div className="serif" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontStyle: 'italic', padding: 16 }}>
            no journals yet — start with today.
          </div>
        </NotebookCard>
      ) : (
        <NotebookCard style={{ marginBottom: 22 }}>
          {recent.map((rec, i) => {
            const m = recordToMood(rec);
            const dObj = parseISO(rec.date);
            const note = noteFromJournal(rec.journal_text) || `${MOOD_LABELS[m] || ''} day`;
            return (
              <button
                key={rec.date}
                onClick={() => onNav({ name: 'entryDetail', data: rec })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i === recent.length - 1 ? 'none' : '1px dashed var(--line-dashed)',
                  background: 'transparent', border: 'none',
                  width: '100%', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: m ? MOOD_COLORS[m] : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(74,27,12,0.08)',
                  flex: '0 0 auto',
                }}>
                  {m && <MoodFace mood={m} size={18}/>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                    {formatDate(dObj, 'long')}
                  </div>
                  <div style={{
                    fontSize: 14, color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {note}
                  </div>
                </div>
                <span style={{ fontSize: 18, color: 'var(--ink-faded)' }}>→</span>
              </button>
            );
          })}
        </NotebookCard>
      )}

      {/* Trends section — folded into Weekly Report (this week) above. */}

      <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
        settings
      </div>
      <NotebookCard style={{ marginBottom: 14 }}>
        <ExpandableRow title="help · crisis support" defaultOpen={false}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55, marginBottom: 8 }}>
            if things feel heavy, these are real, free, and human.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="tel:988" style={{
              display: 'block', padding: '10px 12px',
              background: 'var(--paper-soft)', borderRadius: 10,
              fontFamily: 'EB Garamond, serif', color: 'var(--ink)', textDecoration: 'none',
              fontSize: 14,
            }}>
              <strong style={{ display: 'block', fontFamily: 'EB Garamond, serif' }}>call or text 988</strong>
              <span style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 12 }}>
                suicide & crisis lifeline (US, 24/7)
              </span>
            </a>
            <a
              href="https://www.crisistextline.org/"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', padding: '10px 12px',
                background: 'var(--paper-soft)', borderRadius: 10,
                fontFamily: 'EB Garamond, serif', color: 'var(--ink)', textDecoration: 'none',
                fontSize: 14,
              }}>
              <strong style={{ display: 'block', fontFamily: 'EB Garamond, serif' }}>crisis text line</strong>
              <span style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 12 }}>
                text HOME to 741741
              </span>
            </a>
          </div>
        </ExpandableRow>

        <ExpandableRow title="citations & credits" defaultOpen={false}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            many exercises in this app draw on <strong>positive psychology</strong> coursework, including
            materials associated with <strong>Dr. Pressman</strong> at the
            <strong> University of California, Irvine (UCI)</strong> Positive Psychology class.
            MoodPath is an independent student project and is not an official UCI product.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-faded)', lineHeight: 1.55 }}>
            techniques are inspired by Seligman, Snyder (Hope Theory), King (best possible self),
            Bryant & Veroff (savoring), and the Berkeley Greater Good Science Center (awe).
          </p>
        </ExpandableRow>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0',
          borderTop: '1px dashed var(--line-dashed)',
        }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>about MoodPath</span>
          <span className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)' }}>v0.3</span>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            width: '100%', padding: '12px 0',
            background: 'transparent', border: 'none',
            borderTop: '1px dashed var(--line-dashed)',
            fontFamily: 'Nunito', fontSize: 14, color: '#A33B1F', cursor: 'pointer', textAlign: 'left',
          }}
        >sign out</button>
      </NotebookCard>
    </Page>
  );
}

// Expandable row for inline accordion (Help, Citations)
function ExpandableRow({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useS(defaultOpen);
  return (
    <div style={{ borderBottom: '1px dashed var(--line-dashed)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 0',
          background: 'transparent', border: 'none',
          fontFamily: 'Nunito', fontSize: 14, color: 'var(--ink)',
          cursor: 'pointer', textAlign: 'left',
        }}>
        <span>{title}</span>
        <span style={{ color: 'var(--ink-soft)', fontSize: 18 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '4px 0 14px' }}>{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRENDS card — mood + stress over time + chatbot CTA
// ─────────────────────────────────────────────────────────────
function TrendsCard({ timeline, onNav }) {
  const last7 = useM(() => {
    if (!timeline?.length) return [];
    const sorted = [...timeline].sort((a, b) => (a.date < b.date ? 1 : -1));
    return sorted.slice(0, 7).reverse();
  }, [timeline]);

  const stressAvg = last7.length
    ? last7.reduce((s, r) => s + (r.stress_score || 0), 0) / last7.length
    : 0;
  const moodAvg = last7.length
    ? last7.reduce((s, r) => s + (recordToMood(r) || 3), 0) / last7.length
    : 0;
  const recentStressUp = last7.length >= 4
    ? last7.slice(-3).reduce((s, r) => s + r.stress_score, 0) / 3
        > last7.slice(0, -3).reduce((s, r) => s + r.stress_score, 0) / Math.max(1, last7.length - 3)
    : false;
  const stressy = stressAvg >= 6 || recentStressUp;

  // Sparkline path
  const w = 220, h = 50;
  const sparkPath = useM(() => {
    if (last7.length < 2) return '';
    const stresses = last7.map(r => r.stress_score || 5);
    const stepX = w / (stresses.length - 1);
    return stresses.map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - 1) / 9) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [last7]);

  return (
    <>
      <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8, marginTop: 8 }}>
        your trends
      </div>
      <NotebookCard style={{ marginBottom: 18, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)' }}>last 7 days</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 4 }}>
              <div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>
                  {moodAvg ? moodAvg.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>avg mood</div>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: stressy ? '#A33B1F' : 'var(--ink)' }}>
                  {stressAvg ? stressAvg.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>avg stress</div>
              </div>
            </div>
          </div>
          {sparkPath && (
            <svg width={w} height={h} style={{ overflow: 'visible' }}>
              <path d={sparkPath} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round"/>
              {last7.map((r, i) => {
                const x = (w / (last7.length - 1 || 1)) * i;
                const y = h - (((r.stress_score || 5) - 1) / 9) * h;
                return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--accent-pink)" stroke="var(--ink)" strokeWidth="1"/>;
              })}
            </svg>
          )}
        </div>
        {last7.length === 0 && (
          <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-faded)', fontSize: 13, marginBottom: 8 }}>
            check in a few days to see your trend.
          </div>
        )}
        {stressy && last7.length >= 3 ? (
          <div style={{
            background: 'var(--accent-pink)',
            borderRadius: 10, padding: '10px 12px',
            marginTop: 6,
          }}>
            <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 6 }}>
              stress has been climbing. want to talk it out?
            </div>
            <button
              onClick={() => onNav && onNav({ name: 'chat' })}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >talk it out</button>
          </div>
        ) : (
          <button
            onClick={() => onNav && onNav({ name: 'chat' })}
            style={{
              background: 'var(--accent-mint)',
              border: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
              color: 'var(--ink)', cursor: 'pointer',
              width: '100%', marginTop: 6,
              fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <span>💬</span> chat with a kind companion
          </button>
        )}
      </NotebookCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CHAT SCREEN — full tab page (powered by /chat backend → OpenAI)
// ─────────────────────────────────────────────────────────────
function ChatScreen({ timeline }) {
  const [msgs, setMsgs] = useS(() => [
    { role: 'assistant', content: "hi. i'm here to listen — what's on your mind?" },
  ]);
  const [input, setInput] = useS('');
  const [busy, setBusy] = useS(false);
  const scrollRef = useR(null);

  useE(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg = { role: 'user', content: text };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setBusy(true);
    try {
      const recent = (timeline || []).slice(0, 7).map(r => ({
        date: r.date,
        mood: recordToMood(r),
        stress: r.stress_score,
        energy: r.energy_score,
      }));
      const r = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          recent_days: recent,
        }),
      });
      if (!r.ok) {
        const detail = await r.json().catch(() => ({}));
        const msg = r.status === 503
          ? "AI chat is off — set OPENAI_API_KEY in .env to enable."
          : (detail.detail || "sorry — i'm having trouble right now. try again in a moment.");
        setMsgs(prev => [...prev, { role: 'assistant', content: msg }]);
      } else {
        const data = await r.json();
        setMsgs(prev => [...prev, { role: 'assistant', content: data.reply || '...' }]);
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: "i couldn't reach the server. try again soon." }]);
    } finally { setBusy(false); }
  }

  // Full-screen layout that respects the iOS frame and tab bar at the bottom.
  return (
    <div className="paper-bg" style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 22px 10px' }}>
        <WashiHeader>a quiet chat</WashiHeader>
        <div className="serif" style={{
          marginTop: 14,
          fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 13,
        }}>
          not therapy — just a kind ear. talk about anything.
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto',
        padding: '4px 18px 10px',
        display: 'flex', flexDirection: 'column', gap: 10,
        WebkitOverflowScrolling: 'touch',
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? 'var(--accent-mint-deep)' : 'var(--card-white)',
            borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            padding: '10px 14px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ink)',
            fontFamily: m.role === 'assistant' ? 'EB Garamond, serif' : 'Nunito, sans-serif',
            fontStyle: m.role === 'assistant' ? 'italic' : 'normal',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 1px 2px rgba(74,27,12,0.05)',
          }}>{m.content}</div>
        ))}
        {busy && (
          <div style={{
            alignSelf: 'flex-start',
            fontSize: 12, fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
            color: 'var(--ink-soft)',
            background: 'var(--card-white)',
            borderRadius: '14px 14px 14px 4px',
            padding: '8px 12px',
          }}>thinking…</div>
        )}
      </div>

      {/* Composer — positioned above the floating tab bar */}
      <div style={{
        padding: '10px 18px 0',
        borderTop: '1px dashed var(--line-dashed)',
        background: 'var(--paper)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="say what's on your mind…"
            rows={1}
            style={{
              flex: 1, resize: 'none', minHeight: 38, maxHeight: 120,
              border: '1px dashed var(--line-dashed)',
              borderRadius: 12, padding: '9px 12px',
              fontFamily: 'Nunito, sans-serif', fontSize: 14,
              color: 'var(--ink)', background: 'var(--card-white)',
              outline: 'none',
            }}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="btn btn-primary"
            style={{ padding: '10px 16px', opacity: busy || !input.trim() ? 0.5 : 1 }}>
            send
          </button>
        </div>
        <div style={{
          padding: '8px 0 96px',
          fontSize: 11, color: 'var(--ink-faded)', textAlign: 'center',
          fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
        }}>
          if you're in crisis, please reach 988 or the crisis text line.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ENTRY DETAIL — render past day from real record
// ─────────────────────────────────────────────────────────────
function EntryDetailScreen({ data, onNav }) {
  const rec = data || null;
  const dObj = rec ? parseISO(rec.date) : TODAY;
  const m = recordToMood(rec);
  const lines = useM(() => {
    if (!rec?.journal_text) return [];
    return String(rec.journal_text).split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
  }, [rec]);

  // Try to load any practices saved that day
  const [practices, setPractices] = useS([]);
  useE(() => {
    if (!rec) return;
    apiFetch(`/me/practices?date=${rec.date}`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.practices) setPractices(d.practices);
    });
  }, [rec]);

  return (
    <Page>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
        <BackBtn onClick={() => onNav({ name: 'timeline' })}/>
      </div>
      <WashiHeader>{formatDate(dObj, 'long')}</WashiHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 18 }}>
        <span style={{
          width: 44, height: 44, borderRadius: '50%',
          background: m ? MOOD_COLORS[m] : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(74,27,12,0.08)',
        }}>
          {m && <MoodFace mood={m} size={26}/>}
        </span>
        <div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{m ? MOOD_LABELS[m] : 'no mood saved'}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{formatDate(dObj, 'weekday')} entry</div>
        </div>
      </div>

      {lines.length > 0 && (
        <NotebookCard corner="sparkle" cornerRotation={10} style={{ marginBottom: 18 }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>
            three good things
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.map((g, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'baseline',
                borderBottom: '1px dashed var(--line-dashed)',
                padding: '4px 0',
              }}>
                <span className="serif" style={{ color: 'var(--ink-faded)', fontSize: 14, fontStyle: 'italic' }}>{i + 1}.</span>
                <span style={{ fontSize: 15 }}>{g}</span>
              </div>
            ))}
          </div>
        </NotebookCard>
      )}

      {practices.length > 0 && (
        <>
          <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
            practices that day
          </div>
          {practices.map((p, i) => (
            <NotebookCard key={i} corner={STICKER_BY_ID[p.intervention_type] || 'sun'} cornerRotation={-8} style={{ marginBottom: 12 }}>
              <div className="serif" style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                {String(p.intervention_type).replaceAll('_', ' ')}
              </div>
              {Object.entries(p.responses || {}).slice(0, 3).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                    {k.replaceAll('_', ' ')}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{v}</p>
                </div>
              ))}
              {p.notes && (
                <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 6 }}>
                  notes: <span style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{p.notes}</span>
                </div>
              )}
            </NotebookCard>
          ))}
        </>
      )}

      {lines.length === 0 && practices.length === 0 && (
        <div className="serif" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontStyle: 'italic', padding: 24 }}>
          no notes saved on this day.
        </div>
      )}
    </Page>
  );
}

// ───────────────────────────────────────────────────────────
// LEAF ENVELOPE — one small note per day, found on your path
// ───────────────────────────────────────────────────────────
const LEAF_KEY = 'moodpath_leaf_v1';
const LEAF_NOTES = [
  'one slow breath still counts.',
  "you don't have to solve everything before resting.",
  'name the feeling before trying to fix it.',
  'you did more than you thought.',
  'soft is also a way to keep going.',
  'you are allowed to take up space.',
  'the day does not have to be productive to matter.',
  "it's okay to ask for help.",
  'you can pause without giving up.',
  "you survived yesterday — that's enough.",
  'gentleness is also a kind of strength.',
  'not everything needs an answer today.',
  "you've already done enough for now.",
  'rest is a kind of progress.',
  'you are allowed to feel two things at once.',
  'a quiet day is still a day lived.',
  'some things just take time.',
  "you don't have to earn rest.",
  'being here counts.',
  'small. slow. steady.',
];

function _todayKey() { return new Date().toISOString().slice(0,10); }

function _dailyLeafIdx() {
  const k = _todayKey();
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return Math.abs(h) % LEAF_NOTES.length;
}

function _loadLeaf() {
  try { return JSON.parse(localStorage.getItem(LEAF_KEY) || '{}'); } catch (e) { return {}; }
}
function _saveLeaf(obj) { localStorage.setItem(LEAF_KEY, JSON.stringify(obj)); }

function LeafEnvelope() {
  const k = _todayKey();
  const noteIdx = useM(() => _dailyLeafIdx(), []);
  const note = LEAF_NOTES[noteIdx];
  const [opened, setOpened] = useS(() => !!_loadLeaf()[k]);
  const [animating, setAnimating] = useS(false);

  function open() {
    if (opened) return;
    setAnimating(true);
    setTimeout(() => {
      setOpened(true);
      const obj = _loadLeaf();
      obj[k] = true;
      _saveLeaf(obj);
      setAnimating(false);
    }, 520);
  }

  return (
    <div className="card-mount" style={{ animationDelay: '220ms', marginTop: 4, marginBottom: 22 }}>
      <div className="serif" style={{
        fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faded)',
        letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
      }}>leaf envelope</div>
      <div className="serif" style={{
        fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 12,
      }}>a small note found on your path.</div>

      {!opened ? (
        <button
          onClick={open}
          aria-label="open today's leaf"
          style={{
            position: 'relative',
            width: '100%',
            background: 'transparent',
            border: 'none', cursor: 'pointer',
            padding: '8px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          <svg width="180" height="110" viewBox="0 0 180 110" style={{
            transition: 'transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: animating ? 'rotate(-12deg) translateY(-6px) scale(1.04)' : 'rotate(-4deg)',
            filter: 'drop-shadow(0 2px 6px rgba(74,27,12,0.10))',
          }}>
            {/* leaf body */}
            <path d="M 20 70 C 20 30, 70 12, 160 18 C 158 60, 130 95, 30 92 C 22 88, 20 80, 20 70 Z"
              fill="#B6C9A0" stroke="#4A1B0C" strokeWidth="1.4" strokeLinejoin="round"/>
            {/* center vein */}
            <path d="M 22 78 Q 90 50, 158 22" stroke="#4A1B0C" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.7"/>
            {/* side veins */}
            <path d="M 50 70 Q 60 50, 72 38" stroke="#4A1B0C" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
            <path d="M 80 76 Q 90 55, 105 40" stroke="#4A1B0C" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
            <path d="M 115 80 Q 125 60, 140 44" stroke="#4A1B0C" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
            {/* fold line hint */}
            <path d="M 35 60 Q 90 80, 150 50" stroke="#4A1B0C" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.35" strokeDasharray="2 3"/>
            {/* tiny wax seal */}
            <circle cx="90" cy="66" r="7" fill="#D9B89B" stroke="#4A1B0C" strokeWidth="1"/>
            <path d="M 87 64 Q 90 68, 93 64" stroke="#4A1B0C" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="serif" style={{
            marginTop: 6,
            fontSize: 15, fontStyle: 'italic',
            color: 'var(--ink)',
            borderBottom: '1px dashed var(--ink-faded)',
            paddingBottom: 1,
          }}>open today’s leaf</span>
        </button>
      ) : (
        <div style={{
          position: 'relative',
          background: '#FBF5E7',
          border: '1px solid rgba(74,27,12,0.10)',
          borderRadius: 14,
          padding: '22px 22px 22px 56px',
          boxShadow: '0 1px 0 rgba(74,27,12,0.04)',
          animation: 'cardMount 420ms ease-out',
          minHeight: 88,
          display: 'flex', alignItems: 'center',
        }}>
          {/* leaf tucked at left */}
          <div style={{ position: 'absolute', left: -8, top: -10, transform: 'rotate(-22deg)' }}>
            <svg width="56" height="56" viewBox="0 0 180 110">
              <path d="M 20 70 C 20 30, 70 12, 160 18 C 158 60, 130 95, 30 92 C 22 88, 20 80, 20 70 Z"
                fill="#B6C9A0" stroke="#4A1B0C" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M 22 78 Q 90 50, 158 22" stroke="#4A1B0C" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <p className="serif" style={{
            margin: 0, fontSize: 17, lineHeight: 1.5,
            fontStyle: 'italic', color: 'var(--ink)',
          }}>“{note}”</p>
        </div>
      )}
    </div>
  );
}
// ───────────────────────────────────────────────────────────
const WINS_KEY = 'moodpath_wins_v1';
const WIN_OBJECTS = ['seed', 'acorn', 'pebble', 'leaf', 'flower', 'star'];
const WIN_PRESETS = [
  'got out of bed',
  'ate something',
  'drank water',
  'replied to a message',
  'went outside',
  'rested',
  'asked for help',
  'finished one small thing',
  'survived a hard day',
];
const WIN_AFFIRMATIONS = [
  'that counts.',
  'you did more than you thought.',
  'all of this is real.',
  'gentle work.',
  'every one matters.',
];

function loadWins() {
  try {
    const raw = localStorage.getItem(WINS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {}
  return {};
}
function saveWinsLocal(obj) { localStorage.setItem(WINS_KEY, JSON.stringify(obj)); }

// Tiny SVG forest objects — small enough to scatter inside a basket
function WinObject({ type, size = 22, rotation = 0, style = {} }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', style: { transform: `rotate(${rotation}deg)`, ...style } };
  switch (type) {
    case 'seed':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="4" ry="7" fill="#A8896B" stroke="#4A1B0C" strokeWidth="1.2"/>
          <path d="M 12 6 Q 14 9 12 12" stroke="#4A1B0C" strokeWidth="0.9" fill="none"/>
        </svg>
      );
    case 'acorn':
      return (
        <svg {...common}>
          <path d="M 6 9 Q 12 4 18 9 L 17 12 L 7 12 Z" fill="#8B6B4A" stroke="#4A1B0C" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M 7 12 Q 12 22 17 12 Z" fill="#D4A574" stroke="#4A1B0C" strokeWidth="1.2" strokeLinejoin="round"/>
          <line x1="12" y1="4" x2="12" y2="6" stroke="#4A1B0C" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      );
    case 'pebble':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="13" rx="8" ry="5" fill="#C9C2B4" stroke="#4A1B0C" strokeWidth="1.2"/>
          <ellipse cx="10" cy="11" rx="2" ry="1" fill="#E0DACB"/>
        </svg>
      );
    case 'leaf':
      return <Sticker type="leaf" size={size} rotation={rotation} style={style}/>;
    case 'flower':
      return <Sticker type="flower" size={size} rotation={rotation} style={style}/>;
    case 'star':
      return <Sticker type="star" size={size} rotation={rotation} style={style}/>;
    default:
      return null;
  }
}

// Basket SVG — woven, soft, holds the objects
function Basket({ children, empty, shakeKey }) {
  return (
    <div
      key={shakeKey || 0}
      className={shakeKey ? 'basket-shake' : ''}
      style={{ position: 'relative', width: '100%', height: 180, transformOrigin: '50% 60%' }}>
      <svg viewBox="0 0 300 180" width="100%" height="180" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="weave" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(0)">
            <path d="M 0 5 Q 2.5 2 5 5 Q 7.5 8 10 5" stroke="#9C7A55" strokeWidth="1" fill="none" opacity="0.55"/>
            <path d="M 0 10 Q 2.5 7 5 10 Q 7.5 13 10 10" stroke="#9C7A55" strokeWidth="1" fill="none" opacity="0.55"/>
          </pattern>
        </defs>
        {/* basket body — trapezoid */}
        <path d="M 30 60 L 270 60 L 250 165 L 50 165 Z" fill="#D9C2A0" stroke="#4A1B0C" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M 30 60 L 270 60 L 250 165 L 50 165 Z" fill="url(#weave)"/>
        {/* rim ellipse */}
        <ellipse cx="150" cy="60" rx="120" ry="10" fill="#C9A87C" stroke="#4A1B0C" strokeWidth="1.4"/>
        <ellipse cx="150" cy="58" rx="116" ry="7" fill="#7A5A3A" opacity="0.4"/>
        {/* handle hint on top */}
        <path d="M 80 58 Q 150 40 220 58" stroke="#9C7A55" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      </svg>
      {/* objects layer */}
      <div style={{
        position: 'absolute', left: 50, right: 50, top: 70, bottom: 20,
        display: 'flex', flexWrap: 'wrap', alignContent: 'flex-end', justifyContent: 'center',
        gap: 4,
      }}>
        {empty ? (
          <div className="serif" style={{
            alignSelf: 'center',
            fontStyle: 'italic', color: 'rgba(74,27,12,0.55)',
            fontSize: 14, textAlign: 'center', paddingBottom: 24,
          }}>
            anything counts.<br/>even getting out of bed.
          </div>
        ) : children}
      </div>
    </div>
  );
}

function SmallWinsBasket({ stickerDensity }) {
  const [allWins, setAllWins] = useS(loadWins);
  const [showSheet, setShowSheet] = useS(false);
  const [customText, setCustomText] = useS('');
  const [affirmIdx] = useS(() => Math.floor(Math.random() * WIN_AFFIRMATIONS.length));
  const [shakeKey, setShakeKey] = useS(0);
  const mountTimeRef = window.React.useRef(Date.now());

  const todayKey = new Date().toISOString().slice(0,10);
  const todayWins = allWins[todayKey] || [];

  function persist(next) { setAllWins(next); saveWinsLocal(next); }

  function addWins(texts) {
    const arr = Array.isArray(texts) ? texts : [texts];
    let next = todayWins.slice();
    for (const text of arr) {
      if (!text || !text.trim()) continue;
      const type = WIN_OBJECTS[next.length % WIN_OBJECTS.length];
      next.push({ id: Date.now() + Math.random(), text: text.trim(), type, addedAt: Date.now() });
    }
    persist({ ...allWins, [todayKey]: next });
    setCustomText('');
    // Shake the basket — staggered to roughly when the first item lands
    setTimeout(() => setShakeKey(k => k + 1), 580);
  }

  function addWin(text) { addWins([text]); }

  function removeWin(id) {
    persist({ ...allWins, [todayKey]: todayWins.filter(w => w.id !== id) });
  }

  // scatter rotations — stable per win id
  function rotFor(id) { return ((id * 73) % 40) - 20; }

  return (
    <div className="card-mount" style={{ animationDelay: '180ms', marginTop: 28, marginBottom: 22 }}>
      <div className="serif" style={{
        fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faded)',
        letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>small wins basket</span>
      </div>
      <div className="serif" style={{
        fontSize: 17, fontWeight: 500, color: 'var(--ink)', marginBottom: 14,
      }}>
        what did you already do today?
      </div>

      <Basket empty={todayWins.length === 0} shakeKey={shakeKey}>
        {todayWins.map((w, i) => {
          const isNew = w.addedAt && (w.addedAt > mountTimeRef.current) && (Date.now() - w.addedAt < 2000);
          const recentNewer = todayWins.filter(x => x.addedAt && x.addedAt > mountTimeRef.current && Date.now() - x.addedAt < 2000);
          const newIdx = recentNewer.findIndex(x => x.id === w.id);
          const rotStart = ((w.id * 17) % 80) - 40;
          const rotEnd = rotFor(w.id);
          return (
            <button
              key={w.id}
              onClick={() => removeWin(w.id)}
              title={w.text + ' — tap to remove'}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 0, margin: 0,
                '--drop-rot-start': rotStart + 'deg',
                '--drop-rot-end': rotEnd + 'deg',
                animation: isNew
                  ? `winDrop 720ms cubic-bezier(.4,1.4,.55,1) ${newIdx * 110}ms backwards`
                  : 'cardMount 360ms ease-out backwards',
              }}
            >
              <WinObject type={w.type} size={26} rotation={rotEnd}/>
            </button>
          );
        })}
      </Basket>

      {/* Status line */}
      <div className="serif" style={{
        textAlign: 'center', marginTop: 8, marginBottom: 14,
        fontSize: 14, color: 'var(--ink-soft)', fontStyle: 'italic',
      }}>
        {todayWins.length === 0
          ? <>add a small win below.</>
          : <>you collected <b style={{ fontStyle: 'normal', fontWeight: 600, color: 'var(--ink)' }}>{todayWins.length}</b> small win{todayWins.length === 1 ? '' : 's'} today. {WIN_AFFIRMATIONS[affirmIdx]}</>
        }
      </div>

      {/* List of wins (text) */}
      {todayWins.length > 0 && (
        <NotebookCard style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayWins.map(w => (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px dashed var(--line-dashed)', paddingBottom: 8,
              }}>
                <WinObject type={w.type} size={20}/>
                <span style={{ flex: 1, fontSize: 14 }}>{w.text}</span>
                <button
                  onClick={() => removeWin(w.id)}
                  aria-label="remove"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-faded)', fontSize: 14, padding: 4,
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </NotebookCard>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowSheet(true)}
        style={{
          width: '100%',
          background: 'var(--accent-mint)',
          border: '1px dashed rgba(74,27,12,0.18)',
          borderRadius: 14,
          padding: '14px 18px',
          cursor: 'pointer',
          fontFamily: 'EB Garamond, serif',
          fontStyle: 'italic',
          fontSize: 16,
          color: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        add a small win
      </button>

      {showSheet && (
        <WinPickerSheet
          presets={WIN_PRESETS.filter(p => !todayWins.some(w => w.text.toLowerCase() === p.toLowerCase()))}
          customText={customText}
          setCustomText={setCustomText}
          onAdd={(items) => { addWins(items); setShowSheet(false); }}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  );
}

function WinPickerSheet({ presets, customText, setCustomText, onAdd, onClose }) {
  const [selected, setSelected] = useS(new Set());
  function toggle(p) {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(p)) n.delete(p); else n.add(p);
      return n;
    });
  }
  function commit() {
    const items = Array.from(selected);
    if (customText.trim()) items.push(customText.trim());
    if (items.length === 0) return;
    onAdd(items);
  }
  const total = selected.size + (customText.trim() ? 1 : 0);
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(74,27,12,0.18)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeUp 220ms ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--paper)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: '20px 22px 28px',
          maxHeight: '78%',
          overflowY: 'auto',
          boxShadow: '0 -10px 30px rgba(74,27,12,0.18)',
          animation: 'pageEnter 260ms ease-out',
        }}
      >
        <div style={{ width: 40, height: 4, background: 'rgba(74,27,12,0.18)', borderRadius: 2, margin: '0 auto 16px' }}/>
        <div className="serif" style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>
          add a small win
        </div>
        <div className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 18 }}>
          anything counts. especially on hard days.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {presets.map(p => {
            const on = selected.has(p);
            return (
              <button
                key={p}
                onClick={() => toggle(p)}
                style={{
                  background: on ? 'var(--sage)' : 'var(--card-white)',
                  border: on ? '1px solid var(--sage-deep)' : '1px solid rgba(74,27,12,0.10)',
                  borderRadius: 999,
                  padding: '8px 14px 8px 10px',
                  cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: 13,
                  color: 'var(--ink)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'background 140ms',
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: 4,
                  border: '1.2px solid var(--sage-deep)',
                  background: on ? 'var(--sage-deep)' : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FCFAEF', fontSize: 11, lineHeight: 1,
                }}>{on ? '✓' : ''}</span>
                {p}
              </button>
            );
          })}
        </div>

        <div className="serif" style={{
          fontStyle: 'italic', fontSize: 12,
          color: 'var(--ink-faded)', letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 6,
        }}>or write your own</div>

        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          placeholder="something small you did today…"
          className="dashed-line"
          style={{ fontSize: 16, marginBottom: 18 }}
          autoFocus
        />

        <button
          className="btn btn-primary"
          onClick={commit}
          disabled={total === 0}
          style={{ width: '100%', opacity: total > 0 ? 1 : 0.5 }}
        >
          {total === 0 ? 'add to basket' : `add ${total} to basket`}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 8,
            background: 'transparent', border: 'none',
            color: 'var(--ink-soft)', fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer', padding: '8px',
          }}
        >never mind</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TREE HOLE — whisper, keep / let go / reframe
// ─────────────────────────────────────────────────────────────
function TreeHoleScreen({ onNav }) {
  const [text, setText] = useS('');
  const [released, setReleased] = useS([]);
  const [toast, setToast] = useS(null);
  const [kept, setKept] = useS(() => {
    try { return JSON.parse(localStorage.getItem('moodpath_treehole_keep') || '[]'); } catch (e) { return []; }
  });

  function logTo(key, item) {
    try {
      const log = JSON.parse(localStorage.getItem(key) || '[]');
      log.push(item);
      localStorage.setItem(key, JSON.stringify(log));
    } catch (e) {}
  }
  function reloadKept() {
    try { setKept(JSON.parse(localStorage.getItem('moodpath_treehole_keep') || '[]')); } catch (e) {}
  }
  function handleLetGo() {
    const t = text.trim(); if (!t) return;
    const id = Date.now() + Math.random();
    setReleased(r => [...r, { id, text: t }]);
    logTo('moodpath_treehole_letgo', { text: t, at: Date.now() });
    setText('');
    setTimeout(() => setReleased(r => r.filter(x => x.id !== id)), 3600);
  }
  function handleKeep() {
    const t = text.trim(); if (!t) return;
    logTo('moodpath_treehole_keep', { text: t, at: Date.now() });
    setText('');
    setToast('kept in your notebook.');
    reloadKept();
    setTimeout(() => setToast(null), 1800);
  }
  function releaseKept(at) {
    // move from keep -> letgo log, animate it drifting away
    try {
      const keepLog = JSON.parse(localStorage.getItem('moodpath_treehole_keep') || '[]');
      const item = keepLog.find(x => x.at === at);
      if (!item) return;
      const remaining = keepLog.filter(x => x.at !== at);
      localStorage.setItem('moodpath_treehole_keep', JSON.stringify(remaining));
      logTo('moodpath_treehole_letgo', { text: item.text, at: Date.now() });
      const id = Date.now() + Math.random();
      setReleased(r => [...r, { id, text: item.text }]);
      setTimeout(() => setReleased(r => r.filter(x => x.id !== id)), 3600);
      setKept(remaining);
    } catch (e) {}
  }
  function handleReframe() {
    const t = text.trim(); if (!t) return;
    onNav({ name: 'practiceDetail', id: 'cognitive_reframing', prefill: t });
  }

  const canAct = text.trim().length > 0;

  return (
    <div className="paper-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="scroll-area page-enter" style={{
        paddingTop: 56, paddingLeft: 22, paddingRight: 22, paddingBottom: 240,
      }}>
        <WashiHeader>tree hole</WashiHeader>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 500, color: 'var(--ink)' }}>
            whisper anything.
          </h1>
          <Sticker type="leaf" size={36} rotation={-12}/>
        </div>
        <p className="serif" style={{
          margin: 0, marginBottom: 18,
          fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)',
          lineHeight: 1.5,
        }}>
          a quiet place to set something down. nothing here is shared. keep it, let it go, or reframe it.
        </p>

        <div style={{
          position: 'relative',
          width: '100%',
          height: 280,
          marginBottom: 14,
        }}>
          <svg viewBox="0 0 320 280" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 14 }}>
            <defs>
              <radialGradient id="holeGrad" cx="48%" cy="46%" r="60%">
                <stop offset="0%" stopColor="#05100a"/>
                <stop offset="45%" stopColor="#0e1a12"/>
                <stop offset="85%" stopColor="#1e2c22"/>
                <stop offset="100%" stopColor="#2a3a2e"/>
              </radialGradient>
              <linearGradient id="leafLight" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#B6D4A2"/>
                <stop offset="100%" stopColor="#7AAB7C"/>
              </linearGradient>
              <linearGradient id="leafMid" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#7DAE7F"/>
                <stop offset="100%" stopColor="#4A7752"/>
              </linearGradient>
              <linearGradient id="leafDark" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#52805A"/>
                <stop offset="100%" stopColor="#2D4F36"/>
              </linearGradient>
              <filter id="holeBlur" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2"/>
              </filter>
            </defs>
            {/* Dark backdrop */}
            <rect x="0" y="0" width="320" height="280" fill="#2D4F36"/>
            {/* Far background — dense small shapes */}
            {Array.from({length: 50}).map((_, i) => {
              const x = ((i * 53) % 320) + Math.sin(i) * 8;
              const y = ((i * 37) % 280) + Math.cos(i) * 6;
              const r = 8 + (i % 5) * 3;
              return <ellipse key={'b'+i} cx={x} cy={y} rx={r} ry={r*0.7} fill="#2D4F36" opacity={0.6 + (i % 3) * 0.1}/>;
            })}

            {/* HOLE — irregular organic blob, slightly blurred edge */}
            <path d="M 160 42
                     C 110 44, 76 70, 70 110
                     C 60 145, 68 185, 92 215
                     C 118 240, 165 246, 200 232
                     C 235 218, 252 188, 250 150
                     C 252 110, 232 72, 200 56
                     C 188 48, 174 42, 160 42 Z"
                  fill="url(#holeGrad)" filter="url(#holeBlur)"/>

            {/* Mid layer leaves — pointed leaf shapes draped around the hole */}
            <g>
              {/* TOP cluster */}
              {/* Leaf with vein — pointed almond shape */}
              <g transform="translate(50 25) rotate(-15)">
                <path d="M 0 0 Q 18 -18 40 -8 Q 45 12 28 22 Q 8 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 22 6 38 -2" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(85 8) rotate(25)">
                <path d="M 0 0 Q 22 -16 42 -2 Q 44 18 24 24 Q 6 22 0 0 Z" fill="url(#leafLight)"/>
                <path d="M 4 4 Q 24 8 38 0" stroke="#4A7752" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(135 4) rotate(-10)">
                <path d="M 0 0 Q 20 -20 44 -8 Q 48 14 26 24 Q 4 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 26 6 42 -2" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(180 6) rotate(20)">
                <path d="M 0 0 Q 18 -18 42 -6 Q 46 16 24 24 Q 4 22 0 0 Z" fill="url(#leafLight)"/>
                <path d="M 4 4 Q 24 6 40 -2" stroke="#4A7752" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(228 12) rotate(-22)">
                <path d="M 0 0 Q 20 -18 44 -8 Q 48 14 26 24 Q 4 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 26 6 42 -2" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(265 32) rotate(35)">
                <path d="M 0 0 Q 18 -16 38 -4 Q 42 16 22 22 Q 4 20 0 0 Z" fill="url(#leafDark)"/>
                <path d="M 4 4 Q 22 6 36 0" stroke="#234029" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>

              {/* LEFT side — fern-like fronds */}
              <g transform="translate(14 70) rotate(-50)">
                <path d="M 0 0 Q 24 -16 48 -4 Q 52 18 28 26 Q 4 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 26 8 44 -2" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(8 120) rotate(-65)">
                <path d="M 0 0 Q 26 -16 50 -2 Q 54 22 28 28 Q 4 24 0 0 Z" fill="url(#leafDark)"/>
                <path d="M 4 4 Q 26 8 46 0" stroke="#234029" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(6 170) rotate(-80)">
                <path d="M 0 0 Q 24 -16 50 -4 Q 54 20 30 26 Q 6 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 26 8 46 -2" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(12 220) rotate(-95)">
                <path d="M 0 0 Q 22 -14 46 -2 Q 50 20 26 26 Q 6 22 0 0 Z" fill="url(#leafLight)"/>
                <path d="M 4 4 Q 24 8 42 0" stroke="#4A7752" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>

              {/* RIGHT side */}
              <g transform="translate(306 70) rotate(228)">
                <path d="M 0 0 Q 22 -16 46 -4 Q 50 18 28 24 Q 6 22 0 0 Z" fill="url(#leafLight)"/>
                <path d="M 4 4 Q 24 8 42 -2" stroke="#4A7752" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(312 120) rotate(245)">
                <path d="M 0 0 Q 24 -16 50 -2 Q 54 22 28 28 Q 4 24 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 26 8 46 0" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(314 170) rotate(260)">
                <path d="M 0 0 Q 24 -16 50 -4 Q 54 20 30 26 Q 6 22 0 0 Z" fill="url(#leafDark)"/>
                <path d="M 4 4 Q 26 8 46 -2" stroke="#234029" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(310 220) rotate(275)">
                <path d="M 0 0 Q 22 -14 46 -2 Q 50 20 26 26 Q 6 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 24 8 42 0" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>

              {/* BOTTOM — undergrowth, ferns spreading inward */}
              <g transform="translate(36 270) rotate(-115)">
                <path d="M 0 0 Q 24 -16 50 -4 Q 54 20 30 26 Q 6 22 0 0 Z" fill="url(#leafDark)"/>
                <path d="M 4 4 Q 26 8 46 -2" stroke="#234029" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(80 274) rotate(-130)">
                <path d="M 0 0 Q 24 -16 50 -4 Q 54 22 28 28 Q 4 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 26 8 46 -2" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(130 280) rotate(-150)">
                <path d="M 0 0 Q 22 -14 46 -2 Q 50 20 26 26 Q 6 22 0 0 Z" fill="url(#leafLight)"/>
                <path d="M 4 4 Q 24 8 42 0" stroke="#4A7752" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(186 282) rotate(-170)">
                <path d="M 0 0 Q 22 -14 46 -2 Q 50 20 26 26 Q 6 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 24 8 42 0" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(240 278) rotate(165)">
                <path d="M 0 0 Q 24 -16 50 -4 Q 54 22 28 28 Q 4 22 0 0 Z" fill="url(#leafDark)"/>
                <path d="M 4 4 Q 26 8 46 -2" stroke="#234029" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>
              <g transform="translate(286 268) rotate(145)">
                <path d="M 0 0 Q 22 -14 46 -2 Q 50 20 26 26 Q 6 22 0 0 Z" fill="url(#leafMid)"/>
                <path d="M 4 4 Q 24 8 42 0" stroke="#3a5e42" strokeWidth="0.8" fill="none" opacity="0.6"/>
              </g>

              {/* Inner ring — small leaves hugging the hole edge */}
              <g transform="translate(118 56) rotate(-30)">
                <path d="M 0 0 Q 12 -10 26 -2 Q 28 10 14 14 Q 2 12 0 0 Z" fill="url(#leafLight)"/>
              </g>
              <g transform="translate(162 42) rotate(8)">
                <path d="M 0 0 Q 14 -12 28 -2 Q 30 12 14 16 Q 2 14 0 0 Z" fill="url(#leafMid)"/>
              </g>
              <g transform="translate(204 50) rotate(28)">
                <path d="M 0 0 Q 14 -12 28 -2 Q 30 12 14 16 Q 2 14 0 0 Z" fill="url(#leafLight)"/>
              </g>
              <g transform="translate(56 132) rotate(-72)">
                <path d="M 0 0 Q 12 -10 24 -2 Q 26 12 12 14 Q 2 12 0 0 Z" fill="url(#leafMid)"/>
              </g>
              <g transform="translate(58 190) rotate(-100)">
                <path d="M 0 0 Q 12 -10 24 -2 Q 26 12 12 14 Q 2 12 0 0 Z" fill="url(#leafLight)"/>
              </g>
              <g transform="translate(264 138) rotate(252)">
                <path d="M 0 0 Q 12 -10 24 -2 Q 26 12 12 14 Q 2 12 0 0 Z" fill="url(#leafMid)"/>
              </g>
              <g transform="translate(262 196) rotate(282)">
                <path d="M 0 0 Q 12 -10 24 -2 Q 26 12 12 14 Q 2 12 0 0 Z" fill="url(#leafLight)"/>
              </g>
              <g transform="translate(120 234) rotate(-160)">
                <path d="M 0 0 Q 12 -10 24 -2 Q 26 12 12 14 Q 2 12 0 0 Z" fill="url(#leafMid)"/>
              </g>
              <g transform="translate(200 238) rotate(160)">
                <path d="M 0 0 Q 12 -10 24 -2 Q 26 12 12 14 Q 2 12 0 0 Z" fill="url(#leafLight)"/>
              </g>
            </g>

            {/* Hanging vines */}
            <g stroke="#3a5e42" strokeWidth="1" fill="none" opacity="0.7">
              <path d="M 110 22 Q 108 50 116 78"/>
              <path d="M 196 14 Q 198 42 192 70"/>
            </g>
            <ellipse cx="116" cy="80" rx="2.5" ry="5" fill="#B6D4A2" transform="rotate(10 116 80)"/>
            <ellipse cx="192" cy="72" rx="2.5" ry="5" fill="#B6D4A2" transform="rotate(-8 192 72)"/>

            {/* Specks of light / dust */}
            <circle cx="148" cy="98" r="1" fill="#fff" opacity="0.4"/>
            <circle cx="190" cy="124" r="0.8" fill="#fff" opacity="0.3"/>
            <circle cx="172" cy="178" r="0.9" fill="#fff" opacity="0.35"/>
          </svg>
          {/* Textarea positioned over the hole */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="whisper into the hole…"
            style={{
              position: 'absolute',
              top: '24%', left: '24%', width: '52%', height: '56%',
              background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'EB Garamond, serif', fontStyle: 'italic',
              fontSize: 15, lineHeight: '22px',
              color: '#e8dfc8',
              textAlign: 'center',
              caretColor: '#e8dfc8',
              padding: 0,
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <button onClick={handleKeep} disabled={!canAct}
            style={{
              border: '1px solid rgba(74,27,12,0.12)', background: 'var(--card-white)',
              borderRadius: 14, padding: '14px 8px', cursor: canAct ? 'pointer' : 'not-allowed',
              opacity: canAct ? 1 : 0.5,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'Nunito, sans-serif', fontSize: 13, color: 'var(--ink)',
            }}>
            <Sticker type="heart" size={24} rotation={0}/>
            <span>keep</span>
            <span className="serif" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--ink-soft)' }}>save it</span>
          </button>
          <button onClick={handleLetGo} disabled={!canAct}
            style={{
              border: '1px solid rgba(74,27,12,0.12)', background: 'var(--sage-soft, #E1EBD2)',
              borderRadius: 14, padding: '14px 8px', cursor: canAct ? 'pointer' : 'not-allowed',
              opacity: canAct ? 1 : 0.5,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'Nunito, sans-serif', fontSize: 13, color: 'var(--ink)',
            }}>
            <Sticker type="leaf" size={24} rotation={-20}/>
            <span>let go</span>
            <span className="serif" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--ink-soft)' }}>release</span>
          </button>
          <button onClick={handleReframe} disabled={!canAct}
            style={{
              border: '1px solid rgba(74,27,12,0.12)', background: 'var(--accent-mint, #E1F5EE)',
              borderRadius: 14, padding: '14px 8px', cursor: canAct ? 'pointer' : 'not-allowed',
              opacity: canAct ? 1 : 0.5,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'Nunito, sans-serif', fontSize: 13, color: 'var(--ink)',
            }}>
            <Sticker type="sparkle" size={24} rotation={8}/>
            <span>reframe</span>
            <span className="serif" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--ink-soft)' }}>look again</span>
          </button>
        </div>

        {kept.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 className="serif" style={{ margin: 0, fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
                in your notebook
              </h2>
              <span className="serif" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--ink-faded)' }}>
                {kept.length} {kept.length === 1 ? 'paper' : 'papers'} kept
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...kept].reverse().slice(0, 6).map((item, i) => {
                const rot = (i % 2 === 0 ? -1 : 1) * (0.4 + (i % 3) * 0.6);
                const dateStr = (() => {
                  try {
                    const d = new Date(item.at);
                    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
                    return months[d.getMonth()] + ' ' + d.getDate();
                  } catch (e) { return ''; }
                })();
                return (
                  <div key={item.at} style={{
                    position: 'relative',
                    background: 'var(--card-white, #FCFAEF)',
                    border: '1px solid rgba(74,27,12,0.10)',
                    borderRadius: 6,
                    padding: '14px 16px 12px',
                    transform: `rotate(${rot}deg)`,
                    boxShadow: '0 1px 0 rgba(74,27,12,0.05), 0 2px 8px rgba(74,27,12,0.06)',
                    animation: `paperIn 360ms ease-out ${i * 40}ms both`,
                  }}>
                    {/* tape */}
                    <div style={{
                      position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
                      width: 44, height: 14,
                      background: 'rgba(225,235,210,0.7)',
                      borderLeft: '1px dashed rgba(74,27,12,0.08)',
                      borderRight: '1px dashed rgba(74,27,12,0.08)',
                    }}></div>
                    <p className="serif" style={{
                      margin: 0, marginBottom: 8,
                      fontSize: 14, lineHeight: 1.5,
                      color: 'var(--ink)',
                      fontStyle: 'italic',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>{item.text}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span className="serif" style={{ fontSize: 11, color: 'var(--ink-faded)' }}>
                        kept {dateStr}
                      </span>
                      <button onClick={() => releaseKept(item.at)} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontFamily: 'EB Garamond, serif', fontSize: 12, fontStyle: 'italic',
                        color: 'var(--ink-soft)', padding: '4px 6px', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <Sticker type="leaf" size={14} rotation={-20}/>
                        let go
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {kept.length > 6 && (
              <div className="serif" style={{ textAlign: 'center', marginTop: 14, fontSize: 12, fontStyle: 'italic', color: 'var(--ink-faded)' }}>
                {kept.length - 6} more papers tucked away.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {released.map((r, i) => (
          <div key={r.id} style={{
            position: 'absolute', top: 280,
            left: `${20 + (i * 23) % 60}%`,
            animation: 'leafDrift 3500ms ease-in forwards',
            maxWidth: 220,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sticker type="leaf" size={28} rotation={-20}/>
              <span className="serif" style={{
                fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)',
                background: 'rgba(252,250,239,0.85)', padding: '4px 8px', borderRadius: 8,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 180,
              }}>{r.text}</span>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 100, transform: 'translateX(-50%)',
          background: 'var(--ink)', color: 'var(--paper)',
          borderRadius: 999, padding: '10px 18px',
          fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 14,
          animation: 'fadeUp 220ms ease-out',
          boxShadow: '0 4px 16px rgba(74,27,12,0.18)',
        }}>{toast}</div>
      )}

      <style>{`
        @keyframes leafDrift {
          0%   { opacity: 0; transform: translateY(0) translateX(0) rotate(0deg); }
          15%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(360px) translateX(40px) rotate(80deg); }
        }
        @keyframes paperIn {
          from { opacity: 0; transform: translateY(8px) rotate(var(--r, 0deg)); }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, {
  TodayScreen, TimelineScreen, PracticesScreen,
  PracticeDetailScreen, PracticeDoneScreen, MeScreen, EntryDetailScreen,
  ChatScreen, SmallWinsBasket, LeafEnvelope, TreeHoleScreen,
  TODAY,
});
