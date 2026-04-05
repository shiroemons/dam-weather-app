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

  return (
    <div className="mx-auto max-w-(--width-content) px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">都道府県一覧</h1>

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
