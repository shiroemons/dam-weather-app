import { useQueries } from "@tanstack/react-query";

import { PREFECTURES } from "@/data/prefectures";
import { getDistribution } from "@/lib/weatherUtils";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { PrefectureWeather } from "@/types/weather";

const STALE_TIME = 30 * 60 * 1000;

export type PrefectureWeatherSummary = {
  dominant: WeatherCategory;
  counts: Record<WeatherCategory, number>;
  total: number;
};

function computeWeatherSummary(weather: PrefectureWeather): PrefectureWeatherSummary {
  const counts = getDistribution(weather);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  let dominant: WeatherCategory = "default";
  let maxCount = 0;
  for (const [category, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = category as WeatherCategory;
    }
  }

  return { dominant, counts, total };
}

export function usePrefectureWeatherCategories(): Record<string, PrefectureWeatherSummary> {
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

  const summaries: Record<string, PrefectureWeatherSummary> = {};
  for (let i = 0; i < PREFECTURES.length; i++) {
    const result = results[i];
    if (result.data) {
      summaries[PREFECTURES[i].slug] = computeWeatherSummary(result.data);
    }
  }

  return summaries;
}
