import { Icon } from './Icon.jsx';

export default function Hud({ modeName, currentLevel, solved, totalWords, coins, coinClaim, coinHudRef, onSettings, onBack }) {
  return (
    <header className="hud">
      {/* Back / left side */}
      {onBack ? (
        <button className="hud-back" onClick={onBack} aria-label="Back to home">
          <Icon name="back" size={18} color="var(--cream)" />
        </button>
      ) : (
        <div style={{ width: 44 }} />
      )}

      {/* Center info */}
      <div className="hud-center-info">
        Level {currentLevel}
        {totalWords != null && (
          <span style={{ fontWeight: 400, fontSize: '14px', marginLeft: 6, color: 'var(--ink-mid)' }}>
            {solved}/{totalWords}
          </span>
        )}
      </div>

      {/* Right: coins + settings */}
      <div className="hud-coins-group">
        <div
          ref={coinHudRef}
          className={'coins-pill' + (coinClaim ? ' claimed' : '')}
          aria-label={`${coins} coins`}
        >
          <Icon name="coin" size={20} color="var(--cream)" accent="var(--honey)" />
          {coins}
        </div>
        <button className="gear-btn" onClick={onSettings} aria-label="Settings">
          <Icon name="settings" size={18} color="var(--cream)" accent="var(--honey)" />
        </button>
      </div>
    </header>
  );
}
