import type { WeatherCategory } from "@/lib/weatherColors";

type Props = {
  counts: Record<WeatherCategory, number>;
  total: number;
  unit?: string;
};

const CATEGORY_CONFIG: Record<WeatherCategory, { label: string; shortLabel: string; bg: string }> =
  {
    sunny: { label: "晴れ", shortLabel: "晴", bg: "bg-amber-400" },
    cloudy: { label: "曇り", shortLabel: "曇", bg: "bg-gray-400" },
    rain: { label: "雨", shortLabel: "雨", bg: "bg-blue-400" },
    snow: { label: "雪", shortLabel: "雪", bg: "bg-sky-300" },
    default: { label: "その他", shortLabel: "他", bg: "bg-gray-300" },
  };

const DISPLAY_ORDER: WeatherCategory[] = ["sunny", "cloudy", "rain", "snow", "default"];

export default function WeatherMiniBar({ counts, total, unit = "基" }: Props) {
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-2 rounded-full bg-surface-secondary">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={category}
              className={`group/tooltip relative first:rounded-l-full last:rounded-r-full ${CATEGORY_CONFIG[category].bg} transition-all`}
              style={{ width: `${pct}%` }}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
                {CATEGORY_CONFIG[category].label}: {count}
                {unit} ({pct.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-2">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          return (
            <span
              key={category}
              className="inline-flex items-center gap-0.5 text-[10px] text-text-secondary"
            >
              <span
                className={`inline-block size-1.5 shrink-0 rounded-full ${CATEGORY_CONFIG[category].bg}`}
                title={CATEGORY_CONFIG[category].label}
              />
              {CATEGORY_CONFIG[category].shortLabel}
              {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}
