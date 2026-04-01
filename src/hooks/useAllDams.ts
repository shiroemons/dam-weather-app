import { useMemo } from "react";
import allDamsData from "@/data/dams.json";
import type { Dam } from "@/types/dam";

const allDams = allDamsData as Dam[];

const damById = new Map<string, Dam>(allDams.map((dam) => [dam.id, dam]));

export function getDamById(damId: string): Dam | undefined {
  return damById.get(damId);
}

export function useAllDams(): Dam[] {
  return allDams;
}

export function useDamById(damId: string): Dam | undefined {
  return useMemo(() => getDamById(damId), [damId]);
}
