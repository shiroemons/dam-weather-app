import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPrefectureBySlug } from "@/data/prefectures";
import { useFilteredDams } from "@/hooks/useDams";
import { useWeather } from "@/hooks/useWeather";
import DamCardGrid from "@/components/dam/DamCardGrid";
import FilterToggle from "@/components/dam/FilterToggle";

export const Route = createFileRoute("/$prefectureSlug")({
  component: PrefecturePage,
});

function PrefecturePage(): JSX.Element {
  const { prefectureSlug } = Route.useParams();
  const [majorOnly, setMajorOnly] = useState<boolean>(false);

  const prefecture = getPrefectureBySlug(prefectureSlug);
  const dams = useFilteredDams(prefectureSlug, majorOnly);
  const { data: weather, isLoading, isError } = useWeather(prefectureSlug);

  if (!prefecture) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-500">都道府県が見つかりません</p>
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

      {isLoading && (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-red-500">天気情報の取得に失敗しました</p>
      )}

      {weather?.updatedAt && (
        <p className="mt-2 text-xs text-gray-400">
          更新日時: {weather.updatedAt}
        </p>
      )}

      <div className="mt-6">
        <DamCardGrid dams={dams} weather={weather} />
      </div>
    </div>
  );
}
