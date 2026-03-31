import { createFileRoute } from "@tanstack/react-router";

import PrefectureGrid from "@/components/prefecture/PrefectureGrid";
import { getRegionsWithPrefectures } from "@/data/prefectures";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage(): JSX.Element {
  const regions = getRegionsWithPrefectures();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">ダム天気</h1>
        <p className="mt-2 text-gray-500">全国のダムの天気をチェック</p>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {regions.map(({ region, prefectures }) => (
          <PrefectureGrid key={region} region={region} prefectures={prefectures} />
        ))}
      </div>
    </div>
  );
}
