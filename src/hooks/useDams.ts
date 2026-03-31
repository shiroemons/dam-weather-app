import { useMemo } from "react";

import damsData from "@/data/dams.json";
import type { Dam } from "@/types/dam.ts";

const dams = damsData as Dam[];

export function useDams(prefectureSlug: string): Dam[] {
  return useMemo(
    () => dams.filter((dam) => dam.prefectureSlug === prefectureSlug),
    [prefectureSlug],
  );
}

export function useFilteredDams(
  prefectureSlug: string,
  majorOnly: boolean,
): Dam[] {
  return useMemo(() => {
    const prefectureDams = dams.filter(
      (dam) => dam.prefectureSlug === prefectureSlug,
    );
    if (majorOnly) {
      return prefectureDams.filter((dam) => dam.isMajor);
    }
    return prefectureDams;
  }, [prefectureSlug, majorOnly]);
}
