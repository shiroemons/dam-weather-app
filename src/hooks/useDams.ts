import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DAM_TYPE_UNSET } from "@/data/damTypes";
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
  selectedTypes: Set<string>,
  keyword: string = "",
) {
  const { data: dams = [], isLoading, isError } = useDams(prefectureSlug);

  const baseDams = useMemo(() => {
    if (majorOnly) {
      return dams.filter((dam) => dam.isMajor && dam.riverUrl);
    }
    return dams;
  }, [dams, majorOnly]);

  const keywordFiltered = useMemo(() => {
    if (!keyword) return baseDams;
    return baseDams.filter((dam) => dam.damName.includes(keyword));
  }, [baseDams, keyword]);

  const availablePurposes = useMemo(() => {
    const purposeSet = new Set<string>();
    for (const dam of keywordFiltered) {
      for (const p of dam.purposes) {
        purposeSet.add(p);
      }
    }
    return Array.from(purposeSet);
  }, [keywordFiltered]);

  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>();
    for (const dam of keywordFiltered) {
      typeSet.add(dam.damType || DAM_TYPE_UNSET);
    }
    return Array.from(typeSet);
  }, [keywordFiltered]);

  const filtered = useMemo(() => {
    return keywordFiltered.filter((dam) => {
      if (selectedPurposes.size > 0 && !dam.purposes.some((p) => selectedPurposes.has(p))) {
        return false;
      }
      if (selectedTypes.size > 0) {
        const damTypeLabel = dam.damType || DAM_TYPE_UNSET;
        if (!selectedTypes.has(damTypeLabel)) return false;
      }
      return true;
    });
  }, [keywordFiltered, selectedPurposes, selectedTypes]);

  return {
    dams: filtered,
    totalCount: dams.length,
    availablePurposes,
    availableTypes,
    isLoading,
    isError,
  };
}
