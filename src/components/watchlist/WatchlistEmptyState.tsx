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
      <ClipboardList className="size-16 text-text-tertiary" />
      <h2 className="mt-4 text-lg font-semibold text-text-primary">
        ウォッチリストはまだありません
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
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
              className="rounded-lg border border-border-primary px-3 py-2 text-sm bg-surface-elevated text-text-primary"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent"
            >
              作成
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setName("");
              }}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent"
          >
            <Plus className="size-4" />
            最初のリストを作成する
          </button>
        )}
      </div>
    </div>
  );
}
