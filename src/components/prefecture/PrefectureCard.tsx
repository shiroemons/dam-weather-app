import { Link } from "@tanstack/react-router";
import { Droplets } from "lucide-react";

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
      className="group block rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-sky-200 motion-reduce:hover:scale-100 dark:border-sky-900/30 dark:from-gray-800 dark:to-sky-950/30 dark:hover:border-sky-800/50"
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {prefecture.name}
        </p>
        <Droplets className="size-4 text-sky-400 transition-colors group-hover:text-sky-500 dark:text-sky-500 dark:group-hover:text-sky-400" />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          {prefecture.damCount}基
        </span>
      </div>
    </Link>
  );
}
