import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRecord,
  recordsToCsv,
  filterRecords,
  legacyRecord,
} from "../src/domain.mjs";
const base = {
  name: "Council",
  address: "Gusau, Zamfara, Nigeria",
  project: "00042",
  state: "Zamfara",
  latitude: "0",
  longitude: "0",
  assetCount: "2",
};
test("registration accepts optional phone, zero coordinates and string references", () => {
  const r = normalizeRecord(base, new Date("2026-10-27T12:00:00Z"));
  assert.equal(r.phone, "");
  assert.equal(r.project, "00042");
  assert.equal(r.latitude, 0);
  assert.equal(r.date, "2026-10-27");
  assert.equal(r.assetCount, 2);
});
test("blank, non-finite and out-of-range coordinates are rejected", () => {
  for (const latitude of [
    "",
    " ",
    null,
    undefined,
    "NaN",
    "Infinity",
    "91",
    "-91",
  ])
    assert.throws(() => normalizeRecord({ ...base, latitude }));
  assert.throws(() => normalizeRecord({ ...base, longitude: 181 }));
});
test("invalid counts and empty required strings are rejected", () => {
  for (const assetCount of [-1, 1.5, 1000001, "none"])
    assert.throws(() => normalizeRecord({ ...base, assetCount }));
  for (const key of ["name", "address", "project", "state"])
    assert.throws(() => normalizeRecord({ ...base, [key]: " " }));
});
test("CSV safely quotes cells and blocks formula injection", () => {
  const csv = recordsToCsv([
    { ...base, name: ' =HYPERLINK("bad")', address: "One, Two\nThree" },
  ]);
  assert.ok(csv.includes('"\' =HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"One, Two\nThree"'));
});
test("filtering and sorting retain stable record IDs for map selection", () => {
  const rows = [
    { ...base, id: "first", name: "Zed" },
    { ...base, id: "second", name: "Amy" },
  ];
  const result = filterRecords(rows, "", "", "name");
  assert.equal(result[0].id, "second");
  assert.equal(rows[0].id, "first");
  assert.deepEqual(filterRecords(rows, "amy", "Kano"), []);
});
test("legacy migration maps old fields without losing reference formatting or date", () => {
  const r = legacyRecord({
    ...base,
    project: undefined,
    nin: "0019",
    assetCount: undefined,
    asset_count: 3,
    date: "2023-05-02",
  });
  assert.equal(r.project, "0019");
  assert.equal(r.assetCount, 3);
  assert.equal(r.date, "2023-05-02");
  assert.throws(() => legacyRecord({ ...base, date: "2023-02-31" }));
});
test("product keys preserve printed IDs, support punctuation, and distinguish leading zeroes", async () => {
  const { productDocumentId } = await import("../src/domain.mjs");
  assert.equal(
    await productDocumentId(" 001/S80 "),
    await productDocumentId("001/S80"),
  );
  assert.notEqual(await productDocumentId("001"), await productDocumentId("1"));
  assert.match(await productDocumentId("001/S80"), /^stove-[a-f0-9]{64}$/);
});
