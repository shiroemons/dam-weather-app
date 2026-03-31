import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Dam } from "@/types/dam";

export function useDams(prefectureSlug: string) {
  return useQuery<Dam[]>({
    queryKey: ["dams", prefectureSlug],
    queryFn: async () => {
      const response = await fetch(`/data/dams/${prefectureSlug}.json`);
      if (!response.ok) return [];
      return response.json() as Promise<Dam[]>;
    },
    staleTime: Infinity,
    enabled: !!prefectureSlug,
  });
}

export function useFilteredDams(prefectureSlug: string, majorOnly: boolean) {
  const { data: dams = [], isLoading, isError } = useDams(prefectureSlug);

  const filtered = useMemo(() => {
    if (majorOnly) {
      return dams.filter((dam) => dam.isMajor && dam.riverUrl);
    }
    return dams;
  }, [dams, majorOnly]);

  return { dams: filtered, isLoading, isError };
}
