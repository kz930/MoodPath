// ─────────────────────────────────────────────────────────────
// WEEKLY REPORT — notebook-spread style report
// Reads from: timeline prop, WINS_KEY, treehole logs
// Falls back to a curated sample week if no real data found
// ─────────────────────────────────────────────────────────────

const { useState, useMemo, useEffect } = React;

// Words to exclude from the "what kept coming up" cloud
const _STOP_WORDS = new Set((
  'a an the and or but if so as at by for in is it of on to was were be been being am are i me my mine you your we our us they them their this that these those with from into onto out off over under up down here there now then ' +
  'just really quite very some any all really kinda sorta like got get had have has do did does done feel feel felt feeling went was been being more less than not no yes maybe yeah okay ok also too still then ' +
  'today yesterday tomorrow day days week weeks today\'s ' +
  'one two three four five six seven eight nine ten ' +
  'thing things stuff way ways something nothing everything anything someone'
).split(/\s+/));

function _wkRange(now) {
  // Return [startOfWeek, endOfWeek] as Date objects spanning 7 days.
  // Week ends today, includes the previous 6 days.
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return [start, end];
}

function _toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _shortMonth(d) {
  return MONTH_NAMES[d.getMonth()].toLowerCase().slice(0, 3);
}

// Pull a flat list of all logs from a localStorage array key,
// filtered to a date window.
function _logsInRange(key, startMs, endMs) {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    return arr.filter(x => x && typeof x.at === 'number' && x.at >= startMs && x.at <= endMs);
  } catch (e) { return []; }
}

// ─────────────────────────────────────────────────────────────
// MOOD LINE — hand-drawn-feeling chart on notebook lines
// ─────────────────────────────────────────────────────────────
function MoodLine({ days }) {
  // days: array of 7 objects { iso, dObj, mood (1..5 or null), label }
  const W = 280, H = 130;
  const padL = 28, padR = 10, padT = 14, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = innerW / 6;
  const yFor = m => padT + innerH - ((m - 1) / 4) * innerH;
  const xFor = i => padL + i * stepX;

  const points = days.map((d, i) => ({
    x: xFor(i),
    y: d.mood ? yFor(d.mood) : null,
    mood: d.mood,
    label: d.label,
  }));

  // Build smoothed path through non-null points using cardinal-ish control
  const pts = points.filter(p => p.y != null);
  let path = '';
  if (pts.length >= 2) {
    path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a.x + b.x) / 2;
      path += ` Q ${mx} ${a.y}, ${mx} ${(a.y + b.y) / 2} T ${b.x} ${b.y}`;
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Ruled notebook lines */}
      {[1, 2, 3, 4, 5].map(m => (
        <line key={m}
          x1={padL} x2={W - padR}
          y1={yFor(m)} y2={yFor(m)}
          stroke="rgba(74,27,12,0.08)" strokeWidth="0.6"
          strokeDasharray={m === 3 ? '0' : '2 3'}
        />
      ))}
      {/* y axis labels */}
      {[
        { m: 5, t: 'great' }, { m: 3, t: 'okay' }, { m: 1, t: 'rough' },
      ].map(({ m, t }) => (
        <text key={t}
          x={padL - 4} y={yFor(m) + 3}
          fontSize="8.5" textAnchor="end"
          fill="var(--ink-faded)"
          fontFamily="EB Garamond, serif" fontStyle="italic">
          {t}
        </text>
      ))}
      {/* x labels */}
      {days.map((d, i) => (
        <text key={i}
          x={xFor(i)} y={H - 8}
          fontSize="9.5" textAnchor="middle"
          fill="var(--ink-soft)"
          fontFamily="EB Garamond, serif" fontStyle="italic">
          {d.label}
        </text>
      ))}
      {/* line */}
      {path && (
        <path d={path}
          stroke="#4A1B0C" strokeWidth="1.4" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          opacity="0.7"
        />
      )}
      {/* dots */}
      {points.map((p, i) => p.y == null ? (
        <circle key={i} cx={p.x} cy={padT + innerH - innerH / 2} r="2"
          fill="none" stroke="var(--ink-faded)" strokeWidth="0.8" strokeDasharray="1 1.5"/>
      ) : (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6"
            fill={`var(--mood-${p.mood})`}
            stroke="#4A1B0C" strokeWidth="1.2"/>
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT TILE — small stacked stat with sticker + number + caption
// ─────────────────────────────────────────────────────────────
function StatTile({ value, label, sticker, rotation = -6, bg }) {
  return (
    <div style={{
      position: 'relative',
      background: bg || 'var(--card-white)',
      border: '1px solid rgba(74,27,12,0.1)',
      borderRadius: 12,
      padding: '16px 10px 12px',
      textAlign: 'center',
      overflow: 'visible',
    }}>
      <div style={{ position: 'absolute', top: -12, right: -6 }}>
        <Sticker type={sticker} size={28} rotation={rotation}/>
      </div>
      <div className="serif" style={{
        fontSize: 30, fontWeight: 500, color: 'var(--ink)', lineHeight: 1,
      }}>{value}</div>
      <div className="serif" style={{
        marginTop: 6, fontSize: 11, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.3,
      }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FEELING CHIP — repeated word from journals
// ─────────────────────────────────────────────────────────────
function FeelingChip({ word, weight = 1, rotation = 0 }) {
  // weight: 1..3 — bigger = more frequent
  const size = 13 + (weight - 1) * 2;
  const padV = 5 + (weight - 1);
  const padH = 10 + (weight - 1) * 2;
  return (
    <span className="serif" style={{
      display: 'inline-block',
      fontSize: size, fontStyle: 'italic',
      color: 'var(--ink)',
      background: weight >= 3 ? 'var(--accent-mint, #E1F5EE)'
        : weight === 2 ? 'var(--sage-soft, #E1EBD2)'
        : 'var(--paper-soft, #F6EFDC)',
      border: '1px solid rgba(74,27,12,0.1)',
      padding: `${padV}px ${padH}px`,
      borderRadius: 999,
      transform: `rotate(${rotation}deg)`,
    }}>{word}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Gentle summary text — based on simple heuristics
// ─────────────────────────────────────────────────────────────
function _gentleSummary({ moods, winsCount, releasedCount, entriesCount }) {
  const filledMoods = moods.filter(m => m != null);
  if (!entriesCount) {
    return 'this week was quiet on the page. that\'s okay — rest is part of it. one small note is enough to start again.';
  }
  const avg = filledMoods.length
    ? filledMoods.reduce((a, b) => a + b, 0) / filledMoods.length
    : 3;
  const firstHalf = filledMoods.slice(0, Math.ceil(filledMoods.length / 2));
  const secondHalf = filledMoods.slice(Math.ceil(filledMoods.length / 2));
  const trend = (secondHalf.reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length))
              - (firstHalf.reduce((a, b) => a + b, 0) / Math.max(1, firstHalf.length));

  if (avg < 2.3) {
    return 'this week leaned heavy. you still showed up to write — that matters more than it feels. be gentle with yourself.';
  }
  if (avg < 3.0 && trend > 0.4) {
    return 'a soft turn upward toward the end of the week. you tended to yourself, even on the harder days.';
  }
  if (trend < -0.5) {
    return 'the week started lighter and grew tired. notice what shifted — and what might give you a little rest.';
  }
  if (avg >= 4.0 && winsCount >= 4) {
    return 'this was a sunlit week. you noticed good things and let yourself feel them. keep this page nearby.';
  }
  if (releasedCount >= 3) {
    return `you set down ${releasedCount} ${releasedCount === 1 ? 'worry' : 'worries'} this week. that\'s real care — your hands are a little lighter.`;
  }
  return 'this week, your forest looked a little tired but steady. you still showed up gently.';
}

// ─────────────────────────────────────────────────────────────
// WEEKLY REPORT SCREEN
// ─────────────────────────────────────────────────────────────
function WeeklyReportScreen({ timeline, onNav }) {
  const now = TODAY;
  const [start, end] = useMemo(() => _wkRange(now), [now]);
  const startMs = start.getTime();
  const endMs = end.getTime() + 24 * 60 * 60 * 1000 - 1;

  // Build 7 days mon-sun-like sequence (just oldest → newest)
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push({
        iso: _toISO(d),
        dObj: d,
        label: DAY_NAMES[d.getDay()].slice(0, 1).toLowerCase(),
      });
    }
    return arr;
  }, [startMs]);

  // ── Real data extraction ────────────────────────────────
  const real = useMemo(() => {
    const byDate = {};
    (timeline || []).forEach(rec => { byDate[rec.date] = rec; });

    const moods = days.map(d => {
      const r = byDate[d.iso];
      if (!r) return null;
      return recordToMood(r);
    });

    // Top words from journal text + treehole keeps in range
    const text = [];
    days.forEach(d => {
      const r = byDate[d.iso];
      if (r?.journal_text) text.push(String(r.journal_text));
    });
    try {
      const keeps = JSON.parse(localStorage.getItem('moodpath_treehole_keep') || '[]');
      keeps.forEach(k => {
        if (k && typeof k.at === 'number' && k.at >= startMs && k.at <= endMs) {
          if (k.text) text.push(String(k.text));
        }
      });
    } catch (e) {}

    const counts = {};
    text.join(' ').toLowerCase()
      .replace(/[^a-z'\s]/g, ' ')
      .split(/\s+/)
      .forEach(w => {
        if (!w || w.length < 4) return;
        if (_STOP_WORDS.has(w)) return;
        counts[w] = (counts[w] || 0) + 1;
      });
    const words = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word, n]) => ({ word, n }));

    // Wins for the week
    let wins = 0;
    try {
      const winsMap = JSON.parse(localStorage.getItem('moodpath_wins_v1') || '{}');
      days.forEach(d => {
        const w = winsMap[d.iso];
        if (Array.isArray(w)) wins += w.length;
      });
    } catch (e) {}

    // Released = let-go + toss
    const released = _logsInRange('moodpath_treehole_letgo', startMs, endMs).length
                   + _logsInRange('moodpath_treehole_toss', startMs, endMs).length;

    // Practices done
    let practices = 0;
    (timeline || []).forEach(rec => {
      const t = new Date(rec.date).getTime();
      if (t >= startMs && t <= endMs && rec.intervention_type) practices += 1;
    });

    const entriesCount = days.filter(d => byDate[d.iso]).length;
    return { moods, words, wins, released, practices, entriesCount };
  }, [timeline, startMs, endMs, days]);

  // ── Sample fallback if essentially nothing ──────────────
  const useSample = real.entriesCount === 0 && real.wins === 0 && real.released === 0;
  const SAMPLE = {
    moods: [3, 2, 2, 3, 4, 4, 4],
    words: [
      { word: 'tired', n: 5 },
      { word: 'walks', n: 4 },
      { word: 'breathe', n: 3 },
      { word: 'sister', n: 2 },
      { word: 'morning', n: 2 },
      { word: 'soft', n: 2 },
    ],
    wins: 9, released: 4, practices: 5, entriesCount: 6,
  };
  const data = useSample ? SAMPLE : real;
  const daysWithMood = days.map((d, i) => ({ ...d, mood: data.moods[i] }));

  const summary = useMemo(() => _gentleSummary({
    moods: data.moods, winsCount: data.wins,
    releasedCount: data.released, entriesCount: data.entriesCount,
  }), [data.moods, data.wins, data.released, data.entriesCount]);

  // chip weights (1..3)
  const maxN = Math.max(1, ...data.words.map(w => w.n));
  const chips = data.words.map(w => ({
    ...w,
    weight: w.n >= maxN ? 3 : (w.n >= maxN * 0.6 ? 2 : 1),
  }));

  const rangeLabel = `${_shortMonth(start)} ${start.getDate()} – ${_shortMonth(end)} ${end.getDate()}`;

  return (
    <Page>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
        <BackBtn onClick={() => onNav({ name: 'me' })}/>
      </div>
      <WashiHeader>this week</WashiHeader>

      <div className="page-enter" style={{ marginTop: 22 }}>
        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.1 }}>
              {rangeLabel}
            </div>
            <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 4 }}>
              {data.entriesCount} {data.entriesCount === 1 ? 'entry' : 'entries'} · a small spread
            </div>
          </div>
          <Sticker type="leaf" size={40} rotation={14}/>
        </div>

        {/* Mood chart */}
        <NotebookCard corner="sun" cornerRotation={-10} style={{ marginBottom: 16, padding: '16px 14px 6px' }}>
          <div className="serif" style={{
            fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8,
          }}>
            inner weather
          </div>
          <MoodLine days={daysWithMood}/>
        </NotebookCard>

        {/* Stat trio */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18, marginTop: 8,
        }}>
          <StatTile
            value={data.practices}
            label={data.practices === 1 ? 'practice tended' : 'practices tended'}
            sticker="sparkle" rotation={10}
            bg="var(--accent-mint, #E1F5EE)"/>
          <StatTile
            value={data.wins}
            label={data.wins === 1 ? 'small win noticed' : 'small wins noticed'}
            sticker="star" rotation={-8}
            bg="var(--paper-soft, #F6EFDC)"/>
          <StatTile
            value={data.released}
            label={data.released === 1 ? 'worry set down' : 'worries set down'}
            sticker="leaf" rotation={14}
            bg="var(--sage-soft, #E1EBD2)"/>
        </div>

        {/* Feeling words */}
        <div className="serif" style={{
          fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', margin: '6px 0 10px',
        }}>
          what kept coming up
        </div>
        <NotebookCard style={{ marginBottom: 18, padding: '16px 14px 18px' }}>
          {chips.length === 0 ? (
            <div className="serif" style={{
              fontStyle: 'italic', color: 'var(--ink-faded)', fontSize: 13, textAlign: 'center', padding: 10,
            }}>
              no words to gather this week.
            </div>
          ) : (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center',
            }}>
              {chips.map((c, i) => (
                <FeelingChip key={c.word}
                  word={c.word} weight={c.weight}
                  rotation={[-4, 2, -2, 4, -1, 3][i % 6]}
                />
              ))}
            </div>
          )}
        </NotebookCard>

        {/* Gentle summary */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          {/* Tape */}
          <div style={{
            position: 'absolute', top: -10, left: '50%', width: 70, height: 18,
            transform: 'translateX(-50%) rotate(-3deg)',
            background: 'rgba(159, 225, 203, 0.6)',
            border: '1px dashed rgba(74,27,12,0.18)',
            zIndex: 2,
          }}/>
          <NotebookCard style={{
            background: 'var(--paper, #FCFAEF)',
            padding: '22px 18px 20px',
          }}>
            <div className="serif" style={{
              fontSize: 12, fontStyle: 'italic', color: 'var(--ink-faded)', textAlign: 'center', marginBottom: 8,
              letterSpacing: 0.4,
            }}>
              — a soft note from your week —
            </div>
            <p className="serif" style={{
              margin: 0, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55,
              color: 'var(--ink)', textAlign: 'center', textWrap: 'pretty',
            }}>
              {summary}
            </p>
            <div style={{
              display: 'flex', justifyContent: 'center', marginTop: 14,
            }}>
              <Sticker type="flower" size={32} rotation={-6}/>
            </div>
          </NotebookCard>
        </div>

        {/* Chat CTA — folded from former Trends card on Me tab */}
        <button
          onClick={() => onNav({ name: 'chat' })}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 16px',
            background: 'var(--accent-mint, #E1F5EE)',
            border: '1px solid rgba(74,27,12,0.1)',
            borderRadius: 14,
            cursor: 'pointer',
            marginBottom: 18,
            fontFamily: 'EB Garamond, serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--ink)',
          }}>
          <Sticker type="cloud" size={24} rotation={-6}/>
          <span>chat with a kind companion</span>
        </button>

        {useSample && (
          <div className="serif" style={{
            fontSize: 11, fontStyle: 'italic', color: 'var(--ink-faded)',
            textAlign: 'center', marginBottom: 24, opacity: 0.7,
          }}>
            sample week — your real spread will appear as you log entries.
          </div>
        )}
      </div>
    </Page>
  );
}

Object.assign(window, { WeeklyReportScreen });

// ═════════════════════════════════════════════════════════════
// MONTHLY REPORT — "season page", broader notebook spread
// Reuses MoodLine vocabulary but uses a calendar heatmap as
// the dominant artifact for the month.
// ═════════════════════════════════════════════════════════════

function _monthRange(now) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [start, end];
}

// ─── Calendar heatmap ──────────────────────────────────────
function MonthCalendar({ monthStart, byDate }) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstWeekday = monthStart.getDay();        // 0=sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayLabels = ['s', 'm', 't', 'w', 't', 'f', 's'];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 6, columnGap: 4,
    }}>
      {dayLabels.map((l, i) => (
        <div key={'h' + i} className="serif" style={{
          fontSize: 10, fontStyle: 'italic',
          color: 'var(--ink-faded)', textAlign: 'center', marginBottom: 2,
        }}>{l}</div>
      ))}
      {cells.map((d, i) => {
        if (d == null) return <div key={'e' + i}/>;
        const iso = _toISO(new Date(year, month, d));
        const rec = byDate[iso];
        const mood = rec ? recordToMood(rec) : null;
        const isToday = iso === _toISO(TODAY);
        return (
          <div key={'d' + i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '2px 0',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: mood ? `var(--mood-${mood})` : 'transparent',
              border: mood
                ? '1px solid rgba(74,27,12,0.1)'
                : '1px dashed rgba(74,27,12,0.18)',
              outline: isToday ? '1.5px solid var(--ink)' : 'none',
              outlineOffset: 1,
            }}/>
            <div className="serif" style={{
              fontSize: 9, fontStyle: 'italic', color: 'var(--ink-faded)',
            }}>{d}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Monthly summary heuristics ────────────────────────────
function _monthlySummary({ moods, checkins, daysInMonth, winsCount, releasedCount }) {
  const filled = moods.filter(m => m != null);
  const showUp = filled.length / Math.max(1, daysInMonth);
  if (filled.length === 0) {
    return 'this month was a quiet one on the page. when you\'re ready, one small entry is enough to begin again.';
  }
  const avg = filled.reduce((a, b) => a + b, 0) / filled.length;
  if (showUp >= 0.8 && avg >= 4) {
    return 'a steady, sunlit month. you showed up to yourself almost every day — and you noticed the good. this is a page worth keeping.';
  }
  if (showUp >= 0.6 && winsCount >= 10) {
    return 'a tended month. you logged in often and gathered small wins like leaves — small things, added up softly.';
  }
  if (avg < 2.5) {
    return 'this month leaned heavy. and still — you came back to the page. that\'s its own kind of courage. be gentle with what you\'ve been carrying.';
  }
  if (releasedCount >= 6) {
    return `you set down ${releasedCount} worries this month. that\'s a lot of unburdening — your hands made room for other things.`;
  }
  return 'a month of soft starts and gentle returns. some days bright, some tired — but you kept the notebook open. that matters.';
}

// ─── MONTH INSIGHTS — drops below Forest calendar ──────────
// Renders stat tiles, word cloud, and a gentle monthly note.
// Forest already provides month navigation + calendar, so this
// component is just the "report" portion. Pass the *viewed* month.
function MonthInsights({ timeline, onNav, monthStart: ms, monthEnd: me }) {
  const now = TODAY;
  const [defStart, defEnd] = useMemo(() => _monthRange(now), [now]);
  const monthStart = ms || defStart;
  const monthEnd = me || defEnd;
  const startMs = monthStart.getTime();
  const endMs = monthEnd.getTime() + 24 * 60 * 60 * 1000 - 1;
  const daysInMonth = monthEnd.getDate();

  // Only show sample fallback when viewing the CURRENT month with no data.
  const isCurrentMonth = monthStart.getFullYear() === now.getFullYear()
                      && monthStart.getMonth() === now.getMonth();

  const byDate = useMemo(() => {
    const o = {};
    (timeline || []).forEach(rec => { o[rec.date] = rec; });
    return o;
  }, [timeline]);

  // Real data
  const real = useMemo(() => {
    const moods = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = _toISO(new Date(monthStart.getFullYear(), monthStart.getMonth(), d));
      const rec = byDate[iso];
      moods.push(rec ? recordToMood(rec) : null);
    }
    const checkins = moods.filter(m => m != null).length;

    // Word counts from journal text + treehole keeps
    const text = [];
    Object.entries(byDate).forEach(([iso, rec]) => {
      const d = new Date(iso);
      if (d >= monthStart && d <= monthEnd && rec.journal_text) text.push(String(rec.journal_text));
    });
    try {
      const keeps = JSON.parse(localStorage.getItem('moodpath_treehole_keep') || '[]');
      keeps.forEach(k => {
        if (k && typeof k.at === 'number' && k.at >= startMs && k.at <= endMs) {
          if (k.text) text.push(String(k.text));
        }
      });
    } catch (e) {}

    const counts = {};
    text.join(' ').toLowerCase()
      .replace(/[^a-z'\s]/g, ' ')
      .split(/\s+/)
      .forEach(w => {
        if (!w || w.length < 4) return;
        if (_STOP_WORDS.has(w)) return;
        counts[w] = (counts[w] || 0) + 1;
      });
    const words = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, n]) => ({ word, n }));

    let wins = 0;
    try {
      const winsMap = JSON.parse(localStorage.getItem('moodpath_wins_v1') || '{}');
      Object.entries(winsMap).forEach(([iso, arr]) => {
        const d = new Date(iso);
        if (d >= monthStart && d <= monthEnd && Array.isArray(arr)) wins += arr.length;
      });
    } catch (e) {}

    const released = _logsInRange('moodpath_treehole_letgo', startMs, endMs).length
                   + _logsInRange('moodpath_treehole_toss', startMs, endMs).length;

    let practices = 0;
    (timeline || []).forEach(rec => {
      const d = new Date(rec.date);
      if (d >= monthStart && d <= monthEnd && rec.intervention_type) practices += 1;
    });

    return { moods, checkins, words, wins, released, practices };
  }, [timeline, byDate, startMs, endMs, daysInMonth, monthStart, monthEnd]);

  // Sample fallback — only on current month with no data
  const useSample = isCurrentMonth && real.checkins === 0 && real.wins === 0 && real.released === 0;
  const SAMPLE_MOODS = (() => {
    const arr = [];
    for (let i = 0; i < daysInMonth; i++) {
      // realistic pattern: missed days + varied moods, trending mild up
      if (i % 5 === 3) arr.push(null);
      else if (i < 8)  arr.push(3 - (i % 2));
      else if (i < 18) arr.push(3 + (i % 3 === 0 ? 0 : 1));
      else             arr.push([4, 5, 4, 3, 4][i % 5]);
    }
    return arr;
  })();
  const SAMPLE = {
    moods: SAMPLE_MOODS,
    checkins: SAMPLE_MOODS.filter(m => m != null).length,
    words: [
      { word: 'tired', n: 11 }, { word: 'walks', n: 9 }, { word: 'breathe', n: 7 },
      { word: 'sister', n: 5 }, { word: 'morning', n: 5 }, { word: 'soft', n: 4 },
      { word: 'sunlight', n: 3 }, { word: 'rest', n: 3 }, { word: 'enough', n: 3 },
      { word: 'slow', n: 2 },
    ],
    wins: 31, released: 12, practices: 18,
  };
  const data = useSample ? SAMPLE : real;

  // Sample byDate for calendar so it isn't blank
  const calendarByDate = useMemo(() => {
    if (!useSample) return byDate;
    const o = {};
    for (let i = 0; i < daysInMonth; i++) {
      const m = SAMPLE.moods[i];
      if (m == null) continue;
      const iso = _toISO(new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1));
      o[iso] = { date: iso, mood: m };
    }
    return o;
  }, [useSample, byDate, daysInMonth, monthStart]);

  const summary = useMemo(() => _monthlySummary({
    moods: data.moods, checkins: data.checkins, daysInMonth,
    winsCount: data.wins, releasedCount: data.released,
  }), [data, daysInMonth]);

  const maxN = Math.max(1, ...data.words.map(w => w.n));
  const chips = data.words.map(w => ({
    ...w,
    weight: w.n >= maxN * 0.66 ? 3 : (w.n >= maxN * 0.33 ? 2 : 1),
  }));

  const monthName = MONTH_NAMES[monthStart.getMonth()].toLowerCase();
  const yearStr = monthStart.getFullYear();

  return (
    <div className="page-enter" style={{ marginTop: 8 }}>
        {/* 4 stat tiles in a 2×2 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18, marginTop: 8,
        }}>
          <StatTile
            value={data.checkins}
            label={data.checkins === 1 ? 'day noted' : 'days noted'}
            sticker="sun" rotation={-8}
            bg="var(--paper-soft, #F6EFDC)"/>
          <StatTile
            value={data.practices}
            label={data.practices === 1 ? 'practice tended' : 'practices tended'}
            sticker="sparkle" rotation={10}
            bg="var(--accent-mint, #E1F5EE)"/>
          <StatTile
            value={data.wins}
            label={data.wins === 1 ? 'small win noticed' : 'small wins noticed'}
            sticker="star" rotation={-8}
            bg="var(--paper-soft, #F6EFDC)"/>
          <StatTile
            value={data.released}
            label={data.released === 1 ? 'worry set down' : 'worries set down'}
            sticker="leaf" rotation={14}
            bg="var(--sage-soft, #E1EBD2)"/>
        </div>

        {/* Word cloud */}
        <div className="serif" style={{
          fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', margin: '6px 0 10px',
        }}>
          words that lived here
        </div>
        <NotebookCard style={{ marginBottom: 18, padding: '20px 14px 22px' }}>
          {chips.length === 0 ? (
            <div className="serif" style={{
              fontStyle: 'italic', color: 'var(--ink-faded)', fontSize: 13, textAlign: 'center', padding: 10,
            }}>
              no words to gather this month.
            </div>
          ) : (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center',
            }}>
              {chips.map((c, i) => (
                <FeelingChip key={c.word}
                  word={c.word} weight={c.weight}
                  rotation={[-4, 3, -2, 5, -3, 2, -5, 1, 4, -1][i % 10]}
                />
              ))}
            </div>
          )}
        </NotebookCard>

        {/* Gentle summary */}
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <div style={{
            position: 'absolute', top: -10, left: '50%', width: 70, height: 18,
            transform: 'translateX(-50%) rotate(-3deg)',
            background: 'rgba(244, 192, 209, 0.55)',
            border: '1px dashed rgba(74,27,12,0.18)',
            zIndex: 2,
          }}/>
          <NotebookCard style={{
            background: 'var(--paper, #FCFAEF)',
            padding: '24px 20px 22px',
          }}>
            <div className="serif" style={{
              fontSize: 12, fontStyle: 'italic', color: 'var(--ink-faded)',
              textAlign: 'center', marginBottom: 10, letterSpacing: 0.4,
            }}>
              — a note for the month —
            </div>
            <p className="serif" style={{
              margin: 0, fontSize: 17, fontStyle: 'italic', lineHeight: 1.6,
              color: 'var(--ink)', textAlign: 'center', textWrap: 'pretty',
            }}>
              {summary}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Sticker type="mushroom" size={36} rotation={-6}/>
            </div>
          </NotebookCard>
        </div>

        {/* Chat CTA — companion */}
        <button
          onClick={() => onNav({ name: 'chat' })}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 16px',
            background: 'var(--accent-mint, #E1F5EE)',
            border: '1px solid rgba(74,27,12,0.1)',
            borderRadius: 14,
            cursor: 'pointer',
            marginBottom: 18,
            fontFamily: 'EB Garamond, serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--ink)',
          }}>
          <Sticker type="cloud" size={24} rotation={-6}/>
          <span>reflect with a kind companion</span>
        </button>

        {useSample && (
          <div className="serif" style={{
            fontSize: 11, fontStyle: 'italic', color: 'var(--ink-faded)',
            textAlign: 'center', marginBottom: 24, opacity: 0.7,
          }}>
            sample month — your real season will appear as you log entries.
          </div>
        )}
    </div>
  );
}

Object.assign(window, { MonthInsights });
