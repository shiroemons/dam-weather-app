import { useQuery } from "@tanstack/react-query";

import type { PrefectureStorage } from "@/types/storage.ts";

const STALE_TIME = 30 * 60 * 1000;

export function useStorage(prefectureSlug: string) {
  return useQuery<PrefectureStorage>({
    queryKey: ["storage", prefectureSlug],
    queryFn: async () => {
      const response = await fetch(`/storage/${prefectureSlug}.json`);
      return response.json() as Promise<PrefectureStorage>;
    },
    staleTime: STALE_TIME,
    enabled: !!prefectureSlug,
  });
}
