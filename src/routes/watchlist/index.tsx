import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { getDamById } from "@/hooks/useAllDams";
import { useWatchlistWeather } from "@/hooks/useWatchlistWeather";
import WatchlistListCard from "@/components/watchlist/WatchlistListCard";
import WatchlistCreateForm from "@/components/watchlist/WatchlistCreateForm";
import WatchlistEmptyState from "@/components/watchlist/WatchlistEmptyState";
import WatchlistImportExport from "@/components/watchlist/WatchlistImportExport";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import type { Dam } from "@/types/dam";

export const Route = createFileRoute("/watchlist/")({
  head: () => {
    const title = `マイウォッチリスト | ${SITE_NAME}`;
    const description = "お気に入りのダムをリストにまとめて天気をチェック。";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/watchlist` },
      ],
    };
  },
  component: WatchlistPage,
});

function WatchlistPage() {
  const { data } = useWatchlist();

  // Collect all unique dam IDs across all lists
  const allDamIds = useMemo(() => {
    const ids = new Set<string>();
    for (const list of data.lists) {
      for (const damId of list.damIds) {
        ids.add(damId);
      }
    }
    return [...ids];
  }, [data.lists]);

  const { weatherMap } = useWatchlistWeather(allDamIds);

  // Resolve Dam objects for each list
  const listDamsMap = useMemo(() => {
    const map = new Map<string, Dam[]>();
    for (const list of data.lists) {
      const dams = list.damIds.map((id) => getDamById(id)).filter((d): d is Dam => d !== undefined);
      map.set(list.id, dams);
    }
    return map;
  }, [data.lists]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">マイウォッチリスト</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        お気に入りのダムをリストにまとめて天気をチェック
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <WatchlistCreateForm />
        <WatchlistImportExport />
      </div>

      {data.lists.length === 0 ? (
        <WatchlistEmptyState />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.lists.map((list) => (
            <WatchlistListCard
              key={list.id}
              list={list}
              dams={listDamsMap.get(list.id) ?? []}
              weatherMap={weatherMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
