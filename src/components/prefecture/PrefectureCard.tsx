import { Link } from "@tanstack/react-router";
import { Cloud, CloudRain, type LucideIcon, Snowflake, Sun } from "lucide-react";

import WeatherMiniBar from "@/components/today/WeatherMiniBar";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { Prefecture } from "@/types/prefecture";

const CARD_CLASSES: Record<WeatherCategory, string> = {
  sunny:
    "border-amber-200/60 bg-amber-50/50 hover:border-amber-300 dark:border-amber-800/30 dark:bg-amber-950/20 dark:hover:border-amber-700/50",
  cloudy:
    "border-gray-200/60 bg-gray-50/50 hover:border-gray-300 dark:border-gray-700/30 dark:bg-gray-800/20 dark:hover:border-gray-600/50",
  rain: "border-blue-200/60 bg-blue-50/50 hover:border-blue-300 dark:border-blue-800/30 dark:bg-blue-950/20 dark:hover:border-blue-700/50",
  snow: "border-sky-200/60 bg-sky-50/50 hover:border-sky-300 dark:border-sky-800/30 dark:bg-sky-950/20 dark:hover:border-sky-700/50",
  default:
    "border-sky-100/60 bg-sky-50/30 hover:border-sky-200 dark:border-sky-900/30 dark:bg-sky-950/20 dark:hover:border-sky-800/50",
};

const WEATHER_ICONS: Record<WeatherCategory, { icon: LucideIcon; classes: string }> = {
  sunny: {
    icon: Sun,
    classes:
      "text-amber-400 group-hover:text-amber-500 dark:text-amber-500 dark:group-hover:text-amber-400",
  },
  cloudy: {
    icon: Cloud,
    classes:
      "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
  },
  rain: {
    icon: CloudRain,
    classes:
      "text-blue-400 group-hover:text-blue-500 dark:text-blue-500 dark:group-hover:text-blue-400",
  },
  snow: {
    icon: Snowflake,
    classes:
      "text-sky-400 group-hover:text-sky-500 dark:text-sky-500 dark:group-hover:text-sky-400",
  },
  default: {
    icon: Sun,
    classes:
      "text-sky-400 group-hover:text-sky-500 dark:text-sky-500 dark:group-hover:text-sky-400",
  },
};

const BADGE_CLASSES: Record<WeatherCategory, string> = {
  sunny: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  cloudy: "bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
  rain: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  snow: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  default: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

type Props = {
  prefecture: Prefecture;
  weatherCategory?: WeatherCategory;
  weatherCounts?: Record<WeatherCategory, number>;
  weatherTotal?: number;
};

export default function PrefectureCard({
  prefecture,
  weatherCategory = "default",
  weatherCounts,
  weatherTotal,
}: Props) {
  const { icon: WeatherIcon, classes: iconClasses } = WEATHER_ICONS[weatherCategory];

  return (
    <Link
      to="/prefecture/$prefectureSlug"
      params={{ prefectureSlug: prefecture.slug }}
      search={{
        obs: false,
        group: "waterSystem",
        purposes: "",
        types: "",
        q: "",
        view: "grid",
        sort: "name",
        order: "asc",
      }}
      className={`group block rounded-xl border p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md motion-reduce:hover:scale-100 ${CARD_CLASSES[weatherCategory]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-text-primary">{prefecture.name}</p>
        <WeatherIcon className={`size-4 transition-colors ${iconClasses}`} />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[weatherCategory]}`}
        >
          {prefecture.damCount}基
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          観測所 {prefecture.obsCount}
        </span>
      </div>
      {weatherCounts != null && weatherTotal != null && weatherTotal > 0 && (
        <div className="mt-2">
          <WeatherMiniBar counts={weatherCounts} total={weatherTotal} />
        </div>
      )}
    </Link>
  );
}
