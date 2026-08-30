import { MODES, MODE_KEYS } from '../game/generate.js';
import { CloseIcon, SoundIcon, MuteIcon, VibrateIcon } from '../assets/icons/index.js';

const BOARDS = [
  {
    key: 'crossword',
    name: 'Crossword',
    art: (
      <svg viewBox="0 0 34 26" width="34" height="26" aria-hidden="true">
        <g fill="currentColor">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="2" width="6" height="6" rx="1" />
          <rect x="23" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="16" width="6" height="6" rx="1" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="23" y="16" width="6" height="6" rx="1" />
        </g>
      </svg>
    )
  },
  {
    key: 'rows',
    name: 'Word list',
    art: (
      <svg viewBox="0 0 34 26" width="34" height="26" aria-hidden="true">
        <g fill="currentColor">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="10" width="6" height="6" rx="1" />
          <rect x="9" y="10" width="6" height="6" rx="1" />
          <rect x="16" y="10" width="6" height="6" rx="1" />
          <rect x="2" y="18" width="6" height="6" rx="1" />
          <rect x="9" y="18" width="6" height="6" rx="1" />
          <rect x="16" y="18" width="6" height="6" rx="1" />
          <rect x="23" y="18" width="6" height="6" rx="1" />
        </g>
      </svg>
    )
  }
];

export default function SettingsSheet({ progress, setProgress, onClose, onSetBoard, onSwitchMode, onStartOver }) {
  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet-card scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="sheet-title">Settings</h2>
          <button className="sheet-close" onClick={onClose} aria-label="Close settings">
            <CloseIcon size={20} />
          </button>
        </div>

        <div>
          <p className="hud-label">Board</p>
          <div className="boards">
            {BOARDS.map((b) => (
              <button
                key={b.key}
                className={'board-option' + (progress.board === b.key ? ' on' : '')}
                onClick={() => onSetBoard(b.key)}
              >
                <span className="board-art" aria-hidden="true">{b.art}</span>
                <span className="board-name">{b.name}</span>
                <span className="board-blurb">{b.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="hud-label">Difficulty</p>
        <p className="sheet-body">
          Each difficulty keeps its own level, so you can switch and come back without losing your place.
        </p>
        <div className="modes">
          {MODE_KEYS.map((key) => (
            <button
              key={key}
              className={'mode' + (key === progress.mode ? ' on' : '')}
              onClick={() => onSwitchMode(key)}
            >
              <span className="mode-head">
                <span className="mode-name">{MODES[key].name}</span>
                <span className="mode-level">level {progress.levels[key]}</span>
              </span>
              <span className="mode-blurb">{MODES[key].blurb}</span>
            </button>
          ))}
        </div>

        <p className="hud-label">Audio &amp; Haptics</p>
        <div className="toggles">
          <button
            className={'toggle' + (progress.sound ? ' on' : '')}
            onClick={() => setProgress((p) => ({ ...p, sound: !p.sound }))}
            aria-pressed={progress.sound}
          >
            {progress.sound ? <SoundIcon size={18} /> : <MuteIcon size={18} />}
            <span>{progress.sound ? 'Sound on' : 'Sound off'}</span>
          </button>
          <button
            className={'toggle' + (progress.vibrate ? ' on' : '')}
            onClick={() => setProgress((p) => ({ ...p, vibrate: !p.vibrate }))}
            aria-pressed={progress.vibrate}
          >
            <VibrateIcon size={18} />
            <span>{progress.vibrate ? 'Vibrate on' : 'Vibrate off'}</span>
          </button>
        </div>

        <button className="link" onClick={onStartOver}>
          Reset all progress
        </button>
      </div>
    </div>
  );
}
