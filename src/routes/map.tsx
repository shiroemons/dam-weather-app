import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { useAllDams } from "@/hooks/useAllDams";
import { PREFECTURES, REGIONS } from "@/data/prefectures";
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
  const [selectedRegion, setSelectedRegion] = useState<string>("");

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
    if (!selectedRegion) return allDams;
    return allDams.filter((dam) => {
      const pref = PREFECTURES.find((p) => p.slug === dam.prefectureSlug);
      return pref?.region === selectedRegion;
    });
  }, [allDams, selectedRegion]);

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <div className="absolute left-3 top-3 z-[1000] rounded-lg bg-white/90 p-2 shadow-md backdrop-blur-sm dark:bg-gray-800/90">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">全国 ({allDams.length}基)</option>
          {REGIONS.map((region) => {
            const count = allDams.filter((d) => {
              const p = PREFECTURES.find((pr) => pr.slug === d.prefectureSlug);
              return p?.region === region;
            }).length;
            return (
              <option key={region} value={region}>
                {region} ({count}基)
              </option>
            );
          })}
        </select>
      </div>

      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">地図を読み込み中...</p>
          </div>
        }
      >
        <MapView dams={filteredDams} weatherMap={weatherMap} className="h-full w-full" />
      </Suspense>
    </div>
  );
}
