const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];
// Vite also loads .env files. Check using its loader so local and hosted builds agree.
const { loadEnv } = await import("vite");
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const missing = required.filter((key) => !env[key]?.trim());
if (missing.length) {
  console.error(
    `Missing Firebase configuration: ${missing.join(", ")}. Set these before deploying.`,
  );
  process.exit(1);
}
