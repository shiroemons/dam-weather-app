import { useState } from "react";

import { Plus } from "lucide-react";

import { useWatchlist } from "@/contexts/WatchlistContext";

export default function WatchlistCreateForm() {
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

  function handleCancel() {
    setName("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border-primary px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="size-4" />
        新しいリストを作成
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="リスト名を入力"
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
        onClick={handleCancel}
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        キャンセル
      </button>
    </form>
  );
}
