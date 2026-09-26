/**
 * Tiny Web Audio synth for feedback sounds, so no audio assets are needed.
 * Each effect is a short sequence of oscillator notes.
 */

type Note = { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number };

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function play(notes: Note[]) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.value = n.freq;
      const peak = n.gain ?? 0.18;
      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(peak, now + n.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.05);
    }
  } catch {
    // Audio is a nicety; ignore browsers that block it.
  }
}

export const sounds = {
  correct: () =>
    play([
      { freq: 880, start: 0, duration: 0.12, type: "triangle" },
      { freq: 1318.5, start: 0.09, duration: 0.25, type: "triangle" },
    ]),
  wrong: () =>
    play([
      { freq: 196, start: 0, duration: 0.18, type: "square", gain: 0.08 },
      { freq: 155.6, start: 0.14, duration: 0.3, type: "square", gain: 0.08 },
    ]),
  tap: () => play([{ freq: 660, start: 0, duration: 0.05, type: "sine", gain: 0.06 }]),
  complete: () =>
    play(
      [523.3, 659.3, 784, 1046.5].map((freq, i) => ({ freq, start: i * 0.11, duration: 0.3, type: "triangle" as const })),
    ),
  chest: () =>
    play([
      { freq: 784, start: 0, duration: 0.1, type: "triangle" },
      { freq: 1046.5, start: 0.08, duration: 0.1, type: "triangle" },
      { freq: 1568, start: 0.16, duration: 0.3, type: "triangle" },
    ]),
};
