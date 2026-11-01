import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { MODE_KEYS, MODES } from '../game/generate.js';

// ─── Packs ───────────────────────────────────────────────────────────────────
const PACKS = [
  { name: 'Meadow',      from: 1,   to: 20  },
  { name: 'Clover',      from: 21,  to: 60  },
  { name: 'Lavender',    from: 61,  to: 120 },
  { name: 'Sunflower',   from: 121, to: 200 },
  { name: 'Royal Jelly', from: 201, to: Infinity },
];
function packForLevel(level) {
  return PACKS.find(p => level >= p.from && (p.to === Infinity || level <= p.to));
}

// ─── Block math ──────────────────────────────────────────────────────────────
// Block 0 = levels 1-10, block 1 = levels 11-20, …
const blockIdxOf   = (level) => Math.floor((level - 1) / 10);
const blockRange   = (idx)   => ({ from: idx * 10 + 1, to: idx * 10 + 10 });

// ─── Layout constants (matches design reference, 390 px wide canvas) ─────────
const CW = 92, CH = 106;   // regular cell
const QW = 118, QH = 136;  // queen cell
const HEX_CLIP = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';

// [cx, cy (relative to row-0 centre at y=0), isQueen]
const BLOCK_LAYOUT = [
  [70,  0,   false], [170,  0,   false], [270,  0,   false],
  [120, 86,  false], [220,  86,  false], [320,  86,  false],
  [70,  172, false], [170,  172, false], [270,  172, false],
  [195, 300, true ],
];
const BLOCK_TOP_PAD  = 53 + 20; // = CH/2 + extra for glow/crown overflow
const BLOCK_CANVAS_H = BLOCK_TOP_PAD + 300 + QH / 2 + 50; // ≈ 486

// ─── Color helpers ───────────────────────────────────────────────────────────
function cellPaint(state, isQueen) {
  if (state === 'done' || state === 'perfect') return {
    outer: isQueen ? '#B85F00' : '#3B2412',
    inner: 'linear-gradient(160deg, #FFE08A, #FFC93C 55%, #F5A000)',
    ink:   '#3B2412',
  };
  if (state === 'current') return {
    outer: '#3B2412',
    inner: 'linear-gradient(160deg, #6B4423, #3B2412)',
    ink:   '#FFC93C',
  };
  return { // locked
    outer: isQueen ? 'rgba(184,95,0,0.7)' : 'rgba(59,36,18,0.25)',
    inner: '#FFF3CF',
    ink:   '#6B4423',
  };
}

// ─── Inline SVGs (from the design reference) ─────────────────────────────────
function CoinSVG() {
  return (
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 100 100">
      <circle cx="50" cy="54" r="44" fill="#B86A00"/>
      <circle cx="50" cy="48" r="44" fill="#FFC21A" stroke="#9A5800" strokeWidth="5"/>
      <polygon points="50,24 71,36 71,60 50,72 29,60 29,36" fill="none" stroke="#B86A00" strokeWidth="7" strokeLinejoin="round"/>
    </svg>
  );
}

function BeeSVG({ style }) {
  return (
    <svg role="img" aria-label="You are here" width="58" height="46" viewBox="0 0 200 160" style={style}>
      <ellipse cx="72"  cy="40"  rx="30" ry="40" fill="rgba(255,255,255,0.92)" stroke="#3B2412" strokeWidth="8" transform="rotate(-25 72 40)"/>
      <ellipse cx="112" cy="38"  rx="28" ry="38" fill="rgba(255,255,255,0.95)" stroke="#3B2412" strokeWidth="8" transform="rotate(20 112 38)"/>
      <polygon points="38,96 12,104 38,114" fill="#3B2412"/>
      <ellipse cx="95"  cy="100" rx="60" ry="44" fill="#FFC93C"/>
      <rect x="64"  y="58" width="18" height="84" fill="#3B2412"/>
      <rect x="100" y="57" width="18" height="86" fill="#3B2412"/>
      <ellipse cx="95" cy="100" rx="60" ry="44" fill="none" stroke="#3B2412" strokeWidth="9"/>
      <circle cx="152" cy="92"  r="32" fill="#FFC93C" stroke="#3B2412" strokeWidth="9"/>
      <circle cx="162" cy="86"  r="8"  fill="#3B2412"/>
    </svg>
  );
}

function HoneyPotSVG() {
  return (
    <svg aria-hidden="true" width="34" height="38" viewBox="0 0 32 36">
      <rect x="9" y="2" width="14" height="6" rx="2" fill="#3B2412"/>
      <path d="M6 10 H26 V30 A4 4 0 0 1 22 34 H10 A4 4 0 0 1 6 30 Z" fill="#FFF6DA" stroke="#3B2412" strokeWidth="2.6"/>
      <path d="M8.5 26 H23.5 V30 A2 2 0 0 1 21.5 32 H10.5 A2 2 0 0 1 8.5 30 Z" fill="#FFC93C"/>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HiveMap({ progress, onBack, onPlay, onSwitchMode }) {
  const mode         = progress.mode;
  const currentLevel = progress.levels[mode];
  const currentBlock = blockIdxOf(currentLevel);

  const [viewBlock, setViewBlock] = useState(currentBlock);
  const prevMode = useRef(mode);

  // When mode changes (via the mode button), jump to that mode's current block
  useEffect(() => {
    if (mode !== prevMode.current) {
      prevMode.current = mode;
      setViewBlock(blockIdxOf(progress.levels[mode]));
    }
  }, [mode, progress.levels]);

  const { from: bFrom, to: bTo } = blockRange(viewBlock);
  const pack       = packForLevel(bFrom);
  const canPrev    = viewBlock > 0;
  const canNext    = viewBlock <= currentBlock; // one block past current is the limit

  const getCellState = (lvl) => {
    if (lvl > currentLevel)  return 'locked';
    if (lvl === currentLevel) return 'current';
    const v = ((progress.crowns || {})[mode] || {})[lvl] || 0;
    return v >= 2 ? 'perfect' : 'done';
  };

  // Build the 10 cells for this block
  const blockLevels = Array.from({ length: 10 }, (_, i) => bFrom + i);
  const cells = BLOCK_LAYOUT.map(([cx, cy, isQueen], i) => {
    const lvl   = blockLevels[i];
    const state = getCellState(lvl);
    const w     = isQueen ? QW : CW;
    const h     = isQueen ? QH : CH;
    return { lvl, cx, cy, isQueen, w, h, state, paint: cellPaint(state, isQueen), inset: isQueen ? 8 : 5.5 };
  });

  // Pack progress strip
  const MINI_W = 13.6, MINI_H = 15.7, MINI_GAP = 3;
  const packLevelsFinite = pack.to !== Infinity;
  const stripTo    = packLevelsFinite ? pack.to : Math.max(pack.from + 19, currentLevel + 9);
  const stripLevels = [];
  for (let l = pack.from; l <= stripTo; l++) stripLevels.push(l);
  const highlightStart = bFrom - pack.from; // index in strip

  // Nav button style helper
  const navBtn = (enabled) => ({
    width: 48, height: 48, borderRadius: '50%', padding: 0, flexShrink: 0,
    background:  enabled ? '#FFF6DA' : 'rgba(255,246,218,0.5)',
    border:      enabled ? '3px solid #3B2412' : '3px solid rgba(59,36,18,0.3)',
    boxShadow:   enabled ? '0 4px 0 #3B2412' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'default',
  });

  return (
    <div style={{
      minHeight: '100dvh',
      maxWidth: 390,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Fredoka', system-ui, sans-serif",
      color: '#3B2412',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top) + 16px) 20px 0' }}>
        <button onClick={onBack} aria-label="Back to home" style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF6DA', border: '3px solid #3B2412', boxShadow: '0 4px 0 #3B2412', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B2412" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flexGrow: 1 }}/>
        <button
          onClick={() => { const next = MODE_KEYS[(MODE_KEYS.indexOf(mode) + 1) % MODE_KEYS.length]; onSwitchMode(next); }}
          aria-label={`Mode: ${MODES[mode].name}. Change mode`}
          style={{ height: 40, padding: '0 14px 0 16px', borderRadius: 20, border: '3px solid #3B2412', background: '#FFF6DA', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: '#3B2412', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {MODES[mode].name}
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B2412" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div style={{ height: 40, padding: '0 14px 0 4px', borderRadius: 20, background: '#3B2412', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 18, fontWeight: 700 }}>
          <CoinSVG/>{progress.coins}
        </div>
      </div>

      {/* ── Block title with prev / next ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 0' }}>
        <button onClick={() => setViewBlock(v => v - 1)} disabled={!canPrev} aria-label="Previous block" style={navBtn(canPrev)}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canPrev ? '#3B2412' : '#6B4423'} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flexGrow: 1, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: '#3B2412' }}>{pack.name}</h1>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6B4423' }}>Levels {bFrom}–{bTo}</div>
        </div>
        <button onClick={() => setViewBlock(v => v + 1)} disabled={!canNext} aria-label="Next block" style={navBtn(canNext)}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canNext ? '#3B2412' : '#6B4423'} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* ── Pack progress strip ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 20px 0' }}>
        <div role="img" aria-label={`${pack.name} progress`} style={{ position: 'relative', display: 'flex', gap: MINI_GAP, padding: '6px 8px', borderRadius: 14 }}>
          {/* Highlight for current block */}
          <div style={{
            position: 'absolute',
            left:   8  + highlightStart * (MINI_W + MINI_GAP),
            right:  8  + Math.max(0, stripLevels.length - highlightStart - 10) * (MINI_W + MINI_GAP),
            top: 0, bottom: 0,
            borderRadius: 12,
            background: 'rgba(255,246,218,0.7)',
            border: '2px solid rgba(59,36,18,0.25)',
          }}/>
          {stripLevels.map(lvl => {
            const st  = getCellState(lvl);
            const isQ = lvl % 10 === 0;
            const outer = st === 'locked' ? (isQ ? 'rgba(184,95,0,0.7)' : 'rgba(59,36,18,0.25)') : (isQ ? '#B85F00' : '#3B2412');
            const inner = st === 'locked' ? '#FFF6DA' : 'linear-gradient(160deg, #FFE08A, #FFC93C 55%, #F5A000)';
            return (
              <span key={lvl} style={{ position: 'relative', width: MINI_W, height: MINI_H, background: outer, clipPath: HEX_CLIP, flexShrink: 0 }}>
                <span style={{ position: 'absolute', inset: 2.2, clipPath: HEX_CLIP, background: inner }}/>
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Block grid (absolute positioned, 390 px canvas) ── */}
      <div style={{ position: 'relative', width: '100%', height: BLOCK_CANVAS_H, flexShrink: 0 }}>
        {cells.map(({ lvl, cx, cy, isQueen, w, h, state, paint, inset }) => {
          const top  = cy + BLOCK_TOP_PAD - h / 2;
          const left = cx - w / 2;
          const isCurrent = state === 'current';
          const isPerfect = state === 'perfect';

          return (
            <div key={lvl} style={{ position: 'absolute', left, top }}>
              {/* Glow halo behind current cell */}
              {isCurrent && (
                <div aria-hidden="true" style={{ position: 'absolute', left: -12, top: -13, width: w + 24, height: h + 26, background: 'rgba(255,255,255,0.75)', clipPath: HEX_CLIP }}/>
              )}

              {/* Cell shell (outer border colour) */}
              <div
                role={state !== 'locked' ? 'button' : 'img'}
                aria-label={`${isQueen ? 'Queen Cell, level' : 'Level'} ${lvl}${isCurrent ? ', play now' : isPerfect ? ', perfect' : state === 'done' ? ', done' : ', locked'}`}
                onClick={state !== 'locked' ? onPlay : undefined}
                style={{ position: 'relative', width: w, height: h, background: paint.outer, clipPath: HEX_CLIP, cursor: state !== 'locked' ? 'pointer' : 'default' }}
              >
                {/* Inner face */}
                <span style={{ position: 'absolute', inset, clipPath: HEX_CLIP, background: paint.inner, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isQueen ? 36 : 30, fontWeight: 700, color: paint.ink }}>
                  {lvl}
                </span>
              </div>

              {/* Crown badge (perfect) */}
              {isPerfect && (
                <div aria-hidden="true" style={{ position: 'absolute', left: w / 2 - 16, top: -14, width: 32, height: 26, borderRadius: 13, background: '#3B2412', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="15" viewBox="0 0 24 18">
                    <path d="M3 15.5L2 4l5.5 4.5L12 1.5l4.5 7L22 4l-1 11.5z" fill="#FFC93C" stroke="#FFC93C" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Bee (current) */}
              {isCurrent && <BeeSVG style={{ position: 'absolute', left: w - 16, top: -26 }}/>}
            </div>
          );
        })}

        {/* Honey pots — every 5th non-queen level */}
        {cells
          .filter(c => c.lvl % 5 === 0 && c.lvl % 10 !== 0)
          .map(({ lvl, cy }) => (
            <div key={`pot-${lvl}`} aria-label={`Honey pot at level ${lvl}: 30 coins`} style={{ position: 'absolute', left: 20, top: cy + BLOCK_TOP_PAD - 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <HoneyPotSVG/>
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>+30</span>
            </div>
          ))
        }

        {/* Queen Cell label */}
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 300 + BLOCK_TOP_PAD + QH / 2 + 8, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#3B2412' }}>
          Queen Cell · double coins
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: `0 20px calc(env(safe-area-inset-bottom) + 20px)`, display: 'flex', gap: 12, alignItems: 'center', boxSizing: 'border-box' }}>
        {/* Daily puzzle placeholder */}
        <div aria-label="Daily puzzle (coming soon)" style={{ width: 60, height: 60, borderRadius: '50%', background: '#FFF6DA', border: '3px solid #3B2412', boxShadow: '0 4px 0 #3B2412', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
          <Icon name="daily" size={28} color="#3B2412" accent="#FFC93C"/>
        </div>
        <button onClick={onPlay} style={{ flex: 1, height: 60, borderRadius: 30, background: '#3B2412', color: '#FFC93C', border: 'none', fontSize: 22, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 6px 0 rgba(59,36,18,0.35)', cursor: 'pointer' }}>
          Play level {currentLevel}
        </button>
      </div>

    </div>
  );
}
