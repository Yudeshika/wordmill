import coinImg from '../assets/images/coin.png';

const GearIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);

export default function Hud({ modeName, currentLevel, solved, totalWords, coins, coinClaim, coinHudRef, onSettings }) {
  return (
    <header className="hud">
      <div className="hud-section hud-level">
        <div>
          <div className="hud-label">{modeName}</div>
          <div className="hud-value"><span className="value-prefix">Level</span> {currentLevel}</div>
        </div>
      </div>
      <div className="hud-section hud-center">
        <div className="hud-label">Words found</div>
        <div className="hud-value">
          {solved} <span className="value-divider">/</span> {totalWords}
        </div>
      </div>
      <div className="hud-section hud-right">
        <div ref={coinHudRef} className={'coins' + (coinClaim ? ' claimed' : '')} aria-label={`${coins} coins`}>
          <img src={coinImg} className="coin-img" aria-hidden="true" alt="" />
          {coins}
        </div>
        <button className="gear" onClick={onSettings} aria-label="Settings">
          <GearIcon />
        </button>
      </div>
    </header>
  );
}
