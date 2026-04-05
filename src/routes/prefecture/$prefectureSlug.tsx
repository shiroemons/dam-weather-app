import { useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPrefectureBySlug } from "@/data/prefectures";
import { PURPOSE_SHORT_MAP, PURPOSE_SHORT_TO_LABEL } from "@/data/purposes";
import { DAM_TYPE_LABEL_TO_SHORT, DAM_TYPE_SHORT_TO_LABEL } from "@/data/damTypes";
import { useFilteredDams } from "@/hooks/useDams";
import { useStorage } from "@/hooks/useStorage";
import { useWeather } from "@/hooks/useWeather";
import DamGroupedGrid from "@/components/dam/DamGroupedGrid";
import DamCardSkeleton from "@/components/dam/DamCardSkeleton";
import DamListView from "@/components/dam/DamListView";
import DamSearchInput from "@/components/dam/DamSearchInput";
import DamTypeFilter from "@/components/dam/DamTypeFilter";
import FilterToggle from "@/components/dam/FilterToggle";
import GroupBySelector from "@/components/dam/GroupBySelector";
import PurposeFilter from "@/components/dam/PurposeFilter";
import ViewModeSelector from "@/components/dam/ViewModeSelector";
import type { GroupByMode } from "@/components/dam/DamGroupedGrid";
import ErrorFallback from "@/components/common/ErrorFallback";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import type { ViewMode, SortField, SortDirection } from "@/lib/sortDams";

export const Route = createFileRoute("/prefecture/$prefectureSlug")({
  validateSearch: (search: Record<string, unknown>) => ({
    obs: search.obs === true || search.obs === "true" ? true : false,
    group: search.group === "municipality" ? ("municipality" as const) : ("waterSystem" as const),
    purposes: typeof search.purposes === "string" ? search.purposes : "",
    types: typeof search.types === "string" ? search.types : "",
    q: typeof search.q === "string" ? search.q : "",
    view: search.view === "list" ? ("list" as const) : ("grid" as const),
    sort:
      search.sort === "capacity" ||
      search.sort === "rate" ||
      search.sort === "waterSystem" ||
      search.sort === "river" ||
      search.sort === "damType"
        ? (search.sort as SortField)
        : ("name" as const),
    order: search.order === "desc" ? ("desc" as const) : ("asc" as const),
  }),
  head: ({ params }) => {
    const prefecture = getPrefectureBySlug(params.prefectureSlug);
    if (!prefecture) {
      return {
        meta: [{ title: `ページが見つかりません | ${SITE_NAME}` }],
      };
    }
    const title = `${prefecture.name}のダム天気 | ${SITE_NAME}`;
    const description = `${prefecture.name}にある${prefecture.damCount}基のダムの天気予報。ダム周辺の天気を確認できます。`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/prefecture/${prefecture.slug}` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url: `${SITE_URL}/prefecture/${prefecture.slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: `${SITE_URL}/prefecture`,
            },
          },
        },
      ],
      links: [
        {
          rel: "canonical",
          href: `${SITE_URL}/prefecture/${prefecture.slug}`,
        },
      ],
    };
  },
  component: PrefecturePage,
});

function PrefecturePage() {
  const { prefectureSlug } = Route.useParams();
  const { obs, group, purposes, types, q, view, sort, order } = Route.useSearch();
  const navigate = Route.useNavigate();

  useEffect(() => {
    void navigate({
      search: { obs, group, purposes, types, q, view, sort, order },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPurposes = useMemo(
    () =>
      new Set(
        purposes
          ? (purposes
              .split(",")
              .map((s) => PURPOSE_SHORT_TO_LABEL.get(s))
              .filter(Boolean) as string[])
          : [],
      ),
    [purposes],
  );
  const selectedTypes = useMemo(
    () =>
      new Set(
        types
          ? (types
              .split(",")
              .map((s) => DAM_TYPE_SHORT_TO_LABEL.get(s))
              .filter(Boolean) as string[])
          : [],
      ),
    [types],
  );

  function setObsOnly(value: boolean): void {
    void navigate({
      search: (prev) => ({ ...prev, obs: value }),
      replace: true,
    });
  }

  function setGroupBy(value: GroupByMode): void {
    void navigate({
      search: (prev) => ({ ...prev, group: value }),
      replace: true,
    });
  }

  function setSelectedPurposes(selected: Set<string>): void {
    const codes = Array.from(selected)
      .map((label) => PURPOSE_SHORT_MAP.get(label))
      .filter(Boolean)
      .join(",");
    void navigate({
      search: (prev) => ({ ...prev, purposes: codes }),
      replace: true,
    });
  }

  function setKeyword(value: string): void {
    void navigate({
      search: (prev) => ({ ...prev, q: value }),
      replace: true,
    });
  }

  function setSelectedTypes(selected: Set<string>): void {
    const codes = Array.from(selected)
      .map((label) => DAM_TYPE_LABEL_TO_SHORT.get(label))
      .filter(Boolean)
      .join(",");
    void navigate({
      search: (prev) => ({ ...prev, types: codes }),
      replace: true,
    });
  }

  function setViewMode(mode: ViewMode): void {
    void navigate({
      search: (prev) => ({ ...prev, view: mode }),
      replace: true,
    });
  }

  function setSortParams(field: SortField, direction: SortDirection): void {
    void navigate({
      search: (prev) => ({ ...prev, sort: field, order: direction }),
      replace: true,
    });
  }

  const prefecture = getPrefectureBySlug(prefectureSlug);
  const {
    dams,
    totalCount,
    availablePurposes,
    availableTypes,
    isLoading: damsLoading,
    isError: damsError,
  } = useFilteredDams(prefectureSlug, obs, selectedPurposes, selectedTypes, q);
  const {
    data: weather,
    isLoading: weatherLoading,
    isError: weatherError,
    refetch,
  } = useWeather(prefectureSlug);
  const { data: storageData } = useStorage(prefectureSlug);

  if (!prefecture) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/prefecture" className="text-sm text-blue-500 hover:text-blue-700">
          ← 一覧に戻る
        </Link>
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">404</p>
          <p className="mt-2 text-gray-500 dark:text-gray-400">都道府県が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/prefecture" className="text-sm text-blue-500 hover:text-blue-700">
        ← 一覧に戻る
      </Link>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{prefecture.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {dams.length}基のダム{obs && totalCount > dams.length && ` / 全${totalCount}基`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end md:gap-4 md:self-auto">
          {view === "grid" && <GroupBySelector value={group} onChange={setGroupBy} />}
          <ViewModeSelector value={view} onChange={setViewMode} />
          <FilterToggle enabled={obs} onChange={setObsOnly} />
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-lg bg-gray-100 p-4 dark:bg-gray-800/50">
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            ダム名で検索
          </p>
          <DamSearchInput value={q} onChange={setKeyword} />
        </div>

        {availablePurposes.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              用途で絞り込み
            </p>
            <PurposeFilter
              selected={selectedPurposes}
              available={availablePurposes}
              onChange={setSelectedPurposes}
            />
          </div>
        )}

        {availableTypes.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              ダム型式で絞り込み
            </p>
            <DamTypeFilter
              selected={selectedTypes}
              available={availableTypes}
              onChange={setSelectedTypes}
            />
          </div>
        )}
      </div>

      {(damsLoading || weatherLoading) && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DamCardSkeleton key={i} />
          ))}
        </div>
      )}

      {(damsError || weatherError) && (
        <div className="mt-6">
          <ErrorFallback resetErrorBoundary={() => refetch()} />
        </div>
      )}

      {!damsLoading && !weatherLoading && !damsError && !weatherError && (
        <>
          {weather?.updatedAt && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              更新日時:{" "}
              {new Date(weather.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}
          <div className="mt-6">
            {view === "grid" ? (
              <DamGroupedGrid dams={dams} weather={weather} storage={storageData} groupBy={group} />
            ) : (
              <DamListView
                dams={dams}
                weather={weather}
                storage={storageData}
                sortField={sort}
                sortDirection={order}
                onSort={setSortParams}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
