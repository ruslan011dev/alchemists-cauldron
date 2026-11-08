import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canUseTheme, isThemeId, resolveTheme } from "./theme";

describe("themes", () => {
  it("recognizes only the three theme ids", () => {
    assert.equal(isThemeId("classic"), true);
    assert.equal(isThemeId("night-lab"), true);
    assert.equal(isThemeId("parchment"), true);
    assert.equal(isThemeId("gold"), false);
    assert.equal(isThemeId(null), false);
  });

  it("keeps every theme available before any unlock", () => {
    assert.equal(canUseTheme("classic"), true);
    assert.equal(canUseTheme("night-lab"), true);
    assert.equal(canUseTheme("parchment"), true);
    assert.equal(resolveTheme(null), "classic");
    assert.equal(resolveTheme("night-lab"), "night-lab");
    assert.equal(resolveTheme("parchment"), "parchment");
  });

  it("falls back when the saved value is unknown", () => {
    assert.equal(resolveTheme("arcade"), "classic");
  });
});
