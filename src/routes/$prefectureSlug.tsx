import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPrefectureBySlug } from "@/data/prefectures";
import { useFilteredDams } from "@/hooks/useDams";
import { useWeather } from "@/hooks/useWeather";
import DamCardGrid from "@/components/dam/DamCardGrid";
import DamCardSkeleton from "@/components/dam/DamCardSkeleton";
import FilterToggle from "@/components/dam/FilterToggle";
import ErrorFallback from "@/components/common/ErrorFallback";

export const Route = createFileRoute("/$prefectureSlug")({
  component: PrefecturePage,
});

function PrefecturePage() {
  const { prefectureSlug } = Route.useParams();
  const [majorOnly, setMajorOnly] = useState<boolean>(false);

  const prefecture = getPrefectureBySlug(prefectureSlug);
  const {
    dams,
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
        <Link to="/" className="text-sm text-blue-500 hover:text-blue-700">
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
      <Link to="/" className="text-sm text-blue-500 hover:text-blue-700">
        ← 一覧に戻る
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{prefecture.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{dams.length}基のダム</p>
        </div>
        <FilterToggle enabled={majorOnly} onChange={setMajorOnly} />
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
            <p className="mt-2 text-xs text-gray-400">更新日時: {weather.updatedAt}</p>
          )}
          <div className="mt-6">
            <DamCardGrid dams={dams} weather={weather} />
          </div>
        </>
      )}
    </div>
  );
}
