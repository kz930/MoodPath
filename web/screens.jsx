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
          how's today?
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
          three good things
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

      {/* Daily practice chip — shows AI recommendation when mood is saved */}
      {tweaks.showDailyChip && featured && dailyPracticeShown && (
        <button
          className="card-mount"
          onClick={() => onNav({ name: 'practiceDetail', id: featured.id })}
          style={{
            animationDelay: '180ms',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            background: 'var(--accent-mint)',
            border: 'none',
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            cursor: 'pointer',
            marginBottom: 18,
            color: 'var(--ink)',
            gap: 4,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%',
            fontFamily: 'EB Garamond, serif', fontSize: 15, fontStyle: 'italic',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sticker type={STICKER_BY_ID[featured.id] || 'sun'} size={22} rotation={-6}/>
              {recommendation?.id === featured.id ? "today's pick — " : "today's practice — "}
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
      )}

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
        <span>your habits</span>
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
            no habits yet — tap "+ add" to start a small daily.
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
      <WashiHeader>your timeline</WashiHeader>

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 22 }}>
        {cells.map(c => {
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

  // Build category groups with the catalog records
  const byId = useM(() => Object.fromEntries((catalog || []).map(p => [p.id, p])), [catalog]);
  const wellnessItems = useM(() =>
    MENTAL_WELLNESS_IDS.map(id => byId[id]).filter(Boolean),
  [byId]);
  const groups = useM(() => {
    if (!catalog?.length) return [];
    return PRACTICE_GROUPS.map(g => ({
      ...g,
      items: g.ids.map(id => byId[id]).filter(Boolean),
    })).filter(g => g.items.length > 0);
  }, [catalog, byId]);

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
              {g.desc && <span style={{ color: 'var(--ink-faded)' }}> · {g.desc}</span>}
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
  useE(() => {
    const t = setTimeout(() => onNav({ name: 'today' }), 4500);
    return () => clearTimeout(t);
  }, []);
  const stickerType = STICKER_BY_ID[practice?.id] || 'sparkle';
  return (
    <div className="paper-bg" style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ position: 'absolute', top: 80, left: 30, opacity: 0.55 }}>
        <Sticker type="leaf" size={32} rotation={-20}/>
      </div>
      <div style={{ position: 'absolute', top: 140, right: 36, opacity: 0.55 }}>
        <Sticker type="sparkle" size={28} rotation={12}/>
      </div>
      <div style={{ position: 'absolute', bottom: 180, left: 50, opacity: 0.55 }}>
        <Sticker type="flower" size={36} rotation={6}/>
      </div>

      <div className="sticker-peel" style={{ marginBottom: 30 }}>
        <Sticker type={stickerType} size={120} rotation={-6}/>
      </div>

      <h1 className="serif fade-up" style={{
        margin: 0, fontSize: 32, fontWeight: 500, color: 'var(--ink)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        saved <span style={{ color: 'var(--accent-amber)' }}>✦</span>
      </h1>

      <p className="serif fade-up" style={{
        marginTop: 14, fontSize: 17, fontStyle: 'italic', color: 'var(--ink-soft)',
        textAlign: 'center', maxWidth: 280,
        animationDelay: '500ms',
      }}>
        you showed up today.
      </p>

      <button
        className="btn btn-primary fade-up"
        style={{ marginTop: 36, animationDelay: '700ms' }}
        onClick={() => onNav({ name: 'today' })}
      >
        back to today
      </button>
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

      {/* Trends section */}
      <TrendsCard timeline={timeline} onNav={onNav} />

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

Object.assign(window, {
  TodayScreen, TimelineScreen, PracticesScreen,
  PracticeDetailScreen, PracticeDoneScreen, MeScreen, EntryDetailScreen,
  ChatScreen,
  TODAY,
});
