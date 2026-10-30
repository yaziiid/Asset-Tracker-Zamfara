export function normalizeRecord(input, now = new Date()) {
  const field = (key, min, max) => {
    const labels = {
      name: "Recipient name",
      address: "Delivery address",
      phone: "Phone",
      project: "Product ID",
      state: "State / region",
    };
    const value = String(input[key] ?? "").trim();
    if (value.length < min || value.length > max)
      throw new Error(`${labels[key] || key}: use ${min}–${max} characters.`);
    return value;
  };
  const coordinate = (key, bound) => {
    if (input[key] == null || String(input[key]).trim() === "")
      throw new Error(`Enter ${key} or use Find coordinates.`);
    const value = Number(input[key]);
    if (!Number.isFinite(value) || Math.abs(value) > bound)
      throw new Error(`${key} must be between -${bound} and ${bound}.`);
    return value;
  };
  const assetCount = Number(input.assetCount ?? 1);
  if (
    !Number.isSafeInteger(assetCount) ||
    assetCount < 0 ||
    assetCount > 1000000
  )
    throw new Error("Stove count must be a whole number from 0 to 1,000,000.");
  return {
    name: field("name", 2, 120),
    address: field("address", 5, 500),
    phone: field("phone", 0, 30),
    project: field("project", 1, 120),
    state: field("state", 2, 80),
    latitude: coordinate("latitude", 90),
    longitude: coordinate("longitude", 180),
    assetCount,
    date: now.toISOString().slice(0, 10),
  };
}
export function filterRecords(records, search, state, sort = "newest") {
  const term = search.trim().toLocaleLowerCase();
  const result = records.filter(
    (r) =>
      (!state || r.state === state) &&
      [r.project, r.name, r.address, r.phone, r.state].some((v) =>
        String(v ?? "")
          .toLocaleLowerCase()
          .includes(term),
      ),
  );
  return result.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "project"
        ? a.project.localeCompare(b.project)
        : String(b.date).localeCompare(String(a.date)) ||
          a.id.localeCompare(b.id),
  );
}
export function recordsToCsv(records) {
  const columns = [
    "name",
    "address",
    "phone",
    "project",
    "latitude",
    "longitude",
    "state",
    "assetCount",
    "date",
  ];
  const cell = (value) => {
    let text = String(value ?? "");
    // Prevent spreadsheet formulas in user-controlled text, including leading whitespace.
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      [
        "recipient_name",
        "delivery_address",
        "phone",
        "product_id",
        "latitude",
        "longitude",
        "state_or_region",
        "stove_count",
        "registered_date",
      ]
        .map(cell)
        .join(","),
      ...records.map((row) =>
        columns.map((key) => cell(key === "date" ? "" : row[key])).join(","),
      ),
    ].join("\r\n")
  );
}
export function legacyRecord(row) {
  const data = normalizeRecord({
    ...row,
    project: row.project ?? row.nin,
    assetCount: row.assetCount ?? row.asset_count ?? 1,
  });
  if (row.date) {
    const date = String(row.date).slice(0, 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      throw new Error("Invalid legacy date.");
    data.date = date;
  }
  return data;
}

// Exact product IDs are preserved, including leading zeroes and punctuation.
export async function productDocumentId(productId) {
  const value = String(productId ?? "").trim();
  if (!value || value.length > 120)
    throw new Error(
      "Enter the Product ID printed on the stove (1–120 characters).",
    );
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return (
    "stove-" +
    [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}
