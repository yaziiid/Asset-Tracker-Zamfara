import { readFile } from "node:fs/promises";
import { legacyRecord } from "../src/domain.mjs";
// Dry run is the default. The Admin SDK is loaded only for an explicit write.
const args = process.argv.slice(2),
  input = args.find((x) => !x.startsWith("--"));
const projectId = args.find((x) => x.startsWith("--project="))?.slice(10);
if (!input || !projectId)
  throw new Error(
    "Usage: npm run import:records -- /path/records.json --project=PROJECT_ID [--commit]",
  );
const rows = JSON.parse(await readFile(input, "utf8"));
if (!Array.isArray(rows))
  throw new Error("Input must be an array of exported MySQL customer rows.");
const seen = new Set();
const prepared = rows.map((row, index) => {
  const id = String(row.id ?? "");
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id) || seen.has(id))
    throw new Error(
      `Row ${index + 1}: missing, invalid or duplicate legacy id.`,
    );
  seen.add(id);
  try {
    return { id: `legacy-${id}`, data: legacyRecord(row) };
  } catch (error) {
    throw new Error(`Row ${index + 1}: ${error.message}`);
  }
});
console.log(
  `Validated ${prepared.length} records for project ${projectId}. No private record values are logged.`,
);
if (!args.includes("--commit")) {
  console.log(
    "Dry run only; no database connection or writes. Add --commit after reviewing the target project and validation.",
  );
  process.exit(0);
}
const { initializeApp, applicationDefault } =
  await import("firebase-admin/app");
const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
initializeApp({ credential: applicationDefault(), projectId });
const store = getFirestore();
let created = 0,
  skipped = 0;
for (const row of prepared) {
  const ref = store.collection("records").doc(row.id);
  const existing = await ref.get();
  if (existing.exists) {
    const old = existing.data();
    if (!Object.keys(row.data).every((k) => old[k] === row.data[k]))
      throw new Error(
        `Conflict at ${row.id}; existing record was not overwritten.`,
      );
    skipped++;
    continue;
  }
  await ref.create({
    ...row.data,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "legacy-migration",
  });
  created++;
}
console.log(
  `Completed: ${created} created, ${skipped} identical records skipped. Existing records were not overwritten.`,
);
