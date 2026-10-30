import { useEffect, useRef, useState } from "react";
import { Layers, LocateFixed, LoaderCircle } from "lucide-react";
import { loadGoogleMaps, darkMapStyles } from "./google-maps.mjs";
import {
  readPreference,
  writePreference,
  validMapPoints,
} from "./ui-preferences.mjs";
export default function AssetMap({ records, selected, onSelect, theme }) {
  const element = useRef(null),
    map = useRef(null),
    markers = useRef([]),
    fitPoints = useRef(() => {});
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [mapType, setMapType] = useState(() =>
    readPreference("map-type", "hybrid") === "roadmap" ? "roadmap" : "hybrid",
  );
  const latest = useRef({ theme, mapType });
  latest.current = { theme, mapType };
  useEffect(() => {
    let cancelled = false;
    setError("");
    const authFailed = () =>
      setError(
        "Google Maps is unavailable. Please ask your programme administrator to check the map service.",
      );
    window.addEventListener("save80:maps-auth-error", authFailed);
    loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
      .then((maps) => {
        if (cancelled) return;
        map.current = new maps.Map(element.current, {
          center: { lat: 9.08, lng: 8.68 },
          zoom: 6,
          mapTypeId: latest.current.mapType,
          styles: latest.current.theme === "dark" ? darkMapStyles : [],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          fullscreenControlOptions: {
            position: maps.ControlPosition.RIGHT_BOTTOM,
          },
          zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
        });
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      window.removeEventListener("save80:maps-auth-error", authFailed);
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      if (map.current)
        window.google?.maps?.event.clearInstanceListeners(map.current);
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setOptions({
      mapTypeId: mapType,
      styles: theme === "dark" ? darkMapStyles : [],
    });
    writePreference("map-type", mapType);
  }, [mapType, theme, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const maps = window.google.maps;
    class HouseholdMarker extends maps.OverlayView {
      constructor(record) {
        super();
        this.record = record;
        this.element = document.createElement("button");
        this.element.className = "household-marker";
        this.element.type = "button";
        this.element.title = `${record.project} · ${record.name}`;
        this.element.setAttribute(
          "aria-label",
          `Select ${record.project}, ${record.name}`,
        );
        this.element.onclick = () => onSelect(record.id);
      }
      onAdd() {
        this.getPanes().overlayMouseTarget.append(this.element);
        maps.OverlayView.preventMapHitsAndGesturesFrom(this.element);
      }
      draw() {
        const pixel = this.getProjection()?.fromLatLngToDivPixel(
          new maps.LatLng(this.record.latitude, this.record.longitude),
        );
        if (pixel) {
          this.element.style.left = pixel.x + "px";
          this.element.style.top = pixel.y + "px";
        }
      }
      onRemove() {
        this.element.remove();
        this.element.onclick = null;
      }
    }
    markers.current.forEach((marker) => marker.setMap(null));
    const points = validMapPoints(records);
    markers.current = points.map((record) => {
      const marker = new HouseholdMarker(record);
      marker.setMap(map.current);
      return marker;
    });
    fitPoints.current = () => {
      if (!map.current) return;
      if (!points.length) {
        map.current.setCenter({ lat: 9.08, lng: 8.68 });
        map.current.setZoom(6);
      } else if (points.length === 1) {
        map.current.setCenter({
          lat: points[0].latitude,
          lng: points[0].longitude,
        });
        map.current.setZoom(12);
      } else {
        const bounds = new maps.LatLngBounds();
        points.forEach((r) =>
          bounds.extend({ lat: r.latitude, lng: r.longitude }),
        );
        map.current.fitBounds(bounds, {
          top: 100,
          right: 45,
          bottom: 140,
          left: 45,
        });
        maps.event.addListenerOnce(map.current, "idle", () => {
          if (map.current?.getZoom() > 13) map.current.setZoom(13);
        });
      }
    };
    fitPoints.current();
    return () => {
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
    };
  }, [records, ready, onSelect]);
  useEffect(() => {
    if (!ready || !map.current) return;
    for (const marker of markers.current)
      marker.element.classList.toggle(
        "is-selected",
        marker.record.id === selected,
      );
    const active = validMapPoints(records).find((r) => r.id === selected);
    if (active) {
      map.current.panTo({ lat: active.latitude, lng: active.longitude });
      if (map.current.getZoom() < 12) map.current.setZoom(12);
    }
  }, [selected, ready, records]);
  return (
    <div className="google-map-stage">
      <div
        ref={element}
        className="asset-map"
        aria-label="Map of Save80 recipient households"
      />
      {!ready && !error && (
        <div className="map-service-status" role="status">
          <LoaderCircle className="spin" size={22} />
          Loading Google Maps…
        </div>
      )}
      {error && (
        <div className="map-service-status" role="alert">
          <strong>Map unavailable</strong>
          <p>{error}</p>
          <button
            className="secondary"
            onClick={() => {
              setReady(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {ready && !error && (
        <div className="map-layer-controls">
          <div
            className="map-layer-switch"
            role="group"
            aria-label="Map layers"
          >
            <button
              aria-pressed={mapType === "roadmap"}
              onClick={() => setMapType("roadmap")}
            >
              Street
            </button>
            <button
              aria-pressed={mapType === "hybrid"}
              onClick={() => setMapType("hybrid")}
            >
              <Layers size={15} />
              Satellite
            </button>
          </div>
          <button
            className="map-fit-button"
            title="Fit all locations"
            aria-label="Fit all locations"
            onClick={() => fitPoints.current()}
          >
            <LocateFixed size={19} />
          </button>
        </div>
      )}
    </div>
  );
}
