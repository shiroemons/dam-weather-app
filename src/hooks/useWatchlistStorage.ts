import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getDamById } from "@/hooks/useAllDams";
import type { DamStorage, PrefectureStorage } from "@/types/storage";

const STALE_TIME = 30 * 60 * 1000;

export function useWatchlistStorage(damIds: string[]) {
  // 1. Determine unique prefecture slugs from damIds
  const prefectureSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const damId of damIds) {
      const dam = getDamById(damId);
      if (dam) slugs.add(dam.prefectureSlug);
    }
    return [...slugs];
  }, [damIds]);

  // 2. Fetch storage for only needed prefectures using useQueries
  const storageQueries = useQueries({
    queries: prefectureSlugs.map((slug) => ({
      queryKey: ["storage", slug],
      queryFn: async (): Promise<PrefectureStorage> => {
        const res = await fetch(`/storage/${slug}.json`);
        return res.json() as Promise<PrefectureStorage>;
      },
      staleTime: STALE_TIME,
    })),
  });

  const isLoading = storageQueries.some((q) => q.isLoading);

  // 3. Build a Map<damId, DamStorage> filtered to only the requested dams
  const storageMap = useMemo(() => {
    const damIdSet = new Set(damIds);
    const map = new Map<string, DamStorage>();
    for (const query of storageQueries) {
      if (query.data) {
        for (const ds of query.data.dams) {
          if (damIdSet.has(ds.damId)) {
            map.set(ds.damId, ds);
          }
        }
      }
    }
    return map;
  }, [damIds, storageQueries]);

  const updatedAt = useMemo(() => {
    let latest = "";
    for (const query of storageQueries) {
      if (query.data?.updatedAt && query.data.updatedAt > latest) {
        latest = query.data.updatedAt;
      }
    }
    return latest || null;
  }, [storageQueries]);

  return { storageMap, isLoading, updatedAt };
}
