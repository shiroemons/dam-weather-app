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
      <div className="absolute left-0 top-full z-50 mt-1 min-w-52 rounded-lg border border-border-primary bg-surface-elevated p-2 shadow-lg">
        {lists.length > 0 && !isCreating && (
          <>
            {lists.map((list) => {
              const isInList = list.damIds.includes(damId);
              return (
                <label
                  key={list.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-secondary"
                >
                  <input
                    type="checkbox"
                    checked={isInList}
                    onChange={() => handleToggleList(list.id)}
                    className="size-3.5 rounded border-gray-300 text-sky-500"
                  />
                  <span className="text-text-primary">{list.name}</span>
                </label>
              );
            })}
            <hr className="my-1 border-border-primary" />
          </>
        )}
        {isCreating ? (
          <div className="p-1">
            <p className="mb-1.5 text-xs font-medium text-text-primary">
              新しいウォッチリストを作成
            </p>
            <form onSubmit={handleCreateList} className="flex items-center gap-1">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="例: お気に入り、釣りスポット"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
                autoFocus
                className="w-full rounded border border-border-primary px-2 py-1 text-xs bg-surface-elevated text-text-primary"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded bg-accent px-2 py-1 text-xs text-white hover:bg-accent"
              >
                作成
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary"
          >
            + 新しいリストを作成
          </button>
        )}
      </div>
    );
  }

  // Render icon variant
  if (variant === "icon") {
    const tooltipText = inAnyList ? "ウォッチリスト登録済み" : "ウォッチリストに追加";
    return (
      <div className="group/watchlist relative flex items-center" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center leading-none transition-colors ${
            inAnyList ? "text-accent hover:text-accent" : "text-text-tertiary hover:text-accent"
          }`}
          aria-label={tooltipText}
        >
          <Bookmark className="size-4" fill={inAnyList ? "currentColor" : "none"} />
        </button>
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/watchlist:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
          {tooltipText}
        </span>
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
            ? "bg-accent-subtle text-accent hover:bg-accent-subtle"
            : "border border-border-primary bg-surface-secondary text-text-secondary hover:bg-accent-subtle hover:text-accent"
        }`}
      >
        <Bookmark className="size-3.5" fill={inAnyList ? "currentColor" : "none"} />
        {inAnyList ? "ウォッチリスト登録済み" : "ウォッチリストに追加"}
      </button>
      {isOpen && renderDropdown()}
    </div>
  );
}
