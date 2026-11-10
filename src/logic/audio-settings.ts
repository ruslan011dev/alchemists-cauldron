export interface AudioSettings {
  music: boolean;
  effects: boolean;
}

export function defaultAudioSettings(): AudioSettings {
  return {
    music: false,
    effects: true,
  };
}

export function isAudioSettings(value: unknown): value is AudioSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as { music?: unknown; effects?: unknown };
  return (
    typeof record.music === "boolean" && typeof record.effects === "boolean"
  );
}
