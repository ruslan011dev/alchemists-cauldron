import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultAudioSettings, isAudioSettings } from "./audio-settings";

describe("audio settings", () => {
  it("starts with music off and effects on", () => {
    assert.deepEqual(defaultAudioSettings(), { music: false, effects: true });
  });

  it("accepts a complete settings object", () => {
    assert.equal(isAudioSettings({ music: true, effects: false }), true);
    assert.equal(isAudioSettings({ music: false, effects: false }), true);
  });

  it("rejects a partial or broken settings object", () => {
    assert.equal(isAudioSettings(null), false);
    assert.equal(isAudioSettings({ music: true }), false);
    assert.equal(isAudioSettings({ music: "yes", effects: true }), false);
    assert.equal(isAudioSettings([]), false);
  });
});
