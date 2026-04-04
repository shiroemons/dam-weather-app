import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { getDamById } from "@/hooks/useAllDams";
import { useWatchlistWeather } from "@/hooks/useWatchlistWeather";
import { getWeatherCategory } from "@/lib/weatherColors";
import WeatherSummaryBar from "@/components/today/WeatherSummaryBar";
import DamCard from "@/components/dam/DamCard";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { Dam } from "@/types/dam";

export const Route = createFileRoute("/watchlist/$listId")({
  component: WatchlistDetailPage,
});

function emptyCounts(): Record<WeatherCategory, number> {
  return { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 };
}

function WatchlistDetailPage() {
  const { listId } = Route.useParams();
  const { data } = useWatchlist();
  const list = data.lists.find((l) => l.id === listId);

  // Must call hooks unconditionally
  const damIds = list?.damIds ?? [];
  const { weatherMap, isLoading } = useWatchlistWeather(damIds);

  const dams = useMemo(
    () => damIds.map((id) => getDamById(id)).filter((d): d is Dam => d !== undefined),
    [damIds],
  );

  const counts = useMemo(() => {
    const c = emptyCounts();
    for (const dam of dams) {
      const dw = weatherMap.get(dam.id);
      if (dw) {
        c[getWeatherCategory(dw.today.weatherCode)]++;
      }
    }
    return c;
  }, [dams, weatherMap]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (!list) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/watchlist" className="text-sm text-blue-500 hover:text-blue-700">
          ← マイウォッチリスト
        </Link>
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">404</p>
          <p className="mt-2 text-gray-500 dark:text-gray-400">リストが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/watchlist" className="hover:text-blue-500">
          マイウォッチリスト
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-gray-900 dark:text-gray-100">{list.name}</span>
      </nav>

      {/* Header */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{list.name}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{dams.length}基のダム</p>
      </div>

      {/* Weather Summary */}
      {isLoading ? (
        <div className="mt-6">
          <div className="h-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : total > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">天気サマリー</h2>
          <div className="mt-3">
            <WeatherSummaryBar counts={counts} total={total} />
          </div>
        </div>
      ) : null}

      {/* Dam Cards */}
      {dams.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">このリストにはまだダムがありません</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            ダムの詳細ページからウォッチリストに追加できます
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dams.map((dam) => (
            <DamCard key={dam.id} dam={dam} weather={weatherMap.get(dam.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
