import { Link } from "@tanstack/react-router";

import type { Prefecture } from "@/types/prefecture";

type Props = {
  prefecture: Prefecture;
};

export default function PrefectureCard({ prefecture }: Props) {
  return (
    <Link
      to="/$prefectureSlug"
      params={{ prefectureSlug: prefecture.slug }}
      className="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <p className="text-base font-semibold text-gray-900">{prefecture.name}</p>
      <p className="mt-1 text-sm text-gray-500">{prefecture.damCount}基</p>
    </Link>
  );
}
