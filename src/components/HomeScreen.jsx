import beeImg from '../assets/images/wordhive-mark.png';
import { Icon } from './Icon.jsx';

function worldName(level) {
  if (level <= 20)  return 'Meadow';
  if (level <= 60)  return 'Clover';
  if (level <= 120) return 'Wildflower';
  return 'Golden Grove';
}

const WORD_HIVE_ROWS = [
  ['W', 'O', 'R', 'D'],
  ['H', 'I', 'V', 'E'],
];

export default function HomeScreen({ currentLevel, modeName, onPlay, onHiveMap, onSettings }) {
  const world = worldName(currentLevel);

  return (
    <div className="home">
      {/* Top bar */}
      <div className="home-topbar">
        <button className="gear-btn" onClick={onSettings} aria-label="Settings">
          <Icon name="settings" size={18} color="var(--cream)" accent="var(--honey)" />
        </button>

        <button className="gear-btn" onClick={onHiveMap} aria-label="Hive map">
          <Icon name="hive-map" size={18} color="var(--cream)" accent="var(--honey)" />
        </button>
      </div>

      {/* Bee logo */}
      <img src={beeImg} className="home-bee" alt="Word Hive bee" />

      {/* WORD HIVE hex tiles */}
      <div className="hive-logo" aria-label="Word Hive">
        {WORD_HIVE_ROWS.map((row, ri) => (
          <div className="hive-logo-row" key={ri}>
            {row.map((ch, ci) => (
              <div className="hex-letter" key={ci} aria-hidden="true">{ch}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Tagline */}
      <p className="home-tagline">No ads. Just words.</p>

      {/* Play button */}
      <button className="home-play-btn" onClick={onPlay}>
        Play · Level {currentLevel} · {world}
      </button>

      {/* Daily puzzle card — not yet implemented */}
      {/* <div className="home-daily">
        <div className="home-daily-info">
          <div className="home-daily-title">Daily puzzle</div>
          <div className="home-daily-sub">6 letters · +100 coins</div>
        </div>
        <div className="home-daily-badge">🐝</div>
      </div> */}

    </div>
  );
}
