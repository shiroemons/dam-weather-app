import type { WeatherCategory } from "@/lib/weatherColors";
import type { Prefecture } from "@/types/prefecture";

import PrefectureCard from "./PrefectureCard";

type Props = {
  region: string;
  regionSlug?: string;
  prefectures: Prefecture[];
  weatherCategories?: Record<string, WeatherCategory>;
};

export default function PrefectureGrid({
  region,
  regionSlug,
  prefectures,
  weatherCategories = {},
}: Props) {
  const regionDamCount = prefectures.reduce((sum, p) => sum + p.damCount, 0);

  return (
    <div id={regionSlug} className="scroll-mt-20">
      <div className="mb-4 flex items-baseline gap-3 border-l-4 border-accent pl-3">
        <h2 className="text-xl font-bold text-text-primary">{region}</h2>
        <span className="text-sm font-medium text-accent">{regionDamCount.toLocaleString()}基</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {prefectures.map((prefecture) => (
          <PrefectureCard
            key={prefecture.code}
            prefecture={prefecture}
            weatherCategory={weatherCategories[prefecture.slug]}
          />
        ))}
      </div>
    </div>
  );
}
