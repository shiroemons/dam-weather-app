import { Link } from "@tanstack/react-router";
import { Cloud, CloudRain, type LucideIcon, Snowflake, Sun } from "lucide-react";

import type { WeatherCategory } from "@/lib/weatherColors";
import type { Prefecture } from "@/types/prefecture";

const CARD_CLASSES: Record<WeatherCategory, string> = {
  sunny:
    "border-amber-200 from-orange-50 to-amber-50/50 hover:border-amber-300 dark:border-amber-800/30 dark:from-orange-950/40 dark:to-amber-950/30 dark:hover:border-amber-700/50",
  cloudy:
    "border-gray-200 from-gray-100 to-slate-50 hover:border-gray-300 dark:border-gray-700/30 dark:from-gray-800 dark:to-slate-800 dark:hover:border-gray-600/50",
  rain: "border-blue-200 from-blue-50 to-sky-50/50 hover:border-blue-300 dark:border-blue-800/30 dark:from-blue-950/40 dark:to-sky-950/30 dark:hover:border-blue-700/50",
  snow: "border-sky-200 from-sky-50 to-blue-50/30 hover:border-sky-300 dark:border-sky-800/30 dark:from-sky-950/30 dark:to-blue-950/20 dark:hover:border-sky-700/50",
  default:
    "border-sky-100 from-white to-sky-50 hover:border-sky-200 dark:border-sky-900/30 dark:from-gray-800 dark:to-sky-950/30 dark:hover:border-sky-800/50",
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
};

export default function PrefectureCard({ prefecture, weatherCategory = "default" }: Props) {
  const { icon: WeatherIcon, classes: iconClasses } = WEATHER_ICONS[weatherCategory];

  return (
    <Link
      to="/prefecture/$prefectureSlug"
      params={{ prefectureSlug: prefecture.slug }}
      search={{ obs: true, group: "waterSystem", purposes: "", types: "", q: "" }}
      className={`group block rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md motion-reduce:hover:scale-100 ${CARD_CLASSES[weatherCategory]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {prefecture.name}
        </p>
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
    </Link>
  );
}
