import { test } from "node:test";
import assert from "node:assert/strict";
import { validMapPoints } from "../src/ui-preferences.mjs";
test("map only uses finite geographic coordinates and preserves record identity", () => {
  const origin = { id: "origin", latitude: 0, longitude: 0 };
  const rows = [
    origin,
    { latitude: 91, longitude: 3 },
    { latitude: 10, longitude: -181 },
    { latitude: "10", longitude: 3 },
    { latitude: null, longitude: 3 },
    { latitude: NaN, longitude: 5 },
  ];
  assert.deepEqual(validMapPoints(rows), [origin]);
  assert.equal(validMapPoints(rows)[0], origin);
});
test("Maps authentication failures stay visible when returning to the map", async () => {
  const originalWindow = globalThis.window;
  const maps = { Map: function Map() {} };
  const events = [];
  globalThis.window = {
    google: { maps },
    dispatchEvent: (event) => events.push(event.type),
  };
  try {
    const { loadGoogleMaps } = await import("../src/google-maps.mjs");
    assert.equal(await loadGoogleMaps("test-only-key"), maps);
    window.gm_authFailure();
    assert.deepEqual(events, ["save80:maps-auth-error"]);
    await assert.rejects(loadGoogleMaps("test-only-key"), /administrator/);
  } finally {
    globalThis.window = originalWindow;
  }
});
