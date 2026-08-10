let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, duration, type = 'sine', volume = 0.18) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export const sounds = {
  tap:     () => tone(520, 0.06),
  correct: () => { tone(520, 0.1); setTimeout(() => tone(660, 0.15), 80); },
  bonus:   () => { tone(440, 0.1); setTimeout(() => tone(550, 0.1), 90); setTimeout(() => tone(660, 0.18), 180); },
  wrong:   () => tone(180, 0.18, 'sawtooth', 0.12),
  seen:    () => tone(300, 0.1, 'sine', 0.1),
};

export function vibrate(pattern = 30) {
  navigator.vibrate?.(pattern);
}
