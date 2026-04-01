import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

type Props = {
  dams: Dam[];
  weatherMap?: Map<string, DamWeather>;
  center?: [number, number];
  zoom?: number;
  className?: string;
  singleMarker?: boolean;
};

const JAPAN_CENTER: [number, number] = [36.5, 137.0];
const JAPAN_ZOOM = 5;

function MapBoundsUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function MapView({
  dams,
  weatherMap,
  center = JAPAN_CENTER,
  zoom = JAPAN_ZOOM,
  className = "",
  singleMarker = false,
}: Props) {
  const markers = dams.map((dam) => (
    <Marker key={dam.id} position={[dam.latitude, dam.longitude]}>
      <Popup>
        <DamMarkerPopup dam={dam} weather={weatherMap?.get(dam.id)} />
      </Popup>
    </Marker>
  ));

  return (
    <MapContainer center={center} zoom={zoom} className={`z-0 ${className}`} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBoundsUpdater center={center} zoom={zoom} />
      {singleMarker ? markers : <MarkerClusterGroup chunkedLoading>{markers}</MarkerClusterGroup>}
    </MapContainer>
  );
}
