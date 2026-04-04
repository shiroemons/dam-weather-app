import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import DamMarkerPopup from "./DamMarkerPopup";
import type { Dam } from "@/types/dam";
import type { DamWeather } from "@/types/weather";

// Fix Leaflet default marker icon paths (known bundler issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type PrefectureSummary = {
  slug: string;
  name: string;
  center: [number, number];
  damCount: number;
};

type Props = {
  dams: Dam[];
  weatherMap?: Map<string, DamWeather>;
  center?: [number, number];
  zoom?: number;
  bounds?: L.LatLngBoundsExpression;
  className?: string;
  singleMarker?: boolean;
  prefectureSummaries?: PrefectureSummary[];
  onPrefectureClick?: (slug: string) => void;
  updatedAt?: string | null;
};

const JAPAN_CENTER: [number, number] = [36.5, 137.0];
const JAPAN_ZOOM = 5;

function getBadgeColor(count: number): string {
  if (count >= 150) return "#dc2626";
  if (count >= 100) return "#ea580c";
  if (count >= 50) return "#ca8a04";
  if (count >= 20) return "#16a34a";
  return "#2563eb";
}

function createPrefectureIcon(name: string, count: number): L.DivIcon {
  const color = getBadgeColor(count);
  const size = count >= 100 ? 44 : count >= 50 ? 40 : 36;
  return L.divIcon({
    className: "",
    iconSize: [size, size + 16],
    iconAnchor: [size / 2, (size + 16) / 2],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${size >= 44 ? 14 : 12}px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">
          ${count}
        </div>
        <div style="font-size:10px;font-weight:600;color:#374151;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;margin-top:2px;white-space:nowrap;">
          ${name}
        </div>
      </div>
    `,
  });
}

function ZoomLevelWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

function MapBoundsUpdater({
  center,
  zoom,
  bounds,
}: {
  center: [number, number];
  zoom: number;
  bounds?: L.LatLngBoundsExpression;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    } else {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, bounds]);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  const color = getBadgeColor(count);
  const size = count >= 100 ? 44 : count >= 50 ? 40 : 36;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${size >= 44 ? 14 : 12}px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">
        ${count}
      </div>
    `,
  });
}

export default function MapView({
  dams,
  weatherMap,
  center = JAPAN_CENTER,
  zoom = JAPAN_ZOOM,
  bounds,
  className = "",
  singleMarker = false,
  prefectureSummaries,
  onPrefectureClick,
  updatedAt,
}: Props) {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const showPrefecturePins =
    prefectureSummaries != null && prefectureSummaries.length > 0 && currentZoom <= 7;

  const markers = dams.map((dam) => (
    <Marker key={dam.id} position={[dam.latitude, dam.longitude]}>
      <Popup>
        <DamMarkerPopup dam={dam} weather={weatherMap?.get(dam.id)} updatedAt={updatedAt} />
      </Popup>
    </Marker>
  ));

  return (
    <MapContainer center={center} zoom={zoom} className={`z-0 ${className}`} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBoundsUpdater center={center} zoom={zoom} bounds={bounds} />
      <ZoomLevelWatcher onZoomChange={setCurrentZoom} />
      {showPrefecturePins ? (
        prefectureSummaries.map((ps) => (
          <Marker
            key={ps.slug}
            position={ps.center}
            icon={createPrefectureIcon(ps.name, ps.damCount)}
            eventHandlers={
              onPrefectureClick ? { click: () => onPrefectureClick(ps.slug) } : undefined
            }
          />
        ))
      ) : singleMarker ? (
        markers
      ) : (
        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
          {markers}
        </MarkerClusterGroup>
      )}
    </MapContainer>
  );
}
