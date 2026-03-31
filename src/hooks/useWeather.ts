import { useQuery } from "@tanstack/react-query";

import type { PrefectureWeather } from "@/types/weather.ts";

const STALE_TIME = 30 * 60 * 1000;

export function useWeather(prefectureSlug: string) {
  return useQuery<PrefectureWeather>({
    queryKey: ["weather", prefectureSlug],
    queryFn: async () => {
      const response = await fetch(`/weather/${prefectureSlug}.json`);
      return response.json() as Promise<PrefectureWeather>;
    },
    staleTime: STALE_TIME,
    enabled: !!prefectureSlug,
  });
}
