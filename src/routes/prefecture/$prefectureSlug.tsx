import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPrefectureBySlug } from "@/data/prefectures";
import { useFilteredDams } from "@/hooks/useDams";
import { useWeather } from "@/hooks/useWeather";
import DamGroupedGrid from "@/components/dam/DamGroupedGrid";
import DamCardSkeleton from "@/components/dam/DamCardSkeleton";
import FilterToggle from "@/components/dam/FilterToggle";
import GroupBySelector from "@/components/dam/GroupBySelector";
import type { GroupByMode } from "@/components/dam/DamGroupedGrid";
import ErrorFallback from "@/components/common/ErrorFallback";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const Route = createFileRoute("/prefecture/$prefectureSlug")({
  head: ({ params }) => {
    const prefecture = getPrefectureBySlug(params.prefectureSlug);
    if (!prefecture) {
      return {
        meta: [{ title: `ページが見つかりません | ${SITE_NAME}` }],
      };
    }
    const title = `${prefecture.name}のダム天気 | ${SITE_NAME}`;
    const description = `${prefecture.name}にある${prefecture.damCount}基のダムの天気予報。ダム周辺の天気を確認できます。`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/prefecture/${prefecture.slug}` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url: `${SITE_URL}/prefecture/${prefecture.slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: `${SITE_URL}/prefecture`,
            },
          },
        },
      ],
    };
  },
  component: PrefecturePage,
});

function PrefecturePage() {
  const { prefectureSlug } = Route.useParams();
  const [majorOnly, setMajorOnly] = useState<boolean>(true);
  const [groupBy, setGroupBy] = useState<GroupByMode>("waterSystem");

  const prefecture = getPrefectureBySlug(prefectureSlug);
  const {
    dams,
    totalCount,
    isLoading: damsLoading,
    isError: damsError,
  } = useFilteredDams(prefectureSlug, majorOnly);
  const {
    data: weather,
    isLoading: weatherLoading,
    isError: weatherError,
    refetch,
  } = useWeather(prefectureSlug);

  if (!prefecture) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/prefecture" className="text-sm text-blue-500 hover:text-blue-700">
          ← 一覧に戻る
        </Link>
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-900">404</p>
          <p className="mt-2 text-gray-500">都道府県が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/prefecture" className="text-sm text-blue-500 hover:text-blue-700">
        ← 一覧に戻る
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{prefecture.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {dams.length}基のダム{majorOnly && totalCount > dams.length && ` / 全${totalCount}基`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <GroupBySelector value={groupBy} onChange={setGroupBy} />
          <FilterToggle enabled={majorOnly} onChange={setMajorOnly} />
        </div>
      </div>

      {(damsLoading || weatherLoading) && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DamCardSkeleton key={i} />
          ))}
        </div>
      )}

      {(damsError || weatherError) && (
        <div className="mt-6">
          <ErrorFallback resetErrorBoundary={() => refetch()} />
        </div>
      )}

      {!damsLoading && !weatherLoading && !damsError && !weatherError && (
        <>
          {weather?.updatedAt && (
            <p className="mt-2 text-xs text-gray-400">
              更新日時:{" "}
              {new Date(weather.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}
          <div className="mt-6">
            <DamGroupedGrid dams={dams} weather={weather} groupBy={groupBy} />
          </div>
        </>
      )}
    </div>
  );
}
