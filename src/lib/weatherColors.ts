export type WeatherCategory = "sunny" | "cloudy" | "rain" | "snow" | "default";

export const WEATHER_CLASSES: Record<WeatherCategory, string> = {
  sunny: "border border-amber-200/60 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20",
  cloudy: "border border-gray-200/60 bg-gray-50/50 dark:border-gray-700/30 dark:bg-gray-800/20",
  rain: "border border-blue-200/60 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20",
  snow: "border border-sky-200/60 bg-sky-50/50 dark:border-sky-800/30 dark:bg-sky-950/20",
  default: "border border-gray-200/60 bg-white/50 dark:border-gray-700/30 dark:bg-gray-800/20",
};

export function getWeatherCategory(code: number): WeatherCategory {
  if (code <= 1) return "sunny";
  if (code <= 3 || code === 45 || code === 48) return "cloudy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99))
    return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  return "default";
}

export function getWeatherCardClasses(code: number | undefined): string {
  if (code === undefined) return WEATHER_CLASSES.default;
  return WEATHER_CLASSES[getWeatherCategory(code)];
}
