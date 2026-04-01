type WeatherCategory = "sunny" | "cloudy" | "rain" | "snow" | "default";

const WEATHER_CLASSES: Record<WeatherCategory, string> = {
  sunny:
    "from-orange-50 to-amber-50/50 shadow-[6px_6px_12px_#e8d5b8,-6px_-6px_12px_#ffffff] dark:from-orange-950/40 dark:to-amber-950/30 dark:shadow-[6px_6px_12px_#1a1207,-6px_-6px_12px_#2d2010]",
  cloudy:
    "from-gray-100 to-slate-50 shadow-[6px_6px_12px_#c8ccd0,-6px_-6px_12px_#ffffff] dark:from-gray-800 dark:to-slate-800 dark:shadow-[6px_6px_12px_#1a1a1a,-6px_-6px_12px_#2a2a2a]",
  rain: "from-blue-50 to-sky-50/50 shadow-[6px_6px_12px_#b8cce8,-6px_-6px_12px_#ffffff] dark:from-blue-950/40 dark:to-sky-950/30 dark:shadow-[6px_6px_12px_#0a1220,-6px_-6px_12px_#152030]",
  snow: "from-sky-50 to-blue-50/30 shadow-[6px_6px_12px_#c8d8e8,-6px_-6px_12px_#ffffff] dark:from-sky-950/30 dark:to-blue-950/20 dark:shadow-[6px_6px_12px_#0d1520,-6px_-6px_12px_#182530]",
  default:
    "from-gray-50 to-white shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] dark:from-gray-800 dark:to-gray-700 dark:shadow-[6px_6px_12px_#1a1a1a,-6px_-6px_12px_#2a2a2a]",
};

function getWeatherCategory(code: number): WeatherCategory {
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
