const DEFAULT_RADAR_ZOOM = 14;

export function getYahooRadarUrl(
  lat: number,
  lon: number,
  zoom: number = DEFAULT_RADAR_ZOOM,
): string {
  return `https://weather.yahoo.co.jp/weather/zoomradar/?lat=${lat}&lon=${lon}&z=${zoom}`;
}
