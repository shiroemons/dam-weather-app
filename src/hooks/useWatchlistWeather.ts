import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getDamById } from "@/hooks/useAllDams";
import type { DamWeather, PrefectureWeather } from "@/types/weather";

const STALE_TIME = 30 * 60 * 1000;

export function useWatchlistWeather(damIds: string[]) {
  // 1. Determine unique prefecture slugs from damIds
  const prefectureSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const damId of damIds) {
      const dam = getDamById(damId);
      if (dam) slugs.add(dam.prefectureSlug);
    }
    return [...slugs];
  }, [damIds]);

  // 2. Fetch weather for only needed prefectures using useQueries
  const weatherQueries = useQueries({
    queries: prefectureSlugs.map((slug) => ({
      queryKey: ["weather", slug],
      queryFn: async (): Promise<PrefectureWeather> => {
        const res = await fetch(`/weather/${slug}.json`);
        return res.json() as Promise<PrefectureWeather>;
      },
      staleTime: STALE_TIME,
    })),
  });

  const isLoading = weatherQueries.some((q) => q.isLoading);

  // 3. Build a Map<damId, DamWeather> filtered to only the requested dams
  const weatherMap = useMemo(() => {
    const damIdSet = new Set(damIds);
    const map = new Map<string, DamWeather>();
    for (const query of weatherQueries) {
      if (query.data) {
        for (const dw of query.data.dams) {
          if (damIdSet.has(dw.damId)) {
            map.set(dw.damId, dw);
          }
        }
      }
    }
    return map;
  }, [damIds, weatherQueries]);

  const updatedAt = useMemo(() => {
    let latest = "";
    for (const query of weatherQueries) {
      if (query.data?.updatedAt && query.data.updatedAt > latest) {
        latest = query.data.updatedAt;
      }
    }
    return latest || null;
  }, [weatherQueries]);

  return { weatherMap, isLoading, updatedAt };
}
