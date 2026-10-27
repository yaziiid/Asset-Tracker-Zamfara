import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default function AssetMap({ records, selected, onSelect }) {
  const element = useRef(null),
    map = useRef(null),
    layer = useRef(null);
  useEffect(() => {
    map.current = L.map(element.current).setView([12.16, 6.66], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    layer.current.clearLayers();
    const points = records.filter(
      (r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
    );
    for (const r of points) {
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = r.project;
      const detail = document.createElement("p");
      detail.textContent = `${r.name} · ${r.address} · ${r.state}`;
      popup.append(title, detail);
      const marker = L.circleMarker([r.latitude, r.longitude], {
        radius: r.id === selected ? 11 : 7,
        color: "#fff",
        weight: 2,
        fillColor: r.id === selected ? "#df9f34" : "#17674f",
        fillOpacity: 0.95,
      })
        .addTo(layer.current)
        .bindPopup(popup);
      marker.on("click", () => onSelect(r.id));
      if (r.id === selected) marker.openPopup();
    }
    const active = points.find((r) => r.id === selected);
    if (active) map.current.setView([active.latitude, active.longitude], 12);
    else if (points.length)
      map.current.fitBounds(
        L.latLngBounds(points.map((r) => [r.latitude, r.longitude])),
        { padding: [45, 45], maxZoom: 11 },
      );
    else map.current.setView([12.16, 6.66], 7);
    map.current.invalidateSize();
  }, [records, selected, onSelect]);
  return (
    <div
      ref={element}
      className="asset-map"
      aria-label="Map of registered assets"
    />
  );
}
