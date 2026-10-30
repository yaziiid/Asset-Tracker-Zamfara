export function readPreference(key, fallback) {
  try {
    return window.localStorage.getItem(`save80:${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writePreference(key, value) {
  try {
    window.localStorage.setItem(`save80:${key}`, String(value));
  } catch {
    /* Preferences still work when browser storage is unavailable. */
  }
}
export function validMapPoints(records) {
  return records.filter(
    (r) =>
      Number.isFinite(r.latitude) &&
      Math.abs(r.latitude) <= 90 &&
      Number.isFinite(r.longitude) &&
      Math.abs(r.longitude) <= 180,
  );
}
