import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import L from "leaflet";
import { useAllDams } from "@/hooks/useAllDams";
import type { PrefectureSummary } from "@/components/map/MapView";
import RegionCascadeMenu from "@/components/map/RegionCascadeMenu";
import { PREFECTURES } from "@/data/prefectures";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import type { DamWeather, PrefectureWeather } from "@/types/weather";
import "leaflet/dist/leaflet.css";

const MapView = lazy(() => import("@/components/map/MapView"));

const STALE_TIME = 30 * 60 * 1000;

export const Route = createFileRoute("/map")({
  head: () => {
    const title = `ダムマップ | ${SITE_NAME}`;
    const description = "全国約2,700基のダムを地図上で確認。天気情報付きで表示します。";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/map` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url: `${SITE_URL}/map`,
          },
        },
      ],
    };
  },
  component: MapPage,
});

function MapPage() {
  const allDams = useAllDams();
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  const weatherQueries = useQueries({
    queries: PREFECTURES.map((pref) => ({
      queryKey: ["weather", pref.slug],
      queryFn: async (): Promise<PrefectureWeather> => {
        const res = await fetch(`/weather/${pref.slug}.json`);
        return res.json() as Promise<PrefectureWeather>;
      },
      staleTime: STALE_TIME,
    })),
  });

  const weatherMap = useMemo(() => {
    const map = new Map<string, DamWeather>();
    for (const query of weatherQueries) {
      if (query.data) {
        for (const dw of query.data.dams) {
          map.set(dw.damId, dw);
        }
      }
    }
    return map;
  }, [weatherQueries]);

  const filteredDams = useMemo(() => {
    if (!selectedFilter) return allDams;
    if (selectedFilter.startsWith("region:")) {
      const region = selectedFilter.slice(7);
      return allDams.filter((dam) => {
        const pref = PREFECTURES.find((p) => p.slug === dam.prefectureSlug);
        return pref?.region === region;
      });
    }
    if (selectedFilter.startsWith("pref:")) {
      const slug = selectedFilter.slice(5);
      return allDams.filter((dam) => dam.prefectureSlug === slug);
    }
    return allDams;
  }, [allDams, selectedFilter]);

  const bounds = useMemo(() => {
    if (filteredDams.length === 0) return undefined;
    if (filteredDams.length === 1) {
      const d = filteredDams[0];
      return L.latLngBounds(
        [d.latitude - 0.05, d.longitude - 0.05],
        [d.latitude + 0.05, d.longitude + 0.05],
      );
    }
    return L.latLngBounds(filteredDams.map((d) => [d.latitude, d.longitude] as [number, number]));
  }, [filteredDams]);

  const prefectureSummaries = useMemo((): PrefectureSummary[] => {
    const dams = selectedFilter === "" ? allDams : filteredDams;
    const summaryMap = new Map<string, { lats: number[]; lngs: number[]; count: number }>();
    for (const dam of dams) {
      const entry = summaryMap.get(dam.prefectureSlug);
      if (entry) {
        entry.lats.push(dam.latitude);
        entry.lngs.push(dam.longitude);
        entry.count++;
      } else {
        summaryMap.set(dam.prefectureSlug, {
          lats: [dam.latitude],
          lngs: [dam.longitude],
          count: 1,
        });
      }
    }
    const result: PrefectureSummary[] = [];
    for (const [slug, data] of summaryMap) {
      const pref = PREFECTURES.find((p) => p.slug === slug);
      if (!pref) continue;
      const avgLat = data.lats.reduce((a, b) => a + b, 0) / data.lats.length;
      const avgLng = data.lngs.reduce((a, b) => a + b, 0) / data.lngs.length;
      result.push({
        slug,
        name: pref.name,
        center: [avgLat, avgLng],
        damCount: data.count,
      });
    }
    return result;
  }, [allDams, filteredDams, selectedFilter]);

  const latestUpdatedAt = useMemo(() => {
    let latest = "";
    for (const query of weatherQueries) {
      if (query.data?.updatedAt && query.data.updatedAt > latest) {
        latest = query.data.updatedAt;
      }
    }
    return latest || null;
  }, [weatherQueries]);

  const handlePrefectureClick = useCallback((slug: string) => {
    setSelectedFilter(`pref:${slug}`);
  }, []);

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <div className="absolute left-3 top-3 z-[1000]">
        <RegionCascadeMenu
          allDams={allDams}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
        {latestUpdatedAt && (
          <p className="mt-1 rounded bg-white/80 px-2 py-0.5 text-xs text-gray-500 backdrop-blur dark:bg-gray-800/80 dark:text-gray-400">
            更新日時:{" "}
            {new Date(latestUpdatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
        )}
      </div>

      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">地図を読み込み中...</p>
          </div>
        }
      >
        <MapView
          dams={filteredDams}
          weatherMap={weatherMap}
          bounds={bounds}
          prefectureSummaries={prefectureSummaries}
          onPrefectureClick={handlePrefectureClick}
          updatedAt={latestUpdatedAt}
          className="h-full w-full"
        />
      </Suspense>
    </div>
  );
}
