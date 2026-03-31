export interface WeatherCodeInfo {
  label: string;
  iconName: string;
}

export const weatherCodes: Record<number, WeatherCodeInfo> = {
  0: { label: "快晴", iconName: "clear-day" },
  1: { label: "晴れ", iconName: "clear-day" },
  2: { label: "一部曇り", iconName: "partly-cloudy-day" },
  3: { label: "曇り", iconName: "overcast" },
  45: { label: "霧", iconName: "fog" },
  48: { label: "着氷性の霧", iconName: "fog" },
  51: { label: "弱い霧雨", iconName: "drizzle" },
  53: { label: "霧雨", iconName: "drizzle" },
  55: { label: "強い霧雨", iconName: "drizzle" },
  56: { label: "弱い着氷性霧雨", iconName: "drizzle" },
  57: { label: "強い着氷性霧雨", iconName: "drizzle" },
  61: { label: "弱い雨", iconName: "rain" },
  63: { label: "雨", iconName: "rain" },
  65: { label: "強い雨", iconName: "rain" },
  66: { label: "弱い着氷性の雨", iconName: "rain" },
  67: { label: "強い着氷性の雨", iconName: "rain" },
  71: { label: "弱い雪", iconName: "snow" },
  73: { label: "雪", iconName: "snow" },
  75: { label: "強い雪", iconName: "snow" },
  77: { label: "霧雪", iconName: "snow" },
  80: { label: "弱いにわか雨", iconName: "partly-cloudy-day-rain" },
  81: { label: "にわか雨", iconName: "rain" },
  82: { label: "激しいにわか雨", iconName: "rain" },
  85: { label: "弱いにわか雪", iconName: "partly-cloudy-day-snow" },
  86: { label: "強いにわか雪", iconName: "snow" },
  95: { label: "雷雨", iconName: "thunderstorms" },
  96: { label: "雹を伴う雷雨", iconName: "thunderstorms-rain" },
  99: { label: "激しい雹を伴う雷雨", iconName: "thunderstorms-rain" },
};

const FALLBACK_WEATHER_INFO: WeatherCodeInfo = {
  label: "不明",
  iconName: "not-available",
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return weatherCodes[code] ?? FALLBACK_WEATHER_INFO;
}

export function getWeatherIconUrl(iconName: string): string {
  return `/icons/weather/${iconName}.svg`;
}
