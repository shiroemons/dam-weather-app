import { getWeatherCategory } from "@/lib/weatherColors";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { PrefectureWeather } from "@/types/weather";

/**
 * PrefectureWeather から天気分布を取得する。
 * distribution フィールドがあればそれを返し、なければ dams から再計算する。
 */
export function getDistribution(weather: PrefectureWeather): Record<WeatherCategory, number> {
  if (weather.distribution) return weather.distribution;
  const counts: Record<WeatherCategory, number> = {
    sunny: 0,
    cloudy: 0,
    rain: 0,
    snow: 0,
    default: 0,
  };
  for (const dam of weather.dams) {
    counts[getWeatherCategory(dam.today.weatherCode)]++;
  }
  return counts;
}
