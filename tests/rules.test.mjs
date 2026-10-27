import { after, before, beforeEach, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { productDocumentId } from "../src/domain.mjs";
import { readFile } from "node:fs/promises";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-zamfara",
    firestore: { rules: await readFile("firestore.rules", "utf8") },
  });
});
after(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const role of ["admin", "editor", "viewer"])
      await setDoc(doc(ctx.firestore(), "members", role), { role });
    await setDoc(doc(ctx.firestore(), "records", "old"), {
      name: "Existing project",
      createdAt: new Date(),
      date: "2023-01-01",
    });
  });
});
const db = (uid, verified = true) =>
  env.authenticatedContext(uid, { email_verified: verified }).firestore();
const productKey = await productDocumentId("0001");
const record = (uid) => ({
  name: "Council",
  address: "Gusau, Zamfara",
  phone: "",
  project: "0001",
  state: "Zamfara",
  latitude: 12,
  longitude: 6,
  assetCount: 1,
  date: "2026-10-27",
  createdAt: serverTimestamp(),
  createdBy: uid,
});
test("anonymous, unverified and unapproved accounts cannot read records", async () => {
  for (const store of [
    env.unauthenticatedContext().firestore(),
    db("editor", false),
    db("outsider"),
  ])
    await assertFails(getDoc(doc(store, "records", "old")));
});
test("approved roles can read paginated register; only editors and admins create", async () => {
  for (const role of ["admin", "editor", "viewer"]) {
    await assertSucceeds(
      getDocs(
        query(
          collection(db(role), "records"),
          orderBy("createdAt", "desc"),
          orderBy("__name__", "desc"),
          limit(250),
        ),
      ),
    );
    const write = setDoc(doc(db(role), "records", productKey), record(role));
    if (role === "viewer") await assertFails(write);
    else await assertSucceeds(write);
    // use a different document for the next role
    await env.withSecurityRulesDisabled((ctx) =>
      deleteDoc(doc(ctx.firestore(), "records", productKey)),
    );
  }
});
test("clients cannot spoof creator or timestamp, store arbitrary fields, or invalid coordinates", async () => {
  for (const changes of [
    { createdBy: "admin" },
    { createdAt: new Date("2020-01-01") },
    { latitude: 91 },
    { longitude: -181 },
    { assetCount: -1 },
    { assetCount: 1.5 },
    { project: 1 },
    { name: "" },
    { secret: "extra" },
  ])
    await assertFails(
      setDoc(doc(db("editor"), "records", productKey), {
        ...record("editor"),
        ...changes,
      }),
    );
});
test("records are append-only", async () => {
  await assertFails(
    updateDoc(doc(db("admin"), "records", "old"), { name: "Changed" }),
  );
  await assertFails(deleteDoc(doc(db("admin"), "records", "old")));
});
test("users can inspect their own access; only admins can grant roles", async () => {
  await assertSucceeds(getDoc(doc(db("outsider"), "members", "outsider")));
  await assertFails(getDoc(doc(db("editor"), "members", "viewer")));
  await assertFails(
    setDoc(doc(db("outsider"), "members", "outsider"), { role: "admin" }),
  );
  await assertFails(
    setDoc(doc(db("editor"), "members", "other"), { role: "admin" }),
  );
  await assertSucceeds(
    setDoc(doc(db("admin"), "members", "other"), { role: "editor" }),
  );
  await assertFails(
    setDoc(doc(db("admin"), "members", "other"), { role: "owner" }),
  );
  await assertFails(
    setDoc(doc(db("admin"), "members", "other"), {
      role: "editor",
      extra: true,
    }),
  );
  await assertFails(
    setDoc(doc(db("admin"), "members", "admin"), { role: "viewer" }),
  );
  await assertFails(deleteDoc(doc(db("admin"), "members", "admin")));
});
test("no public collection listing, unknown paths or orphaned subcollections", async () => {
  await assertFails(
    getDocs(collection(env.unauthenticatedContext().firestore(), "records")),
  );
  await assertFails(
    setDoc(doc(db("admin"), "unknown", "id"), { role: "admin" }),
  );
  await assertFails(
    getDocs(collection(db("admin"), "records", "old", "private")),
  );
});
test("required omissions, oversized text and arbitrary role changes fail", async () => {
  for (const key of Object.keys(record("editor"))) {
    const r = record("editor");
    delete r[key];
    await assertFails(setDoc(doc(db("editor"), "records", productKey), r));
  }
  for (const key of [
    "name",
    "address",
    "phone",
    "project",
    "state",
    "createdBy",
  ])
    await assertFails(
      setDoc(doc(db("editor"), "records", productKey), {
        ...record("editor"),
        [key]: "x".repeat(10000),
      }),
    );
  await assertFails(
    updateDoc(doc(db("viewer"), "members", "viewer"), { role: "admin" }),
  );
  await assertFails(
    updateDoc(doc(db("editor"), "records", "old"), {
      createdBy: "admin",
      createdAt: new Date(),
      name: "x".repeat(10000),
      extra: true,
    }),
  );
});
test("a Product ID can only be created once, including under simultaneous registrations", async () => {
  const results = await Promise.allSettled([
    setDoc(doc(db("editor"), "records", productKey), record("editor")),
    setDoc(doc(db("admin"), "records", productKey), record("admin")),
  ]);
  if (results.filter((result) => result.status === "fulfilled").length !== 1)
    throw new Error("Exactly one duplicate registration must succeed.");
  await assertFails(
    setDoc(doc(db("editor"), "records", "different-id"), record("editor")),
  );
});
test("new stove registrations cannot group multiple stoves behind one Product ID", async () => {
  await assertFails(
    setDoc(doc(db("editor"), "records", productKey), {
      ...record("editor"),
      assetCount: 2,
    }),
  );
});
