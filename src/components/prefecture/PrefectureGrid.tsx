import type { Prefecture } from "@/types/prefecture";

import PrefectureCard from "./PrefectureCard";

type Props = {
  region: string;
  prefectures: Prefecture[];
};

export default function PrefectureGrid({ region, prefectures }: Props) {
  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold text-gray-900">{region}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {prefectures.map((prefecture) => (
          <PrefectureCard key={prefecture.code} prefecture={prefecture} />
        ))}
      </div>
    </div>
  );
}
