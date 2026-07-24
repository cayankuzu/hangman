export type SoundEffect =
  | "correct"
  | "wrong"
  | "mechanism"
  | "transition"
  | "panel"
  | "choke"
  | "rescue"
  | "failure"
  | "ui";

export type FinalSound = "hanged" | "rescued" | "stalled";

interface AudioEngine {
  context: AudioContext;
  effects: GainNode;
}

let engine: AudioEngine | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getEngine() {
  if (engine) return engine;

  const context = new AudioContext();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 16;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.28;

  const effects = context.createGain();
  effects.gain.value = 0.72;
  effects.connect(compressor);
  compressor.connect(context.destination);
  engine = { context, effects };
  return engine;
}

function resumeContext(context: AudioContext) {
  if (context.state === "suspended") void context.resume();
}

function getNoise(context: AudioContext) {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
    return noiseBuffer;
  }

  const length = context.sampleRate * 2;
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function oscillatorHit({
  bus,
  context,
  start,
  duration,
  from,
  to = from,
  volume,
  type = "sine",
}: {
  bus: AudioNode;
  context: AudioContext;
  start: number;
  duration: number;
  from: number;
  to?: number;
  volume: number;
  type?: OscillatorType;
}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(to, 20),
    start + duration,
  );
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(bus);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noiseHit({
  bus,
  context,
  start,
  duration,
  volume,
  frequency,
  filterType = "bandpass",
}: {
  bus: AudioNode;
  context: AudioContext;
  start: number;
  duration: number;
  volume: number;
  frequency: number;
  filterType?: BiquadFilterType;
}) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = getNoise(context);
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = filterType === "bandpass" ? 1.5 : 0.7;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function playTone(enabled: boolean, type: SoundEffect) {
  if (!enabled || typeof AudioContext === "undefined") return;

  const { context, effects } = getEngine();
  resumeContext(context);
  const now = context.currentTime + 0.008;

  if (type === "correct") {
    [392, 494, 659].forEach((frequency, index) =>
      oscillatorHit({
        bus: effects,
        context,
        start: now + index * 0.055,
        duration: 0.36,
        from: frequency,
        to: frequency * 1.015,
        volume: 0.105 - index * 0.018,
        type: index === 0 ? "triangle" : "sine",
      }),
    );
    return;
  }

  if (type === "wrong") {
    oscillatorHit({
      bus: effects,
      context,
      start: now,
      duration: 0.44,
      from: 176,
      to: 62,
      volume: 0.13,
      type: "sawtooth",
    });
    noiseHit({
      bus: effects,
      context,
      start: now,
      duration: 0.2,
      volume: 0.07,
      frequency: 520,
    });
    return;
  }

  if (type === "mechanism" || type === "panel") {
    oscillatorHit({
      bus: effects,
      context,
      start: now,
      duration: type === "panel" ? 0.78 : 0.52,
      from: type === "panel" ? 68 : 92,
      to: 34,
      volume: type === "panel" ? 0.2 : 0.14,
      type: "sawtooth",
    });
    noiseHit({
      bus: effects,
      context,
      start: now + 0.02,
      duration: type === "panel" ? 0.46 : 0.24,
      volume: type === "panel" ? 0.16 : 0.09,
      frequency: type === "panel" ? 170 : 260,
      filterType: "lowpass",
    });
    if (type === "panel") {
      noiseHit({
        bus: effects,
        context,
        start: now + 0.12,
        duration: 0.26,
        volume: 0.08,
        frequency: 1850,
      });
    }
    return;
  }

  if (type === "choke") {
    oscillatorHit({
      bus: effects,
      context,
      start: now,
      duration: 1.1,
      from: 112,
      to: 48,
      volume: 0.12,
      type: "sawtooth",
    });
    [0.08, 0.43, 0.78].forEach((offset, index) =>
      noiseHit({
        bus: effects,
        context,
        start: now + offset,
        duration: 0.26 + index * 0.04,
        volume: 0.065 - index * 0.01,
        frequency: 820 - index * 120,
        filterType: "bandpass",
      }),
    );
    return;
  }

  if (type === "rescue") {
    [392, 523, 659, 784].forEach((frequency, index) =>
      oscillatorHit({
        bus: effects,
        context,
        start: now + index * 0.09,
        duration: 0.72,
        from: frequency,
        to: frequency * 1.025,
        volume: 0.085 - index * 0.008,
        type: "sine",
      }),
    );
    return;
  }

  if (type === "failure") {
    [104, 78, 52].forEach((frequency, index) =>
      oscillatorHit({
        bus: effects,
        context,
        start: now + index * 0.11,
        duration: 0.62,
        from: frequency,
        to: frequency * 0.72,
        volume: 0.09,
        type: "triangle",
      }),
    );
    return;
  }

  const transition = type === "transition";
  oscillatorHit({
    bus: effects,
    context,
    start: now,
    duration: transition ? 0.44 : 0.16,
    from: transition ? 220 : 520,
    to: transition ? 440 : 610,
    volume: transition ? 0.09 : 0.055,
    type: "sine",
  });
}

export function playFinalSequence(enabled: boolean, result: FinalSound) {
  if (!enabled || typeof window === "undefined") return () => undefined;

  const timers: number[] = [];
  if (result === "hanged") {
    timers.push(
      window.setTimeout(() => playTone(true, "panel"), 620),
      window.setTimeout(() => playTone(true, "choke"), 1160),
    );
  } else if (result === "rescued") {
    timers.push(window.setTimeout(() => playTone(true, "rescue"), 520));
  } else {
    timers.push(window.setTimeout(() => playTone(true, "failure"), 420));
  }

  return () => timers.forEach((timer) => window.clearTimeout(timer));
}
