import { Link } from "@tanstack/react-router";

import WeatherSummaryBar from "@/components/today/WeatherSummaryBar";
import { getWeatherCategory } from "@/lib/weatherColors";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { Dam } from "@/types/dam";
import type { DamWeather } from "@/types/weather";
import type { WatchList } from "@/types/watchlist";

type Props = {
  list: WatchList;
  dams: Dam[];
  weatherMap: Map<string, DamWeather>;
};

function emptyCounts(): Record<WeatherCategory, number> {
  return { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 };
}

function getWeatherEmoji(code: number): string {
  const category = getWeatherCategory(code);
  switch (category) {
    case "sunny":
      return "☀";
    case "cloudy":
      return "☁";
    case "rain":
      return "🌧";
    case "snow":
      return "❄";
    default:
      return "−";
  }
}

export default function WatchlistListCard({ list, dams, weatherMap }: Props) {
  const counts = emptyCounts();
  for (const dam of dams) {
    const weather = weatherMap.get(dam.id);
    if (weather) {
      const category = getWeatherCategory(weather.today.weatherCode);
      counts[category]++;
    } else {
      counts.default++;
    }
  }

  const total = dams.length;
  const previewDams = dams.slice(0, 3);
  const remaining = dams.length - previewDams.length;

  return (
    <Link
      to="/watchlist/$listId"
      params={{ listId: list.id }}
      className="block rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/80"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{list.name}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{total}基</span>
      </div>
      {total > 0 && (
        <div className="mt-3">
          <WeatherSummaryBar counts={counts} total={total} />
        </div>
      )}
      {previewDams.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previewDams.map((dam) => {
            const weather = weatherMap.get(dam.id);
            const emoji = weather ? getWeatherEmoji(weather.today.weatherCode) : "−";
            return (
              <span key={dam.id} className="text-xs text-gray-600 dark:text-gray-400">
                {emoji} {dam.damName}
              </span>
            );
          })}
          {remaining > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">+{remaining}基</span>
          )}
        </div>
      )}
    </Link>
  );
}
