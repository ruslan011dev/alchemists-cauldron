import {
  defaultAudioSettings,
  isAudioSettings,
  type AudioSettings,
} from "../logic/audio-settings";

const AUDIO_KEY = "alchemists-cauldron.audio";

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (raw === null) {
      return defaultAudioSettings();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isAudioSettings(parsed)) {
      return defaultAudioSettings();
    }

    return parsed;
  } catch {
    return defaultAudioSettings();
  }
}

export function saveAudioSettings(settings: AudioSettings): boolean {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
