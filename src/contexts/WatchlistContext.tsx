import { createContext, useCallback, useContext, useState } from "react";

import { validateWatchlistImport } from "@/lib/watchlistValidation";
import type { WatchList, WatchlistData } from "@/types/watchlist";

type WatchlistContextValue = {
  data: WatchlistData;
  createList: (name: string) => WatchList;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  addDam: (listId: string, damId: string) => void;
  removeDam: (listId: string, damId: string) => void;
  reorderDams: (listId: string, damIds: string[]) => void;
  isInAnyList: (damId: string) => boolean;
  getListsForDam: (damId: string) => WatchList[];
  exportData: () => string;
  importData: (json: string) => { success: boolean; error?: string; skippedDams: number };
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const STORAGE_KEY = "watchlist";

const DEFAULT_DATA: WatchlistData = { version: 1, lists: [] };

function readData(): WatchlistData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DATA;
    const parsed = JSON.parse(stored) as WatchlistData;
    if (parsed.version === 1 && Array.isArray(parsed.lists)) return parsed;
  } catch {
    // fall through to default
  }
  return DEFAULT_DATA;
}

function persist(data: WatchlistData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

type ProviderProps = {
  children: React.ReactNode;
};

export function WatchlistProvider({ children }: ProviderProps) {
  const [data, setData] = useState<WatchlistData>(readData);

  const createList = useCallback((name: string): WatchList => {
    const now = new Date().toISOString();
    const newList: WatchList = {
      id: crypto.randomUUID(),
      name,
      damIds: [],
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => {
      const next = { ...prev, lists: [...prev.lists, newList] };
      persist(next);
      return next;
    });
    return newList;
  }, []);

  const renameList = useCallback((listId: string, name: string): void => {
    setData((prev) => {
      const next = {
        ...prev,
        lists: prev.lists.map((list) =>
          list.id === listId ? { ...list, name, updatedAt: new Date().toISOString() } : list,
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  const deleteList = useCallback((listId: string): void => {
    setData((prev) => {
      const next = { ...prev, lists: prev.lists.filter((list) => list.id !== listId) };
      persist(next);
      return next;
    });
  }, []);

  const addDam = useCallback((listId: string, damId: string): void => {
    setData((prev) => {
      const next = {
        ...prev,
        lists: prev.lists.map((list) => {
          if (list.id !== listId || list.damIds.includes(damId)) return list;
          return { ...list, damIds: [...list.damIds, damId], updatedAt: new Date().toISOString() };
        }),
      };
      persist(next);
      return next;
    });
  }, []);

  const removeDam = useCallback((listId: string, damId: string): void => {
    setData((prev) => {
      const next = {
        ...prev,
        lists: prev.lists.map((list) => {
          if (list.id !== listId) return list;
          return {
            ...list,
            damIds: list.damIds.filter((id) => id !== damId),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
      persist(next);
      return next;
    });
  }, []);

  const reorderDams = useCallback((listId: string, damIds: string[]): void => {
    setData((prev) => {
      const next = {
        ...prev,
        lists: prev.lists.map((list) =>
          list.id === listId ? { ...list, damIds, updatedAt: new Date().toISOString() } : list,
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  const isInAnyList = useCallback(
    (damId: string): boolean => data.lists.some((list) => list.damIds.includes(damId)),
    [data.lists],
  );

  const getListsForDam = useCallback(
    (damId: string): WatchList[] => data.lists.filter((list) => list.damIds.includes(damId)),
    [data.lists],
  );

  const exportData = useCallback(
    (): string => JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2),
    [data],
  );

  const importData = useCallback(
    (json: string): { success: boolean; error?: string; skippedDams: number } => {
      const existingNames = data.lists.map((l) => l.name);
      const result = validateWatchlistImport(json, existingNames);
      if (!result.success) {
        return { success: false, error: result.error, skippedDams: result.skippedDams };
      }
      setData((prev) => {
        const next = {
          ...prev,
          lists: [...prev.lists, ...(result.data?.lists ?? [])],
        };
        persist(next);
        return next;
      });
      return { success: true, skippedDams: result.skippedDams };
    },
    [data.lists],
  );

  return (
    <WatchlistContext.Provider
      value={{
        data,
        createList,
        renameList,
        deleteList,
        addDam,
        removeDam,
        reorderDams,
        isInAnyList,
        getListsForDam,
        exportData,
        importData,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
