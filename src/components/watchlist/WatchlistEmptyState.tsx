import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";

import { useWatchlist } from "@/contexts/WatchlistContext";

export default function WatchlistEmptyState() {
  const { createList } = useWatchlist();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createList(trimmed);
    setName("");
    setIsOpen(false);
  }

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
      <div className="mt-6">
        {isOpen ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: お気に入り、釣りスポット"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              autoFocus
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              作成
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setName("");
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-600"
          >
            <Plus className="size-4" />
            最初のリストを作成する
          </button>
        )}
      </div>
    </div>
  );
}
