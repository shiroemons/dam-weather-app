import type { Dam } from "@/types/dam";
import type { DamStorage } from "@/types/storage";

export type ViewMode = "grid" | "list";
export type SortField = "name" | "waterSystem" | "river" | "capacity" | "rate";
export type SortDirection = "asc" | "desc";

export function sortDams(
  dams: Dam[],
  storageMap: Map<string, DamStorage>,
  field: SortField,
  direction: SortDirection,
): Dam[] {
  return [...dams].sort((a, b) => {
    let result: number;

    if (field === "name") {
      result = a.damName.localeCompare(b.damName, "ja");
    } else if (field === "waterSystem") {
      result = (a.waterSystem || "").localeCompare(b.waterSystem || "", "ja");
    } else if (field === "river") {
      result = (a.riverName || "").localeCompare(b.riverName || "", "ja");
    } else if (field === "capacity") {
      const aVal = a.totalStorageCapacity;
      const bVal = b.totalStorageCapacity;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      result = aVal - bVal;
    } else {
      const aVal = storageMap.get(a.id)?.storageRate ?? null;
      const bVal = storageMap.get(b.id)?.storageRate ?? null;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      result = aVal - bVal;
    }

    return direction === "desc" ? -result : result;
  });
}
