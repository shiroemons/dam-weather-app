import damExternalLinks from "@/data/dam-external-links.json";

export interface ExternalLinkItem {
  label: string;
  url: string;
}

const externalLinksMap = damExternalLinks as Record<string, ExternalLinkItem[]>;

export function getDamExternalLinks(damId: string): ExternalLinkItem[] {
  return externalLinksMap[damId] ?? [];
}

const DEFAULT_RADAR_ZOOM = 14;

export function getYahooRadarUrl(
  lat: number,
  lon: number,
  zoom: number = DEFAULT_RADAR_ZOOM,
): string {
  return `https://weather.yahoo.co.jp/weather/zoomradar/?lat=${lat}&lon=${lon}&z=${zoom}`;
}
