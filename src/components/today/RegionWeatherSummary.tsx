import { Link } from "@tanstack/react-router";

import { REGION_SLUG_MAP } from "@/data/prefectures";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { Region } from "@/types/prefecture";

type Props = {
  region: Region;
  counts: Record<WeatherCategory, number>;
  total: number;
};

const BAR_COLORS: Record<WeatherCategory, string> = {
  sunny: "bg-amber-400",
  cloudy: "bg-gray-400",
  rain: "bg-blue-400",
  snow: "bg-sky-300",
  default: "bg-gray-300",
};

const DISPLAY_ORDER: WeatherCategory[] = ["sunny", "cloudy", "rain", "snow", "default"];

export default function RegionWeatherSummary({ region, counts, total }: Props) {
  if (total === 0) return null;

  return (
    <Link
      to="/prefecture"
      hash={REGION_SLUG_MAP[region]}
      className="block rounded-xl bg-surface-elevated p-4 shadow-sm transition-colors hover:bg-surface-secondary"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{region}</h3>
        <span className="text-xs text-text-secondary">{total}基</span>
      </div>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          return (
            <div
              key={category}
              className={`${BAR_COLORS[category]} transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${category}: ${count}基`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 text-xs text-text-secondary">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          return (
            <span key={category} className="flex items-center gap-1">
              <span className={`inline-block size-2 rounded-full ${BAR_COLORS[category]}`} />
              {count}
              <span className="text-text-tertiary">({Math.round((count / total) * 100)}%)</span>
            </span>
          );
        })}
      </div>
    </Link>
  );
}
