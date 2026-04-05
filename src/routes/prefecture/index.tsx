import { useEffect } from "react";

import { createFileRoute, useLocation } from "@tanstack/react-router";

import PrefectureGrid from "@/components/prefecture/PrefectureGrid";
import WeatherSummaryBar from "@/components/today/WeatherSummaryBar";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import { REGION_SLUG_MAP, getRegionsWithPrefectures } from "@/data/prefectures";
import { usePrefectureWeatherCategories } from "@/hooks/usePrefectureWeatherCategories";
import type { WeatherCategory } from "@/lib/weatherColors";
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

  // 全国天候集計（weatherCategories は Record<slug, PrefectureWeatherSummary>）
  const totalCounts: Record<WeatherCategory, number> = {
    sunny: 0,
    cloudy: 0,
    rain: 0,
    snow: 0,
    default: 0,
  };
  const summaries = Object.values(weatherCategories);
  for (const summary of summaries) {
    totalCounts[summary.dominant]++;
  }
  const totalPrefectures = summaries.length;
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

      {/* 全国天気サマリー */}
      {isLoaded && (
        <div className="mt-6 rounded-xl border border-border-primary bg-surface-primary p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">全国の天気分布</h2>
            <span className="text-xs text-text-tertiary">
              {totalPrefectures.toLocaleString()}都道府県
            </span>
          </div>
          <WeatherSummaryBar counts={totalCounts} total={totalPrefectures} unit="" />
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
