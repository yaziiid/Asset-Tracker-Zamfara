let loading;
let authenticationFailed = false;
let authHandlerInstalled = false;
export function loadGoogleMaps(apiKey) {
  if (!authHandlerInstalled) {
    const previousFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      authenticationFailed = true;
      window.dispatchEvent(new Event("save80:maps-auth-error"));
      previousFailure?.();
    };
    authHandlerInstalled = true;
  }
  if (authenticationFailed)
    return Promise.reject(
      new Error(
        "Google Maps is unavailable. Please ask your programme administrator to check the map service.",
      ),
    );
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!apiKey)
    return Promise.reject(
      new Error(
        "Map configuration is unavailable. Please contact your programme administrator.",
      ),
    );
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      delete window.__save80MapsReady;
      script.remove();
      loading = undefined;
      reject(
        new Error(
          "Google Maps could not be loaded. Check your connection and try again.",
        ),
      );
    };
    const timer = setTimeout(fail, 20000);
    window.__save80MapsReady = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      delete window.__save80MapsReady;
      resolve(window.google.maps);
    };
    script.src =
      "https://maps.googleapis.com/maps/api/js?" +
      new URLSearchParams({
        key: apiKey,
        callback: "__save80MapsReady",
        loading: "async",
        v: "quarterly",
      });
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return loading;
}
export const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d2c2a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b8cbbf" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d2c2a" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#62736a" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#263f32" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#3d4e43" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#66765b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#112a36" }],
  },
];

// Keep geographic context while removing Google's venue and transport markers.
const stoveOnlyStyles = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];
export function mapStyles(theme) {
  return [...(theme === "dark" ? darkMapStyles : []), ...stoveOnlyStyles];
}
