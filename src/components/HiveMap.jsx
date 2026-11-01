import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';

const WORLDS = [
  { name: 'Meadow',       from: 1,   to: 20  },
  { name: 'Clover',       from: 21,  to: 60  },
  { name: 'Wildflower',   from: 61,  to: 120 },
  { name: 'Golden Grove', from: 121, to: Infinity },
];

// Group consecutive level numbers into rows of 3 for a honeycomb layout
function chunkRows(levels, rowSize = 3) {
  const rows = [];
  for (let i = 0; i < levels.length; i += rowSize) {
    rows.push(levels.slice(i, i + rowSize));
  }
  return rows;
}

export default function HiveMap({ progress, onBack, onPlay }) {
  const mode = progress.mode;
  const currentLevel = progress.levels[mode];
  const currentCellRef = useRef(null);

  useEffect(() => {
    if (currentCellRef.current) {
      currentCellRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const maxLevel = currentLevel + 20;
  const worldsToShow = WORLDS.filter((w) => w.from <= maxLevel);
  const coins = progress.coins;

  return (
    <div className="hivemap">
      {/* Header */}
      <div className="hivemap-header">
        <button className="hud-back" onClick={onBack} aria-label="Back">
          <Icon name="back" size={18} color="var(--cream)" />
          Hive map
        </button>
        <div className="coins-pill" aria-label={`${coins} coins`}>
          <Icon name="coin" size={20} color="var(--cream)" accent="var(--honey)" />
          {coins}
        </div>
      </div>

      {/* Scrollable level map */}
      <div className="hivemap-scroll">
        {worldsToShow.map((world) => {
          const levelFrom = world.from;
          const levelTo   = Math.min(world.to === Infinity ? maxLevel : world.to, maxLevel);
          if (levelFrom > maxLevel) return null;

          const levelNums = [];
          for (let l = levelFrom; l <= levelTo; l++) {
            levelNums.push(l);
          }

          const doneCount = levelNums.filter((l) => l < currentLevel).length;
          const totalInWorld = world.to === Infinity ? levelNums.length : (world.to - world.from + 1);
          const rows = chunkRows(levelNums, 3);

          return (
            <div className="world-section" key={world.name}>
              <div className="world-title">
                {world.name} · {doneCount}/{Math.min(totalInWorld, levelNums.length)} complete
              </div>
              <div className="hex-grid">
                {rows.map((row, rowIdx) => (
                  <div className={`hex-row${rowIdx % 2 === 1 ? ' offset' : ''}`} key={rowIdx}>
                    {row.map((lvl) => {
                      const isDone    = lvl < currentLevel;
                      const isCurrent = lvl === currentLevel;
                      const isLocked  = lvl > currentLevel;
                      const cls = isDone ? 'hex-cell done' : isCurrent ? 'hex-cell current' : 'hex-cell locked';

                      return (
                        <div
                          key={lvl}
                          className={cls}
                          ref={isCurrent ? currentCellRef : null}
                          onClick={!isLocked ? onPlay : undefined}
                          role={!isLocked ? 'button' : undefined}
                          aria-label={`Level ${lvl}${isDone ? ' (completed)' : isCurrent ? ' (current)' : ' (locked)'}`}
                        >
                          {isDone    && <Icon name="crown" size={16} color={isDone ? 'var(--cream)' : 'var(--ink)'} accent="var(--honey)" />}
                          {isCurrent && <Icon name="bee"   size={16} color="var(--ink)" accent="var(--honey)" />}
                          {isLocked  && <Icon name="lock"  size={14} color="var(--ink-mid)" accent="none" />}
                          <span className="hex-cell-num">{lvl}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky play button */}
      <div className="hivemap-sticky">
        <button className="hivemap-play-btn" onClick={onPlay}>
          Play Level {currentLevel}
        </button>
      </div>
    </div>
  );
}
