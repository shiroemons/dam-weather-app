import { ClipboardList } from "lucide-react";

export default function WatchlistEmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center">
      <ClipboardList className="size-16 text-gray-300 dark:text-gray-600" />
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        ウォッチリストはまだありません
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        気になるダムをリストにまとめて
        <br />
        天気をまとめてチェックしましょう
      </p>
    </div>
  );
}
