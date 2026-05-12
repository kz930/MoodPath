// MoodPath shared components
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// Stickers — small geometric SVGs, charming, not "AI illustrated"
// ─────────────────────────────────────────────────────────────

function Sticker({ type, size = 36, rotation = 8, style = {}, ...rest }) {
  const s = size;
  const common = {
    width: s, height: s,
    viewBox: '0 0 40 40',
    style: { transform: `rotate(${rotation}deg)`, ...style },
    ...rest,
  };
  switch (type) {
    case 'sun':
      return (
        <svg {...common}>
          <g stroke="#4A1B0C" strokeWidth="1.4" strokeLinecap="round">
            <line x1="20" y1="3" x2="20" y2="9" />
            <line x1="20" y1="31" x2="20" y2="37" />
            <line x1="3" y1="20" x2="9" y2="20" />
            <line x1="31" y1="20" x2="37" y2="20" />
            <line x1="8" y1="8" x2="12" y2="12" />
            <line x1="28" y1="28" x2="32" y2="32" />
            <line x1="8" y1="32" x2="12" y2="28" />
            <line x1="28" y1="12" x2="32" y2="8" />
          </g>
          <circle cx="20" cy="20" r="8" fill="#EF9F27" stroke="#4A1B0C" strokeWidth="1.4" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...common}>
          <path d="M8 32 C 8 14, 22 8, 34 8 C 34 22, 28 34, 8 32 Z"
                fill="#C0DD97" stroke="#4A1B0C" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M8 32 L 28 14" stroke="#4A1B0C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M20 4 L 22 18 L 36 20 L 22 22 L 20 36 L 18 22 L 4 20 L 18 18 Z"
                fill="#FAC775" stroke="#4A1B0C" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M20 33 C 8 24, 4 16, 8 11 C 12 6, 18 9, 20 14 C 22 9, 28 6, 32 11 C 36 16, 32 24, 20 33 Z"
                fill="#F4C0D1" stroke="#4A1B0C" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      );
    case 'cloud':
      return (
        <svg {...common}>
          <path d="M10 26 C 4 26, 4 18, 10 18 C 10 12, 18 10, 22 14 C 26 10, 34 14, 34 20 C 38 22, 36 28, 30 28 L 12 28 C 8 28, 8 26, 10 26 Z"
                fill="#FFFFFF" stroke="#4A1B0C" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      );
    case 'flower':
      return (
        <svg {...common}>
          <g fill="#F4C0D1" stroke="#4A1B0C" strokeWidth="1.3">
            <ellipse cx="20" cy="9" rx="5" ry="7"/>
            <ellipse cx="31" cy="20" rx="7" ry="5"/>
            <ellipse cx="20" cy="31" rx="5" ry="7"/>
            <ellipse cx="9" cy="20" rx="7" ry="5"/>
          </g>
          <circle cx="20" cy="20" r="4" fill="#FAC775" stroke="#4A1B0C" strokeWidth="1.3" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M28 6 C 18 8, 12 16, 14 26 C 16 34, 26 36, 32 30 C 22 30, 18 22, 22 12 C 24 8, 26 6, 28 6 Z"
                fill="#9FE1CB" stroke="#4A1B0C" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M20 4 L 24 16 L 36 16 L 26 24 L 30 36 L 20 28 L 10 36 L 14 24 L 4 16 L 16 16 Z"
                fill="#FAC775" stroke="#4A1B0C" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
      );
    case 'mushroom':
      return (
        <svg {...common}>
          <path d="M6 20 C 6 10, 34 10, 34 20 L 30 22 L 10 22 Z"
                fill="#F0997B" stroke="#4A1B0C" strokeWidth="1.3" strokeLinejoin="round"/>
          <rect x="14" y="22" width="12" height="12" rx="2" fill="#FAEEDA" stroke="#4A1B0C" strokeWidth="1.3"/>
          <circle cx="14" cy="16" r="2" fill="#FAEEDA"/>
          <circle cx="22" cy="14" r="2.5" fill="#FAEEDA"/>
          <circle cx="28" cy="17" r="1.6" fill="#FAEEDA"/>
        </svg>
      );
    case 'bird':
      return (
        <svg {...common}>
          <path d="M6 22 C 12 14, 22 12, 30 16 L 36 12 L 34 20 C 34 28, 24 32, 16 30 C 10 28, 6 26, 6 22 Z"
                fill="#9FE1CB" stroke="#4A1B0C" strokeWidth="1.3" strokeLinejoin="round"/>
          <circle cx="28" cy="20" r="1.4" fill="#4A1B0C"/>
        </svg>
      );
    default:
      return null;
  }
}

// Mood faces — five expressions on a colored circle
function MoodFace({ mood, size = 26 }) {
  const eyeY = 16;
  // mood: 1 (low) → 5 (high)
  // mouth path varies
  let mouth;
  switch (mood) {
    case 1: mouth = <path d="M 14 26 Q 20 22 26 26" stroke="#4A1B0C" strokeWidth="1.6" fill="none" strokeLinecap="round"/>; break;
    case 2: mouth = <path d="M 14 25 Q 20 23 26 25" stroke="#4A1B0C" strokeWidth="1.6" fill="none" strokeLinecap="round"/>; break;
    case 3: mouth = <line x1="14" y1="24" x2="26" y2="24" stroke="#4A1B0C" strokeWidth="1.6" strokeLinecap="round"/>; break;
    case 4: mouth = <path d="M 14 23 Q 20 27 26 23" stroke="#4A1B0C" strokeWidth="1.6" fill="none" strokeLinecap="round"/>; break;
    case 5: mouth = <path d="M 13 22 Q 20 30 27 22" stroke="#4A1B0C" strokeWidth="1.7" fill="none" strokeLinecap="round"/>; break;
    default: mouth = null;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="15" cy={eyeY} r="1.6" fill="#4A1B0C"/>
      <circle cx="25" cy={eyeY} r="1.6" fill="#4A1B0C"/>
      {mouth}
    </svg>
  );
}

const MOOD_COLORS = {
  1: 'var(--mood-1)',
  2: 'var(--mood-2)',
  3: 'var(--mood-3)',
  4: 'var(--mood-4)',
  5: 'var(--mood-5)',
};
const MOOD_LABELS = { 1: 'rough', 2: 'meh', 3: 'okay', 4: 'good', 5: 'great' };

function MoodCircle({ mood, selected, dimmed, pulsing, onClick }) {
  return (
    <button
      className={`mood-circle ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''} ${pulsing ? 'mood-pulse' : ''}`}
      style={{ background: MOOD_COLORS[mood] }}
      onClick={onClick}
      aria-label={`mood ${mood} — ${MOOD_LABELS[mood]}`}
    >
      <MoodFace mood={mood} />
    </button>
  );
}

function MoodSelector({ value, onChange, style = 'circles' }) {
  const noneSelected = value == null;
  if (style === 'rail') {
    // Slider-style rail
    return (
      <div style={{ position: 'relative', padding: '24px 8px 8px 8px' }}>
        <div style={{
          position: 'absolute', left: 18, right: 18, top: 44,
          height: 4, borderRadius: 2,
          background: 'linear-gradient(90deg, var(--mood-5), var(--mood-4), var(--mood-3), var(--mood-2), var(--mood-1))',
          opacity: 0.55,
        }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {[5,4,3,2,1].map(m => (
            <MoodCircle
              key={m}
              mood={m}
              selected={value === m}
              dimmed={!noneSelected && value !== m}
              pulsing={noneSelected && (m === 2 || m === 3 || m === 4)}
              onClick={() => onChange(m)}
            />
          ))}
        </div>
      </div>
    );
  }
  if (style === 'big') {
    // Compact row, oversized circles
    return (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', padding: '4px 0' }}>
        {[5,4,3,2,1].map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`mood-circle ${value === m ? 'selected' : ''} ${value != null && value !== m ? 'dimmed' : ''}`}
            style={{ background: MOOD_COLORS[m], width: 56, height: 56 }}
            aria-label={`mood ${m}`}
          >
            <MoodFace mood={m} size={32} />
          </button>
        ))}
      </div>
    );
  }
  // default 'circles'
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', padding: '4px 0' }}>
      {[5,4,3,2,1].map(m => (
        <MoodCircle
          key={m}
          mood={m}
          selected={value === m}
          dimmed={!noneSelected && value !== m}
          pulsing={noneSelected && (m === 2 || m === 3 || m === 4)}
          onClick={() => onChange(m)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Washi tape header
// ─────────────────────────────────────────────────────────────
function WashiHeader({ children, color }) {
  return (
    <div className="washi" style={color ? { background: color } : undefined}>
      <div className="washi-stripes" />
      <span style={{ position: 'relative' }}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashed input + textarea
// ─────────────────────────────────────────────────────────────
function DashedInput({ value, onChange, placeholder, prefix, type = 'text', onSave }) {
  const [saved, setSaved] = useState(false);
  const [localKey, setLocalKey] = useState(0);
  const handleBlur = () => {
    if (value && value.trim() && onSave) {
      setSaved(true);
      onSave(value);
      setLocalKey(k => k + 1);
      setTimeout(() => setSaved(false), 900);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, position: 'relative' }}>
      {prefix && (
        <span style={{
          fontFamily: 'EB Garamond, serif',
          color: 'var(--ink-faded)',
          fontSize: 14, fontStyle: 'italic',
          minWidth: 14,
        }}>{prefix}</span>
      )}
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type={type}
          className={`dashed-line ${saved ? 'pen-saved' : ''}`}
          key={localKey}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function DashedTextarea({ value, onChange, placeholder, rows = 4 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <div style={{
      backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, var(--line-dashed) 23px, var(--line-dashed) 24px)',
      paddingTop: 0,
    }}>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: rows * 24,
          lineHeight: '24px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'Nunito, sans-serif',
          fontSize: 15,
          color: 'var(--ink)',
          padding: 0,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notebook card
// ─────────────────────────────────────────────────────────────
function NotebookCard({ children, corner, cornerRotation = 12, style = {}, ...rest }) {
  return (
    <div className="notebook-card" style={style} {...rest}>
      {corner && (
        <div className="sticker" style={{ top: -10, right: -8, zIndex: 2 }}>
          <Sticker type={corner} size={42} rotation={cornerRotation} />
        </div>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Streak chip
// ─────────────────────────────────────────────────────────────
function StreakChip({ count, total = 7, label }) {
  return (
    <div className="streak-chip">
      <span style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 14 }}>
        {count} of last {total} days
      </span>
      <span style={{ width: 1, height: 14, background: 'rgba(74,27,12,0.15)' }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={i < count ? 'dot-fill' : ''}
            style={{
              display: 'inline-block',
              width: 8, height: 8, borderRadius: '50%',
              background: i < count ? 'var(--accent-mint-deep)' : 'transparent',
              border: i < count ? 'none' : '1px dashed var(--ink-faded)',
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>
      {label && <span style={{ color: 'var(--ink-soft)' }}>{label}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab bar
// ─────────────────────────────────────────────────────────────
function TabIcon({ name, active }) {
  const stroke = active ? '#3D2A18' : '#B3A88F';
  switch (name) {
    case 'today':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.6"/>
          <g stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <line x1="12" y1="3" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="21"/>
            <line x1="3" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="21" y2="12"/>
            <line x1="5.5" y1="5.5" x2="7" y2="7"/>
            <line x1="17" y1="17" x2="18.5" y2="18.5"/>
            <line x1="5.5" y1="18.5" x2="7" y2="17"/>
            <line x1="17" y1="7" x2="18.5" y2="5.5"/>
          </g>
        </svg>
      );
    case 'treehole':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 21 L 6 12 C 6 8, 9 5, 12 5 C 15 5, 18 8, 18 12 L 18 21" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
          <ellipse cx="12" cy="14" rx="2.5" ry="3.5" stroke={stroke} strokeWidth="1.6" fill={active ? stroke : 'none'} fillOpacity="0.15"/>
        </svg>
      );
    case 'practices':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 4 L 5 19 C 5 20, 6 21, 7 21 L 19 21 L 19 6 C 19 5, 18 4, 17 4 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"/>
          <line x1="9" y1="9" x2="15" y2="9" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="9" y1="13" x2="14" y2="13" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      );
    case 'forest':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {/* left tree — upright pine */}
          <path d="M 4 17 L 12 17 L 8 10 Z M 5 12 L 11 12 L 8 5 Z" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
          <line x1="8" y1="17" x2="8" y2="20" stroke={stroke} strokeWidth="1.3" strokeLinecap="round"/>
          {/* right tree */}
          <path d="M 13 18 L 21 18 L 17 11 Z M 14 13 L 20 13 L 17 6 Z" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
          <line x1="17" y1="18" x2="17" y2="20.5" stroke={stroke} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      );
    case 'me':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="3.5" stroke={stroke} strokeWidth="1.6"/>
          <path d="M5 20 C 5 16, 8 14, 12 14 C 16 14, 19 16, 19 20" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      );
  }
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'today', label: 'today' },
    { id: 'treehole', label: 'tree hole' },
    { id: 'practices', label: 'practices' },
    { id: 'forest', label: 'forest' },
    { id: 'me', label: 'me' },
  ];
  return (
    <div className="tab-bar" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="tab-icon"><TabIcon name={t.id} active={active === t.id} /></span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Back button
// ─────────────────────────────────────────────────────────────
function BackBtn({ onClick }) {
  return (
    <button className="btn-back" onClick={onClick} aria-label="back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M15 6 L 9 12 L 15 18" stroke="#4A1B0C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Page wrapper — provides scroll + safe area
// ─────────────────────────────────────────────────────────────
function Page({ children, hasTabBar = false }) {
  return (
    <div className="paper-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="scroll-area page-enter" style={{
        paddingTop: 56,
        paddingLeft: 22, paddingRight: 22,
        paddingBottom: hasTabBar ? 110 : 32,
      }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];

function formatDate(d, fmt = 'long') {
  if (fmt === 'long') return `${DAY_NAMES[d.getDay()]} · ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  if (fmt === 'short') return `${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`;
  if (fmt === 'weekday') return DAY_NAMES[d.getDay()].slice(0, 3);
}

Object.assign(window, {
  Sticker, MoodFace, MoodCircle, MoodSelector,
  WashiHeader, DashedInput, DashedTextarea,
  NotebookCard, StreakChip, TabBar, BackBtn, Page,
  TabIcon,
  MOOD_COLORS, MOOD_LABELS,
  formatDate, DAY_NAMES, MONTH_NAMES,
});
