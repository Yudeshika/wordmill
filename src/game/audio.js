let _ctx = null;

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// Schedule a single oscillator note with a fast attack and exponential decay.
// freqEnd: optional target for a frequency glide over the duration.
function tone(ctx, freq, type, peak, start, dur, freqEnd) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// Subtle tick when a letter is added to the selection.
export function playTap() {
  const ctx = ac();
  const t = ctx.currentTime + 0.01;
  tone(ctx, 1050, 'sine', 0.07, t, 0.055);
}

// Satisfying two-note chime on a correct puzzle word.
export function playCorrect() {
  const ctx = ac();
  const t = ctx.currentTime + 0.01;
  tone(ctx, 523, 'sine', 0.18, t, 0.20);
  tone(ctx, 659, 'sine', 0.16, t + 0.10, 0.24);
}

// Warmer three-note arpeggio for a bonus word discovery.
export function playBonus() {
  const ctx = ac();
  const t = ctx.currentTime + 0.01;
  tone(ctx, 523, 'triangle', 0.15, t, 0.17);
  tone(ctx, 659, 'triangle', 0.14, t + 0.08, 0.19);
  tone(ctx, 784, 'triangle', 0.13, t + 0.16, 0.24);
}

// Low dull thud with a slight pitch drop for invalid/already-found words.
export function playWrong() {
  const ctx = ac();
  const t = ctx.currentTime + 0.01;
  tone(ctx, 220, 'sine', 0.14, t, 0.16, 160);
}

// Short four-note fanfare when the puzzle is complete.
export function playComplete() {
  const ctx = ac();
  const t = ctx.currentTime + 0.01;
  tone(ctx, 523, 'sine', 0.18, t, 0.18);
  tone(ctx, 659, 'sine', 0.16, t + 0.12, 0.18);
  tone(ctx, 784, 'sine', 0.15, t + 0.24, 0.18);
  tone(ctx, 1047, 'sine', 0.20, t + 0.38, 0.34);
}

// Haptics — Capacitor Haptics on native iOS/Android, navigator.vibrate on web/PWA.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

export function vibrateTap() {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Light });
  } else {
    navigator.vibrate?.([8]);
  }
}

export function vibrateCorrect() {
  if (isNative) {
    Haptics.notification({ type: NotificationType.Success });
  } else {
    navigator.vibrate?.([35]);
  }
}

export function vibrateBonus() {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Medium });
  } else {
    navigator.vibrate?.([25, 40, 45]);
  }
}

export function vibrateWrong() {
  if (isNative) {
    Haptics.notification({ type: NotificationType.Error });
  } else {
    navigator.vibrate?.([60]);
  }
}

export function vibrateComplete() {
  if (isNative) {
    Haptics.notification({ type: NotificationType.Success });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 350);
  } else {
    navigator.vibrate?.([30, 50, 30, 50, 70]);
  }
}
