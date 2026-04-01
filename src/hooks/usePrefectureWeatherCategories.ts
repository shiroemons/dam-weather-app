import { useQueries } from "@tanstack/react-query";

import { PREFECTURES } from "@/data/prefectures";
import { getWeatherCategory } from "@/lib/weatherColors";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { PrefectureWeather } from "@/types/weather";

const STALE_TIME = 30 * 60 * 1000;

function getDominantCategory(weather: PrefectureWeather): WeatherCategory {
  const counts: Record<WeatherCategory, number> = {
    sunny: 0,
    cloudy: 0,
    rain: 0,
    snow: 0,
    default: 0,
  };

  for (const dam of weather.dams) {
    const category = getWeatherCategory(dam.today.weatherCode);
    counts[category]++;
  }

  let dominant: WeatherCategory = "default";
  let maxCount = 0;
  for (const [category, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = category as WeatherCategory;
    }
  }

  return dominant;
}

export function usePrefectureWeatherCategories(): Record<string, WeatherCategory> {
  const results = useQueries({
    queries: PREFECTURES.map((p) => ({
      queryKey: ["weather", p.slug],
      queryFn: async () => {
        const response = await fetch(`/weather/${p.slug}.json`);
        return response.json() as Promise<PrefectureWeather>;
      },
      staleTime: STALE_TIME,
    })),
  });

  const categories: Record<string, WeatherCategory> = {};
  for (let i = 0; i < PREFECTURES.length; i++) {
    const result = results[i];
    if (result.data) {
      categories[PREFECTURES[i].slug] = getDominantCategory(result.data);
    }
  }

  return categories;
}
