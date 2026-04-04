import { useRef, useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useWatchlist } from "@/contexts/WatchlistContext";

type Props = {
  damId: string;
  variant: "icon" | "button";
};

export default function WatchlistAddButton({ damId, variant }: Props) {
  const { data, createList, addDam, removeDam, isInAnyList } = useWatchlist();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inAnyList = isInAnyList(damId);
  const lists = data.lists;

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewListName("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // Prevent Link navigation in DamCard/popup
    e.stopPropagation();

    if (lists.length === 0) {
      setIsOpen(true);
      setIsCreating(true);
      return;
    }

    if (lists.length === 1) {
      const list = lists[0];
      if (list.damIds.includes(damId)) {
        removeDam(list.id, damId);
      } else {
        addDam(list.id, damId);
      }
      return;
    }

    setIsOpen(!isOpen);
  }

  function handleToggleList(listId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    if (list.damIds.includes(damId)) {
      removeDam(listId, damId);
    } else {
      addDam(listId, damId);
    }
  }

  function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const newList = createList(trimmed);
    addDam(newList.id, damId);
    setNewListName("");
    setIsCreating(false);
  }

  function renderDropdown() {
    return (
      <div className="absolute left-0 top-full z-50 mt-1 min-w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {lists.length > 0 && !isCreating && (
          <>
            {lists.map((list) => {
              const isInList = list.damIds.includes(damId);
              return (
                <label
                  key={list.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={isInList}
                    onChange={() => handleToggleList(list.id)}
                    className="size-3.5 rounded border-gray-300 text-sky-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{list.name}</span>
                </label>
              );
            })}
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
          </>
        )}
        {isCreating ? (
          <form onSubmit={handleCreateList} className="flex items-center gap-1 p-1">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="リスト名"
              autoFocus
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              className="whitespace-nowrap rounded bg-sky-500 px-2 py-1 text-xs text-white hover:bg-sky-600"
            >
              作成
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            + 新しいリストを作成
          </button>
        )}
      </div>
    );
  }

  // Render icon variant
  if (variant === "icon") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleClick}
          className={`transition-colors ${
            inAnyList
              ? "text-sky-500 hover:text-sky-600"
              : "text-gray-300 hover:text-sky-400 dark:text-gray-600 dark:hover:text-sky-400"
          }`}
          aria-label={inAnyList ? "ウォッチリストから削除" : "ウォッチリストに追加"}
        >
          <Bookmark className="size-4" fill={inAnyList ? "currentColor" : "none"} />
        </button>
        {isOpen && renderDropdown()}
      </div>
    );
  }

  // Render button variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
          inAnyList
            ? "bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
            : "bg-gray-100 text-gray-600 hover:bg-sky-50 hover:text-sky-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-sky-900/30 dark:hover:text-sky-400"
        }`}
      >
        <Bookmark className="size-3.5" fill={inAnyList ? "currentColor" : "none"} />
        {inAnyList ? "ウォッチリスト登録済み" : "ウォッチリストに追加"}
      </button>
      {isOpen && renderDropdown()}
    </div>
  );
}
