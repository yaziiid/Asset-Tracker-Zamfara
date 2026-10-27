import { test } from "node:test";
import assert from "node:assert/strict";
import { createVerificationSender } from "../src/verification.mjs";

const user = { uid: "verification-test" };
function setup(deliver) {
  let clock = 10_000;
  const stored = new Map();
  const updates = [];
  const options = {
    deliver,
    now: () => clock,
    storage: {
      getItem: (key) => stored.get(key),
      setItem: (key, value) => stored.set(key, value),
    },
    onChange: (state) => updates.push(state),
  };
  return {
    options,
    updates,
    advance: (ms) => {
      clock += ms;
    },
    sender: createVerificationSender(options),
  };
}
test("verification results reach the parent after the signup screen has gone", async () => {
  let reject;
  const pending = new Promise((_, fail) => {
    reject = fail;
  });
  const { sender, updates } = setup(() => pending);
  const request = sender.send(user);
  assert.equal(updates.at(-1).busy, true);
  reject({ code: "auth/too-many-requests" });
  assert.equal(await request, false);
  assert.equal(updates.at(-1).uid, user.uid);
  assert.match(updates.at(-1).error, /temporarily limited/);
  assert.equal(updates.at(-1).busy, false);
  assert.equal(updates.at(-1).status, undefined);
});
test("repeat clicks and a page reload cannot immediately resend an email", async () => {
  let calls = 0;
  let finish;
  const promise = new Promise((resolve) => {
    finish = resolve;
  });
  const { sender, options, advance } = setup(() => {
    calls++;
    return promise;
  });
  const first = sender.send(user);
  assert.equal(await sender.send(user), false);
  finish();
  assert.equal(await first, true);
  const reloaded = createVerificationSender(options);
  assert.equal(await reloaded.send(user), false);
  assert.equal(calls, 1);
  advance(60_001);
  assert.equal(await reloaded.send(user), true);
  assert.equal(calls, 2);
});
test("throttled requests get a longer delay and never report success", async () => {
  let calls = 0;
  const { sender, updates, advance } = setup(async () => {
    calls++;
    throw { code: "auth/too-many-requests" };
  });
  assert.equal(await sender.send(user), false);
  advance(60_001);
  assert.equal(await sender.send(user), false);
  assert.equal(calls, 1);
  advance(240_000);
  assert.equal(await sender.send(user), false);
  assert.equal(calls, 2);
  assert.ok(updates.every((state) => !state.status));
});
