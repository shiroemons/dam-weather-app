import { Link } from "@tanstack/react-router";

import type { Prefecture } from "@/types/prefecture";

type Props = {
  prefecture: Prefecture;
};

export default function PrefectureCard({ prefecture }: Props) {
  return (
    <Link
      to="/prefecture/$prefectureSlug"
      params={{ prefectureSlug: prefecture.slug }}
      search={{ obs: true, group: "waterSystem", purposes: "", types: "" }}
      className="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-gray-800"
    >
      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{prefecture.name}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{prefecture.damCount}基</p>
    </Link>
  );
}
