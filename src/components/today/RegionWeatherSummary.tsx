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

const CATEGORY_LABELS: Record<WeatherCategory, string> = {
  sunny: "晴れ",
  cloudy: "曇り",
  rain: "雨",
  snow: "雪",
  default: "その他",
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
      <div className="mt-2 flex h-3 rounded-full">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={category}
              className={`group/tooltip relative first:rounded-l-full last:rounded-r-full ${BAR_COLORS[category]} transition-all`}
              style={{ width: `${pct}%` }}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
                {CATEGORY_LABELS[category]}: {count}基 ({pct.toFixed(1)}%)
              </span>
            </div>
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
