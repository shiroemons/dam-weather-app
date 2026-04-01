import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, List } from "lucide-react";
import { SITE_NAME } from "@/config/seo";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [{ title: `ページが見つかりません | ${SITE_NAME}` }],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-gray-200 dark:text-gray-700">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        ページが見つかりませんでした
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        お探しのページは移動または削除された可能性があります。
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600"
        >
          <Home className="size-4" />
          ホーム
        </Link>
        <Link
          to="/prefecture"
          className="flex items-center gap-2 rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <List className="size-4" />
          都道府県一覧
        </Link>
      </div>
    </div>
  );
}
