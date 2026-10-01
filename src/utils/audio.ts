// Web Audio API procedural sound synthesizer (offline-capable, zero external asset dependency)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Load sound preference from localStorage
try {
  const saved = localStorage.getItem('beamdrop_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch {
  // Ignore localStorage errors
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try {
    localStorage.setItem('beamdrop_sound_enabled', enabled ? 'true' : 'false');
  } catch {
    // Ignore
  }
}

function getAudioContext(): AudioContext | null {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a notification chime when transfer request arrives
 */
export function playRequestChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(440, now); // A4
  osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(220, now);
  osc2.frequency.setValueAtTime(329.63, now + 0.12);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.4);
  osc2.stop(now + 0.4);
}

/**
 * Play triumphant completion chime
 */
export function playCompleteChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.2, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  gainNode.connect(ctx.destination);

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
    osc.connect(gainNode);
    osc.start(now + idx * 0.08);
    osc.stop(now + 0.7);
  });
}

/**
 * Play error / cancel tone
 */
export function playErrorTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}
