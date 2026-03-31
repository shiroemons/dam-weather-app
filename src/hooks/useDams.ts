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

export function useFilteredDams(
  prefectureSlug: string,
  majorOnly: boolean,
  selectedPurposes: Set<string>,
) {
  const { data: dams = [], isLoading, isError } = useDams(prefectureSlug);

  const baseDams = useMemo(() => {
    if (majorOnly) {
      return dams.filter((dam) => dam.isMajor && dam.riverUrl);
    }
    return dams;
  }, [dams, majorOnly]);

  const availablePurposes = useMemo(() => {
    const purposeSet = new Set<string>();
    for (const dam of baseDams) {
      for (const p of dam.purposes) {
        purposeSet.add(p);
      }
    }
    return Array.from(purposeSet);
  }, [baseDams]);

  const filtered = useMemo(() => {
    if (selectedPurposes.size === 0) return baseDams;
    return baseDams.filter((dam) => dam.purposes.some((p) => selectedPurposes.has(p)));
  }, [baseDams, selectedPurposes]);

  return { dams: filtered, totalCount: dams.length, availablePurposes, isLoading, isError };
}
