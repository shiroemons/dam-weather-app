import { createFileRoute } from "@tanstack/react-router";

import PrefectureGrid from "@/components/prefecture/PrefectureGrid";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import { getRegionsWithPrefectures } from "@/data/prefectures";
import { usePrefectureWeatherCategories } from "@/hooks/usePrefectureWeatherCategories";

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
  }),
  component: PrefecturePage,
});

function PrefecturePage() {
  const regions = getRegionsWithPrefectures();
  const weatherCategories = usePrefectureWeatherCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
        都道府県一覧
      </h1>

      <div className="mt-8 flex flex-col gap-8">
        {regions.map(({ region, prefectures }) => (
          <PrefectureGrid
            key={region}
            region={region}
            prefectures={prefectures}
            weatherCategories={weatherCategories}
          />
        ))}
      </div>
    </div>
  );
}
