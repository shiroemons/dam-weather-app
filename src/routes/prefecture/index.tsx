import { useEffect } from "react";

import { createFileRoute, useLocation } from "@tanstack/react-router";

import PrefectureGrid from "@/components/prefecture/PrefectureGrid";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import { REGION_SLUG_MAP, getRegionsWithPrefectures } from "@/data/prefectures";
import { usePrefectureWeatherCategories } from "@/hooks/usePrefectureWeatherCategories";
import type { Region } from "@/types/prefecture";

export const Route = createFileRoute("/prefecture/")({
  head: () => ({
    meta: [
      { title: `都道府県一覧 | ${SITE_NAME}` },
      {
        name: "description",
        content: "全国47都道府県のダム天気情報。地方別にダムの天気予報を確認できます。",
      },
      { property: "og:title", content: `都道府県一覧 | ${SITE_NAME}` },
      {
        property: "og:description",
        content: "全国47都道府県のダム天気情報。地方別にダムの天気予報を確認できます。",
      },
      { property: "og:url", content: `${SITE_URL}/prefecture` },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          description: "全国のダムの天気予報をチェック",
          url: `${SITE_URL}/prefecture`,
        },
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/prefecture` }],
  }),
  component: PrefecturePage,
});

function PrefecturePage() {
  const regions = getRegionsWithPrefectures();
  const weatherCategories = usePrefectureWeatherCategories();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  // 全国天候集計（weatherCategoriesは Record<slug, WeatherCategory>）
  const totalCounts = { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 };
  const entries = Object.values(weatherCategories);
  for (const cat of entries) {
    totalCounts[cat]++;
  }
  const totalPrefectures = entries.length;
  const isLoaded = totalPrefectures > 0;

  return (
    <div className="mx-auto max-w-(--width-content) px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
            都道府県一覧
          </h1>
          <span className="rounded-full border border-border-primary bg-surface-primary px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
            47都道府県
          </span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">全国のダムの天気を都道府県から探す</p>
      </div>

      {/* 全国天候サマリー */}
      {isLoaded && (
        <div className="mt-6 rounded-xl border border-border-primary bg-surface-primary p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">全国の天候分布</h2>
            <span className="text-xs text-text-tertiary">
              {totalPrefectures.toLocaleString()}都道府県
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-secondary">
            {totalCounts.sunny > 0 && (
              <div
                className="bg-amber-400"
                style={{ width: `${(totalCounts.sunny / totalPrefectures) * 100}%` }}
              />
            )}
            {totalCounts.cloudy > 0 && (
              <div
                className="bg-gray-400"
                style={{ width: `${(totalCounts.cloudy / totalPrefectures) * 100}%` }}
              />
            )}
            {totalCounts.rain > 0 && (
              <div
                className="bg-blue-400"
                style={{ width: `${(totalCounts.rain / totalPrefectures) * 100}%` }}
              />
            )}
            {totalCounts.snow > 0 && (
              <div
                className="bg-sky-300"
                style={{ width: `${(totalCounts.snow / totalPrefectures) * 100}%` }}
              />
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="inline-block size-2.5 rounded-full bg-amber-400" />
              晴れ {totalCounts.sunny.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="inline-block size-2.5 rounded-full bg-gray-400" />
              曇り {totalCounts.cloudy.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="inline-block size-2.5 rounded-full bg-blue-400" />雨{" "}
              {totalCounts.rain.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="inline-block size-2.5 rounded-full bg-sky-300" />雪{" "}
              {totalCounts.snow.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8">
        {regions.map(({ region, prefectures }) => (
          <PrefectureGrid
            key={region}
            region={region}
            regionSlug={REGION_SLUG_MAP[region as Region]}
            prefectures={prefectures}
            weatherCategories={weatherCategories}
          />
        ))}
      </div>
    </div>
  );
}
