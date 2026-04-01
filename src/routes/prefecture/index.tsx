import { createFileRoute } from "@tanstack/react-router";

import PrefectureGrid from "@/components/prefecture/PrefectureGrid";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import { getRegionsWithPrefectures } from "@/data/prefectures";

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">ダム天気</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">全国のダムの天気をチェック</p>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {regions.map(({ region, prefectures }) => (
          <PrefectureGrid key={region} region={region} prefectures={prefectures} />
        ))}
      </div>
    </div>
  );
}
