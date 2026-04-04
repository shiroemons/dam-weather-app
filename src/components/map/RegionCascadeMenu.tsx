import { useEffect, useMemo, useRef, useState } from "react";
import { PREFECTURES, REGIONS } from "@/data/prefectures";
import type { Dam } from "@/types/dam";

type Props = {
  allDams: Dam[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
};

export default function RegionCascadeMenu({ allDams, selectedFilter, onFilterChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHoveredRegion(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const regionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const region of REGIONS) {
      counts.set(
        region,
        allDams.filter((d) => {
          const p = PREFECTURES.find((pr) => pr.slug === d.prefectureSlug);
          return p?.region === region;
        }).length,
      );
    }
    return counts;
  }, [allDams]);

  const buttonLabel = useMemo((): string => {
    if (!selectedFilter) return `全国 (${allDams.length}基)`;
    if (selectedFilter.startsWith("region:")) {
      const region = selectedFilter.slice(7);
      const count = regionCounts.get(region) ?? 0;
      return `${region} (${count}基)`;
    }
    if (selectedFilter.startsWith("pref:")) {
      const slug = selectedFilter.slice(5);
      const pref = PREFECTURES.find((p) => p.slug === slug);
      const count = allDams.filter((d) => d.prefectureSlug === slug).length;
      return `${pref?.name ?? slug} (${count}基)`;
    }
    return `全国 (${allDams.length}基)`;
  }, [allDams, selectedFilter, regionCounts]);

  function handleSelect(filter: string): void {
    onFilterChange(filter);
    setIsOpen(false);
    setHoveredRegion(null);
  }

  function toggleOpen(): void {
    setIsOpen(!isOpen);
    setHoveredRegion(null);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {buttonLabel}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 flex">
          {/* 左メニュー: 地方リスト */}
          <ul className="min-w-[160px] rounded-lg border border-gray-200 bg-white/95 py-1 shadow-lg backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/95">
            <li>
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${selectedFilter === "" ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}
              >
                全国 ({allDams.length}基)
              </button>
            </li>
            {REGIONS.map((region) => {
              const count = regionCounts.get(region) ?? 0;
              const selectedSlug = selectedFilter.startsWith("pref:")
                ? selectedFilter.slice(5)
                : null;
              const isActive =
                selectedFilter === `region:${region}` ||
                (selectedSlug !== null &&
                  PREFECTURES.find((p) => p.slug === selectedSlug)?.region === region);
              return (
                <li key={region} onMouseEnter={() => setHoveredRegion(region)}>
                  <button
                    type="button"
                    onClick={() => handleSelect(`region:${region}`)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${isActive ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}
                  >
                    <span>
                      {region} ({count}基)
                    </span>
                    <span className="ml-2 text-gray-400">▸</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 右サブメニュー: 都道府県リスト */}
          {hoveredRegion !== null && (
            <ul
              className="min-w-[160px] rounded-lg border border-gray-200 bg-white/95 py-1 shadow-lg backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/95"
              onMouseLeave={() => setHoveredRegion(null)}
            >
              {PREFECTURES.filter((p) => p.region === hoveredRegion).length > 1 && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelect(`region:${hoveredRegion}`)}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${selectedFilter === `region:${hoveredRegion}` ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}
                  >
                    {hoveredRegion}全体 ({regionCounts.get(hoveredRegion) ?? 0}基)
                  </button>
                </li>
              )}
              {PREFECTURES.filter((p) => p.region === hoveredRegion).map((pref) => {
                const count = allDams.filter((d) => d.prefectureSlug === pref.slug).length;
                return (
                  <li key={pref.slug}>
                    <button
                      type="button"
                      onClick={() => handleSelect(`pref:${pref.slug}`)}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${selectedFilter === `pref:${pref.slug}` ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}
                    >
                      {pref.name} ({count}基)
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
