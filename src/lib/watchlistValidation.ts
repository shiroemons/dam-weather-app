import { getDamById } from "@/hooks/useAllDams";
import type { WatchList } from "@/types/watchlist";

export interface ValidationResult {
  success: boolean;
  data?: { version: 1; lists: WatchList[] };
  error?: string;
  skippedDams: number;
}

function isValidISODate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function validateWatchlistImport(
  json: string,
  existingListNames: string[],
): ValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, error: "JSONの形式が正しくありません", skippedDams: 0 };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Record<string, unknown>)["version"] !== 1
  ) {
    return { success: false, error: "対応していないデータ形式です", skippedDams: 0 };
  }

  const raw = parsed as Record<string, unknown>;

  if (!Array.isArray(raw["lists"])) {
    return { success: false, error: "データの構造が正しくありません", skippedDams: 0 };
  }

  const now = new Date().toISOString();
  const lists: WatchList[] = [];
  let skippedDams = 0;

  for (const entry of raw["lists"]) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Record<string, unknown>)["name"] !== "string" ||
      !(entry as Record<string, unknown>)["name"] ||
      ((entry as Record<string, unknown>)["name"] as string).length > 100 ||
      !Array.isArray((entry as Record<string, unknown>)["damIds"])
    ) {
      continue;
    }

    const item = entry as Record<string, unknown>;
    const rawDamIds = item["damIds"] as unknown[];
    const validDamIds: string[] = [];

    for (const id of rawDamIds) {
      if (typeof id === "string" && getDamById(id) !== undefined) {
        validDamIds.push(id);
      } else {
        skippedDams++;
      }
    }

    let name = item["name"] as string;
    if (existingListNames.includes(name)) {
      name = `${name}（インポート）`;
    }

    const createdAt = isValidISODate(item["createdAt"]) ? item["createdAt"] : now;
    const updatedAt = isValidISODate(item["updatedAt"]) ? item["updatedAt"] : now;

    lists.push({
      id: crypto.randomUUID(),
      name,
      damIds: validDamIds,
      createdAt,
      updatedAt,
    });
  }

  return { success: true, data: { version: 1, lists }, skippedDams };
}
