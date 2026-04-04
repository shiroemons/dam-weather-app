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
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-sky-400 hover:text-sky-500 dark:border-gray-600 dark:text-gray-400"
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
        onClick={handleCancel}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        キャンセル
      </button>
    </form>
  );
}
