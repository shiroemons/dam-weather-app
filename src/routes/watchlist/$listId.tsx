import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Pencil, Trash2, X } from "lucide-react";
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
  const { data, renameList, deleteList: deleteWatchList, removeDam } = useWatchlist();
  const list = data.lists.find((l) => l.id === listId);

  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleStartEdit() {
    if (!list) return;
    setEditName(list.name);
    setIsEditing(true);
  }

  function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed || !list) return;
    renameList(list.id, trimmed);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditName("");
  }

  function handleDeleteList() {
    if (!list) return;
    deleteWatchList(list.id);
    void navigate({ to: "/watchlist" });
  }

  function handleRemoveDam(damId: string) {
    if (!list) return;
    removeDam(list.id, damId);
  }

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
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xl font-bold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
            >
              保存
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{list.name}</h1>
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="リスト名を編集"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-gray-400 transition-colors hover:text-red-500"
              aria-label="リストを削除"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{dams.length}基のダム</p>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            「{list.name}」を削除しますか？
          </p>
          <p className="mt-1 text-xs text-red-600/70 dark:text-red-400/70">
            この操作は取り消せません
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteList}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
            >
              削除する
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

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
            <div key={dam.id} className="relative">
              <DamCard dam={dam} weather={weatherMap.get(dam.id)} />
              <button
                type="button"
                onClick={() => handleRemoveDam(dam.id)}
                className="absolute right-2 top-2 rounded-full bg-gray-900/50 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100 [div:hover>&]:opacity-100"
                aria-label={`${dam.damName}をリストから削除`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
