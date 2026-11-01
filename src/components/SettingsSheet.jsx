import { MODES, MODE_KEYS } from '../game/generate.js';
import { Icon } from './Icon.jsx';

function ToggleRow({ iconName, label, sub, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span className="toggle-row-label">
        {iconName && <Icon name={iconName} size={20} color="var(--ink)" accent="var(--honey)" style={{ marginBottom: 2 }} />}
        <span className="toggle-row-text">{label}</span>
        {sub && <span className="toggle-row-sub">{sub}</span>}
      </span>
      <span className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
        <span className="toggle-track" />
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

export default function SettingsSheet({ progress, setProgress, onClose, onSetBoard, onSwitchMode, onStartOver }) {
  // const [theme, setTheme]           = useState('system');
  // const [letterSize, setLetterSize] = useState('normal');
  // const [music, setMusic]           = useState(false);
  // const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-circle" onClick={onClose} aria-label="Back">
          <Icon name="back" size={18} color="var(--ink)" />
        </button>
        <span className="settings-title">Settings</span>
      </div>

      <div className="settings-body">

        {/* Sound & Haptics card */}
        <div className="settings-section">
          <ToggleRow
            iconName="sound"
            label="Sound effects"
            sub="Taps, chimes and coins"
            checked={!!progress.sound}
            onChange={() => setProgress((p) => ({ ...p, sound: !p.sound }))}
          />
          {/* Music — not yet implemented */}
          {/* <div className="toggle-divider" />
          <ToggleRow
            iconName="music"
            label="Music"
            sub="Gentle background loop"
            checked={music}
            onChange={() => setMusic((v) => !v)}
          /> */}
          <div className="toggle-divider" />
          <ToggleRow
            iconName="vibration"
            label="Vibration"
            sub="Android phones only"
            checked={!!progress.vibrate}
            onChange={() => setProgress((p) => ({ ...p, vibrate: !p.vibrate }))}
          />
          {/* Reduce motion — not yet implemented */}
          {/* <div className="toggle-divider" />
          <ToggleRow
            iconName="motion"
            label="Reduce motion"
            sub="Fades instead of flying"
            checked={reduceMotion}
            onChange={() => setReduceMotion((v) => !v)}
          /> */}
        </div>

        {/* Theme + Letter size — not yet implemented */}
        {/* <div className="settings-section">
          ...
        </div> */}

        {/* Board */}
        <div className="settings-section">
          <p className="settings-section-label">Board</p>
          <div className="segment segment--pill">
            <button
              className={'segment-btn' + (progress.board === 'crossword' ? ' on' : '')}
              onClick={() => onSetBoard('crossword')}
            >
              Crossword
            </button>
            <button
              className={'segment-btn' + (progress.board === 'rows' ? ' on' : '')}
              onClick={() => onSetBoard('rows')}
            >
              Word list
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div className="settings-section">
          <p className="settings-section-label">Difficulty</p>
          <div className="segment">
            {MODE_KEYS.map((key) => (
              <button
                key={key}
                className={'segment-btn' + (key === progress.mode ? ' on' : '')}
                onClick={() => onSwitchMode(key)}
              >
                {MODES[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Reset card */}
        <div className="settings-section">
          <button
            className="settings-item settings-danger-row"
            onClick={() => {
              if (window.confirm('Reset all progress? This cannot be undone.')) {
                onStartOver();
              }
            }}
          >
            <Icon name="reset" size={18} color="var(--danger)" style={{ marginRight: 8 }} />
            Reset progress
          </button>
        </div>

        <p className="settings-footer">
          Word Hive · no ads, no accounts, your progress stays on this device
        </p>

      </div>
    </div>
  );
}
