import { test } from "node:test";
import assert from "node:assert/strict";
import { makeHandler } from "../netlify/functions/geocode.mjs";
const env = {
  VITE_FIREBASE_PROJECT_ID: "test",
  GOOGLE_GEOCODING_API_KEY: "server-only",
};
const request = (data = { address: "Gusau, Zamfara" }, token = "test-token") =>
  new Request("https://example.com/api/geocode", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(data),
  });
const verify = async () => ({
  payload: { sub: "editor1", email_verified: true },
});
test("geocoding fails closed without configuration or token", async () => {
  assert.equal((await makeHandler({ env: {} })(request())).status, 503);
  assert.equal((await makeHandler({ env })(request({}, ""))).status, 401);
});
test("invalid tokens and unverified users cannot reach provider", async () => {
  for (const verifier of [
    async () => {
      throw new Error("bad");
    },
    async () => ({ payload: { sub: "u", email_verified: false } }),
  ]) {
    const result = await makeHandler({
      env,
      verify: verifier,
      fetcher: () => {
        throw new Error("must not fetch");
      },
    })(request());
    assert.equal(result.status, 401);
  }
});
test("viewers and users without membership cannot geocode", async () => {
  for (const fetcher of [
    async () => new Response("{}", { status: 403 }),
    async () => Response.json({ fields: { role: { stringValue: "viewer" } } }),
  ])
    assert.equal(
      (await makeHandler({ env, verify, fetcher })(request())).status,
      403,
    );
});
test("only validated editor requests reach Google; secret is not returned", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push([String(url), options]);
    return calls.length === 1
      ? Response.json({ fields: { role: { stringValue: "editor" } } })
      : Response.json({
          status: "OK",
          results: [{ geometry: { location: { lat: 12.16, lng: 6.66 } } }],
        });
  };
  const response = await makeHandler({ env, verify, fetcher })(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { latitude: 12.16, longitude: 6.66 });
  assert.equal(calls[0][1].headers.Authorization, "Bearer test-token");
  assert.match(calls[1][0], /key=server-only/);
});
test("invalid address never reaches Google", async () => {
  let calls = 0;
  const response = await makeHandler({
    env,
    verify,
    fetcher: async () => {
      calls++;
      return Response.json({ fields: { role: { stringValue: "editor" } } });
    },
  })(request({ address: "" }));
  assert.equal(response.status, 400);
  assert.equal(calls, 1);
});
