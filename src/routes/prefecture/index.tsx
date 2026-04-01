import { createFileRoute } from "@tanstack/react-router";
import { Droplets } from "lucide-react";

import PrefectureGrid from "@/components/prefecture/PrefectureGrid";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import { PREFECTURES, getRegionsWithPrefectures } from "@/data/prefectures";
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
  const totalDamCount = PREFECTURES.reduce((sum, p) => sum + p.damCount, 0);
  const totalObsCount = PREFECTURES.reduce((sum, p) => sum + p.obsCount, 0);
  const weatherCategories = usePrefectureWeatherCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14 dark:from-sky-700 dark:to-blue-900">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Droplets className="size-8 text-sky-200" />
              <h1 className="text-3xl font-bold sm:text-4xl">ダム天気</h1>
            </div>
            <p className="mt-3 max-w-lg text-sky-100">
              全国のダムの天気をチェック。都道府県を選んでダムの天気予報を確認しましょう。
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold sm:text-4xl">
              {totalDamCount.toLocaleString()}
              <span className="ml-1 text-base font-medium">基</span>
            </p>
            <p className="text-xs text-sky-200/80">河川法上のダム（堤高15m以上）</p>
            <p className="mt-2 text-lg font-semibold sm:text-xl">
              {totalObsCount.toLocaleString()}
              <span className="ml-1 text-xs font-medium">基</span>
            </p>
            <p className="text-xs text-sky-200/80">観測所情報あり</p>
          </div>
        </div>
      </div>

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
