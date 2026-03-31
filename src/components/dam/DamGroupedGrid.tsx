import type { Dam } from "@/types/dam";
import type { PrefectureWeather } from "@/types/weather";

import DamCardGrid from "./DamCardGrid";

type Props = {
  dams: Dam[];
  weather: PrefectureWeather | undefined;
};

export default function DamGroupedGrid({ dams, weather }: Props) {
  if (dams.length === 0) {
    return <p className="py-12 text-center text-gray-500">ダムが見つかりません</p>;
  }

  const groupMap = new Map<string, Dam[]>();

  for (const dam of dams) {
    const m = dam.municipality || "不明";
    const gunMatch = m.match(/^(.+?郡)/);
    const shiMatch = m.match(/^(.+?市)/);
    let key = m;
    if (gunMatch) {
      key = gunMatch[1];
    } else if (shiMatch) {
      key = shiMatch[1];
    }
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(dam);
    } else {
      groupMap.set(key, [dam]);
    }
  }

  const groups = Array.from(groupMap, ([municipality, dams]) => ({ municipality, dams }));

  return (
    <div className="space-y-8">
      {groups.map(({ municipality, dams: groupDams }) => (
        <section key={municipality}>
          <h2 className="mb-3 text-lg font-semibold text-gray-700">
            {municipality}
            <span className="ml-2 text-sm font-normal text-gray-400">({groupDams.length}基)</span>
          </h2>
          <DamCardGrid dams={groupDams} weather={weather} />
        </section>
      ))}
    </div>
  );
}
