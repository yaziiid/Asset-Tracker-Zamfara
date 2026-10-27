import { createRemoteJWKSet, jwtVerify } from "jose";
const keys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);
const reply = (status, body) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export function makeHandler({
  env = process.env,
  fetcher = fetch,
  verify = jwtVerify,
} = {}) {
  return async function handler(request) {
    if (request.method !== "POST") return reply(405, { error: "Use POST." });
    const project = env.VITE_FIREBASE_PROJECT_ID;
    if (!project || !env.GOOGLE_GEOCODING_API_KEY)
      return reply(503, {
        error:
          "Automatic geocoding is not configured. Enter verified coordinates manually.",
      });
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) return reply(401, { error: "Sign in to find coordinates." });
    let payload;
    try {
      ({ payload } = await verify(token, keys, {
        issuer: `https://securetoken.google.com/${project}`,
        audience: project,
        algorithms: ["RS256"],
      }));
      if (
        !payload.sub ||
        typeof payload.sub !== "string" ||
        payload.sub.length > 128 ||
        /[/\s]/.test(payload.sub) ||
        payload.email_verified !== true
      )
        throw new Error("Invalid account");
    } catch {
      return reply(401, { error: "Your session has expired. Sign in again." });
    }
    try {
      // REST uses the caller's Firebase ID token, so Firestore rules also enforce access.
      const membership = await fetcher(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/members/${encodeURIComponent(payload.sub)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!membership.ok)
        return reply(403, { error: "Workspace editor access is required." });
      const member = await membership.json();
      if (!["admin", "editor"].includes(member.fields?.role?.stringValue))
        return reply(403, { error: "Workspace editor access is required." });
      if (Number(request.headers.get("content-length") || 0) > 4096)
        return reply(413, { error: "Request is too large." });
      const body = await request.text();
      if (body.length > 4096)
        return reply(413, { error: "Request is too large." });
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        return reply(400, { error: "Invalid request." });
      }
      const address =
        typeof data?.address === "string" ? data.address.trim() : "";
      if (address.length < 5 || address.length > 500)
        return reply(400, {
          error: "Enter a full address of 5–500 characters.",
        });
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("address", address);
      url.searchParams.set("key", env.GOOGLE_GEOCODING_API_KEY);
      url.searchParams.set("region", "ng");
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Geocoding provider failed");
      const result = await response.json();
      const location = result.results?.[0]?.geometry?.location;
      if (
        result.status !== "OK" ||
        !Number.isFinite(location?.lat) ||
        !Number.isFinite(location?.lng)
      )
        return reply(422, {
          error:
            "No location found. Check the address or enter coordinates manually.",
        });
      return reply(200, { latitude: location.lat, longitude: location.lng });
    } catch {
      return reply(502, {
        error:
          "The location service is unavailable. Try again or enter coordinates manually.",
      });
    }
  };
}
export default makeHandler();
export const config = {
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
