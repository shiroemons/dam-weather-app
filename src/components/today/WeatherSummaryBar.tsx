import type { WeatherCategory } from "@/lib/weatherColors";

type Props = {
  counts: Record<WeatherCategory, number>;
  total: number;
};

const CATEGORY_CONFIG: Record<WeatherCategory, { label: string; bg: string; text: string }> = {
  sunny: { label: "晴れ", bg: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  cloudy: { label: "曇り", bg: "bg-gray-400", text: "text-gray-600 dark:text-gray-400" },
  rain: { label: "雨", bg: "bg-blue-400", text: "text-blue-600 dark:text-blue-400" },
  snow: { label: "雪", bg: "bg-sky-300", text: "text-sky-600 dark:text-sky-400" },
  default: { label: "その他", bg: "bg-gray-300", text: "text-gray-500 dark:text-gray-400" },
};

const DISPLAY_ORDER: WeatherCategory[] = ["sunny", "cloudy", "rain", "snow", "default"];

export default function WeatherSummaryBar({ counts, total }: Props) {
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-8 overflow-hidden rounded-full">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={category}
              className={`${CATEGORY_CONFIG[category].bg} flex items-center justify-center text-xs font-medium text-white transition-all`}
              style={{ width: `${pct}%` }}
              title={`${CATEGORY_CONFIG[category].label}: ${count}基 (${pct.toFixed(1)}%)`}
            >
              {pct >= 8 && `${CATEGORY_CONFIG[category].label}`}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {DISPLAY_ORDER.map((category) => {
          const count = counts[category];
          if (count === 0) return null;
          const config = CATEGORY_CONFIG[category];
          return (
            <div key={category} className="flex items-center gap-2">
              <span className={`inline-block size-3 rounded-full ${config.bg}`} />
              <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
              <span className="text-sm text-text-secondary">{count}基</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
