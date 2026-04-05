import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Download, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { getDamById } from "@/hooks/useAllDams";
import { useWatchlistStorage } from "@/hooks/useWatchlistStorage";
import { useWatchlistWeather } from "@/hooks/useWatchlistWeather";
import { getWeatherCategory } from "@/lib/weatherColors";
import WeatherSummaryBar from "@/components/today/WeatherSummaryBar";
import DamCard from "@/components/dam/DamCard";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { Dam } from "@/types/dam";
import { SITE_NAME } from "@/config/seo";
import type { DamStorage } from "@/types/storage";
import type { DamWeather } from "@/types/weather";

export const Route = createFileRoute("/watchlist/$listId")({
  head: () => {
    const title = `ウォッチリスト | ${SITE_NAME}`;
    const description = "お気に入りのダムリストの天気予報を確認できます。";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: WatchlistDetailPage,
});

function emptyCounts(): Record<WeatherCategory, number> {
  return { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 };
}

function SortableDamCard({
  dam,
  weather,
  storage,
  onRemove,
}: {
  dam: Dam;
  weather: DamWeather | undefined;
  storage?: DamStorage;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dam.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-10 opacity-50" : ""}`}
    >
      <span className="group/drag absolute left-2 top-2 z-10 opacity-0 transition-opacity [div:hover>&]:opacity-100">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-full bg-surface-elevated/80 p-1 text-white hover:bg-surface-elevated active:cursor-grabbing"
          aria-label="ドラッグして並べ替え"
        >
          <GripVertical className="size-3.5" />
        </button>
        <span className="pointer-events-none absolute bottom-full left-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/drag:opacity-100 after:absolute after:left-1 after:top-full after:border-4 after:border-transparent after:border-t-gray-800">
          ドラッグして並べ替え
        </span>
      </span>
      <DamCard dam={dam} weather={weather} storage={storage} onRemove={onRemove} />
    </div>
  );
}

function WatchlistDetailPage() {
  const { listId } = Route.useParams();
  const { data, renameList, deleteList: deleteWatchList, removeDam, reorderDams } = useWatchlist();
  const list = data.lists.find((l) => l.id === listId);

  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeDamId, setActiveDamId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Must call hooks unconditionally
  const damIds = list?.damIds ?? [];
  const { weatherMap, isLoading, updatedAt } = useWatchlistWeather(damIds);
  const { storageMap } = useWatchlistStorage(damIds);

  const dams = useMemo(
    () => damIds.map((id) => getDamById(id)).filter((d): d is Dam => d !== undefined),
    [damIds],
  );

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

  function handleExportList() {
    if (!list) return;
    const exportObj = {
      version: 1 as const,
      lists: [list],
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `watchlist-${list.name}-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDamId(event.active.id as string);
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDamId(null);
      const { active, over } = event;
      if (!over || active.id === over.id || !list) return;
      const oldIndex = damIds.indexOf(active.id as string);
      const newIndex = damIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const newDamIds = [...damIds];
      newDamIds.splice(oldIndex, 1);
      newDamIds.splice(newIndex, 0, active.id as string);
      reorderDams(list.id, newDamIds);
    },
    [list, damIds, reorderDams],
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

  const activeDam = activeDamId ? dams.find((d) => d.id === activeDamId) : undefined;

  if (!list) {
    return (
      <div className="mx-auto max-w-(--width-content) px-4 py-8 sm:px-6">
        <Link to="/watchlist" className="text-sm text-accent hover:text-accent">
          ← マイウォッチリスト
        </Link>
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-text-primary">404</p>
          <p className="mt-2 text-text-secondary">リストが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-(--width-content) px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-text-secondary">
        <Link to="/watchlist" className="hover:text-accent">
          マイウォッチリスト
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary">{list.name}</span>
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
              className="rounded-lg border border-border-primary px-3 py-1.5 text-xl font-bold bg-surface-elevated text-text-primary"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent"
            >
              保存
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary font-display">{list.name}</h1>
              <button
                type="button"
                onClick={handleStartEdit}
                className="text-text-tertiary transition-colors hover:text-text-secondary"
                aria-label="リスト名を編集"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-text-tertiary transition-colors hover:text-red-500"
                aria-label="リストを削除"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleExportList}
              className="flex items-center gap-1.5 rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              aria-label="リストをエクスポート"
            >
              <Download className="size-3.5" />
              エクスポート
            </button>
          </div>
        )}
        <p className="mt-1 text-sm text-text-secondary">{dams.length}基のダム</p>
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
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Weather Summary */}
      {isLoading ? (
        <div className="mt-6">
          <div className="h-8 animate-pulse rounded-full bg-surface-secondary" />
        </div>
      ) : total > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-text-primary">天気サマリー</h2>
          <div className="mt-3">
            <WeatherSummaryBar counts={counts} total={total} />
          </div>
          {updatedAt && (
            <p className="mt-2 text-xs text-text-tertiary">
              更新日時: {new Date(updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}
        </div>
      ) : null}

      {/* Dam Cards */}
      {dams.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-text-secondary">このリストにはまだダムがありません</p>
          <p className="mt-1 text-sm text-text-tertiary">
            ダムの詳細ページからウォッチリストに追加できます
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={damIds} strategy={rectSortingStrategy}>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dams.map((dam) => (
                <SortableDamCard
                  key={dam.id}
                  dam={dam}
                  weather={weatherMap.get(dam.id)}
                  storage={storageMap.get(dam.id)}
                  onRemove={() => handleRemoveDam(dam.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDam ? (
              <div className="rotate-1 opacity-95 shadow-2xl">
                <DamCard
                  dam={activeDam}
                  weather={weatherMap.get(activeDam.id)}
                  storage={storageMap.get(activeDam.id)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
