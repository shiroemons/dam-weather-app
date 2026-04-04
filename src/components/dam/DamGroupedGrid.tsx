import type { Dam } from "@/types/dam";
import type { PrefectureStorage } from "@/types/storage";
import type { PrefectureWeather } from "@/types/weather";

import DamCardGrid from "./DamCardGrid";

export type GroupByMode = "municipality" | "waterSystem";

type Props = {
  dams: Dam[];
  weather: PrefectureWeather | undefined;
  storage?: PrefectureStorage;
  groupBy?: GroupByMode;
};

function getMunicipalityKey(dam: Dam): string {
  const m = dam.municipality || "不明";
  const gunMatch = m.match(/^(.+?郡)/);
  if (gunMatch) return gunMatch[1];
  const shiMatch = m.match(/^(.+?市)/);
  if (shiMatch) return shiMatch[1];
  return m;
}

function getGroupKey(dam: Dam, groupBy: GroupByMode): string {
  if (groupBy === "waterSystem") return dam.waterSystem || "不明";
  return getMunicipalityKey(dam);
}

export default function DamGroupedGrid({ dams, weather, storage, groupBy = "waterSystem" }: Props) {
  if (dams.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500 dark:text-gray-400">ダムが見つかりません</p>
    );
  }

  const groupMap = new Map<string, Dam[]>();

  for (const dam of dams) {
    const key = getGroupKey(dam, groupBy);
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(dam);
    } else {
      groupMap.set(key, [dam]);
    }
  }

  const groups = Array.from(groupMap, ([groupName, dams]) => ({ groupName, dams }));

  return (
    <div className="space-y-8">
      {groups.map(({ groupName, dams: groupDams }) => (
        <section key={groupName}>
          <h2 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-200">
            {groupName}
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
              ({groupDams.length}基)
            </span>
          </h2>
          <DamCardGrid dams={groupDams} weather={weather} storage={storage} />
        </section>
      ))}
    </div>
  );
}
