import type { AudioSettings } from "../logic/audio-settings";
import {
  loadAudioSettings,
  saveAudioSettings,
} from "../storage/audio-settings";

export type SoundCue =
  | "add"
  | "pour"
  | "success"
  | "failure"
  | "reaction"
  | "game-over"
  | "achievement";

interface Tone {
  frequency: number;
  offset: number;
  duration: number;
  type: OscillatorType;
  peak: number;
}

const MUSIC_URL = `${import.meta.env.BASE_URL}music/retro-arcade.mp3`;

const CUES: Record<SoundCue, readonly Tone[]> = {
  add: [
    { frequency: 640, offset: 0, duration: 0.09, type: "sine", peak: 0.05 },
  ],
  pour: [
    { frequency: 420, offset: 0, duration: 0.12, type: "triangle", peak: 0.05 },
    {
      frequency: 240,
      offset: 0.08,
      duration: 0.16,
      type: "triangle",
      peak: 0.04,
    },
  ],
  success: [
    { frequency: 523, offset: 0, duration: 0.12, type: "sine", peak: 0.06 },
    { frequency: 659, offset: 0.1, duration: 0.12, type: "sine", peak: 0.06 },
    { frequency: 784, offset: 0.2, duration: 0.18, type: "sine", peak: 0.06 },
  ],
  failure: [
    { frequency: 196, offset: 0, duration: 0.22, type: "square", peak: 0.03 },
  ],
  reaction: [
    { frequency: 880, offset: 0, duration: 0.14, type: "sine", peak: 0.04 },
    {
      frequency: 1320,
      offset: 0.06,
      duration: 0.16,
      type: "triangle",
      peak: 0.03,
    },
  ],
  "game-over": [
    { frequency: 392, offset: 0, duration: 0.18, type: "sine", peak: 0.05 },
    { frequency: 311, offset: 0.16, duration: 0.18, type: "sine", peak: 0.05 },
    {
      frequency: 233,
      offset: 0.32,
      duration: 0.28,
      type: "triangle",
      peak: 0.05,
    },
  ],
  achievement: [
    { frequency: 784, offset: 0, duration: 0.1, type: "sine", peak: 0.05 },
    { frequency: 988, offset: 0.09, duration: 0.1, type: "sine", peak: 0.05 },
    { frequency: 1318, offset: 0.18, duration: 0.2, type: "sine", peak: 0.05 },
  ],
};

export interface GameAudio {
  unlock: () => void;
  play: (cue: SoundCue) => void;
  settings: () => AudioSettings;
  toggle: (key: keyof AudioSettings) => AudioSettings;
}

export function createGameAudio(
  initial: AudioSettings = loadAudioSettings(),
): GameAudio {
  let settings = initial;
  let context: AudioContext | null = null;
  let music: HTMLAudioElement | null = null;
  let nextStart = 0;

  const ensure = (): AudioContext | null => {
    if (!context) {
      context = new AudioContext();
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    return context;
  };

  const ensureMusic = (): HTMLAudioElement => {
    if (music) {
      return music;
    }

    const track = new Audio(MUSIC_URL);
    track.loop = true;
    track.preload = "auto";
    track.volume = 0.35;
    music = track;
    return track;
  };

  const syncMusic = (): void => {
    if (!settings.music) {
      music?.pause();
      return;
    }

    const track = ensureMusic();
    void track.play().catch(() => undefined);
  };

  const playTone = (ctx: AudioContext, tone: Tone, start: number): void => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + tone.duration + 0.02);
  };

  return {
    unlock(): void {
      ensure();
      syncMusic();
    },
    play(cue: SoundCue): void {
      if (!settings.effects) {
        return;
      }

      const ctx = ensure();
      if (!ctx) {
        return;
      }

      const tones = CUES[cue];
      const start = Math.max(ctx.currentTime, nextStart);
      let end = start;
      for (const tone of tones) {
        playTone(ctx, tone, start + tone.offset);
        end = Math.max(end, start + tone.offset + tone.duration);
      }
      nextStart = end;
    },
    settings(): AudioSettings {
      return settings;
    },
    toggle(key: keyof AudioSettings): AudioSettings {
      const next = { ...settings, [key]: !settings[key] };
      if (!saveAudioSettings(next)) {
        return settings;
      }

      settings = next;
      if (key === "music") {
        syncMusic();
      }
      return settings;
    },
  };
}
