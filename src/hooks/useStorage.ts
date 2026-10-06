import { useQuery } from "@tanstack/react-query";

import type { PrefectureStorage } from "@/types/storage.ts";

const STALE_TIME = 30 * 60 * 1000;

export function useStorage(prefectureSlug: string) {
  return useQuery<PrefectureStorage>({
    queryKey: ["storage", prefectureSlug],
    queryFn: async () => {
      const response = await fetch(`/storage/${prefectureSlug}.json`);
      if (!response.ok) throw new Error(`貯水率データの取得に失敗しました (${response.status})`);
      const data = (await response.json()) as PrefectureStorage | null;
      if (
        data?.prefectureSlug !== prefectureSlug ||
        !Array.isArray(data?.dams) ||
        data.dams.some((entry) => !entry || typeof entry.damId !== "string")
      ) {
        throw new Error("貯水率データの形式が正しくありません");
      }
      return data;
    },
    staleTime: STALE_TIME,
    enabled: !!prefectureSlug,
  });
}
