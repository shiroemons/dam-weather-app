import type { Dam } from "@/types/dam";
import type { PrefectureStorage } from "@/types/storage";

export function filterDamsWithStorageRate(
  dams: Dam[],
  storage: PrefectureStorage | undefined,
): Dam[] {
  const storageMap = new Map(storage?.dams.map((entry) => [entry.damId, entry]) ?? []);
  // Zero is a displayed rate, while null, missing and non-numeric values are not.
  return dams.filter((dam) => Number.isFinite(storageMap.get(dam.id)?.storageRate));
}
