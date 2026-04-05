import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, CloudRain, ExternalLink } from "lucide-react";

import type { Dam } from "@/types/dam";
import type { DamStorage, PrefectureStorage } from "@/types/storage";
import type { DamWeather, PrefectureWeather } from "@/types/weather";
import type { SortDirection, SortField } from "@/lib/sortDams";
import { sortDams } from "@/lib/sortDams";
import { getYahooRadarUrl } from "@/lib/externalLinks";
import WeatherIcon from "@/components/weather/WeatherIcon";
import WatchlistAddButton from "@/components/watchlist/WatchlistAddButton";

type Props = {
  dams: Dam[];
  weather: PrefectureWeather | undefined;
  storage?: PrefectureStorage;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField, direction: SortDirection) => void;
};

const SORT_DEFAULTS: Record<SortField, SortDirection> = {
  name: "asc",
  waterSystem: "asc",
  river: "asc",
  damType: "asc",
  capacity: "desc",
  rate: "desc",
};

export default function DamListView({
  dams,
  weather,
  storage,
  sortField,
  sortDirection,
  onSort,
}: Props) {
  function handleHeaderSort(field: SortField): void {
    if (field === sortField) {
      onSort(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSort(field, SORT_DEFAULTS[field]);
    }
  }
  const storageMap = useMemo<Map<string, DamStorage>>(() => {
    if (!storage?.dams) return new Map();
    return new Map(storage.dams.map((d) => [d.damId, d]));
  }, [storage]);

  const weatherMap = useMemo<Map<string, DamWeather>>(() => {
    if (!weather?.dams) return new Map();
    return new Map(weather.dams.map((d) => [d.damId, d]));
  }, [weather]);

  const sortedDams = useMemo(
    () => sortDams(dams, storageMap, sortField, sortDirection),
    [dams, storageMap, sortField, sortDirection],
  );

  if (dams.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500 dark:text-gray-400">ダムが見つかりません</p>
    );
  }

  return (
    <>
      {/* デスクトップ: テーブル表示 */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <th className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("name")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                >
                  ダム名
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </button>
              </th>
              <th className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("waterSystem")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                >
                  水系
                  {sortField === "waterSystem" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </button>
              </th>
              <th className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("river")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                >
                  河川
                  {sortField === "river" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </button>
              </th>
              <th className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("damType")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                >
                  ダム型式
                  {sortField === "damType" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </button>
              </th>
              <th className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("capacity")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                >
                  総貯水容量
                  {sortField === "capacity" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </button>
              </th>
              <th className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("rate")}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                >
                  貯水率
                  {sortField === "rate" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </button>
              </th>
              <th className="px-3 py-2">今日</th>
              <th className="px-3 py-2">明日</th>
              <th className="px-3 py-2 text-center">雨雲レーダー</th>
            </tr>
          </thead>
          <tbody>
            {sortedDams.map((dam) => {
              const damStorage = storageMap.get(dam.id);
              const storageRate = damStorage?.storageRate ?? null;
              const damWeather = weatherMap.get(dam.id);
              const riverInfoUrl =
                dam.riverUrl ??
                `https://www.river.go.jp/kawabou/pc/tm?zm=15&clat=${dam.latitude}&clon=${dam.longitude}&itmkndCd=7&mapType=0`;

              return (
                <tr
                  key={dam.id}
                  className="border-b border-gray-100 even:bg-gray-50/50 hover:bg-blue-50/30 dark:border-gray-700/50 dark:even:bg-gray-800/30 dark:hover:bg-gray-700/30"
                >
                  {/* ダム名 */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <WatchlistAddButton damId={dam.id} variant="icon" />
                      <a
                        href={riverInfoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex transition-colors hover:text-blue-500 ${dam.riverUrl ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <Link
                        to="/dam/$damId"
                        params={{ damId: dam.id }}
                        className="font-medium text-gray-900 hover:text-blue-500 dark:text-gray-100 dark:hover:text-blue-400"
                      >
                        {dam.damName}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{dam.address}</div>
                  </td>

                  {/* 水系 */}
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{dam.waterSystem}</td>

                  {/* 河川 */}
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{dam.riverName}</td>

                  {/* ダム型式 */}
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {dam.damType || ""}
                  </td>

                  {/* 総貯水容量 */}
                  <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300">
                    {dam.totalStorageCapacity != null ? (
                      <span>{dam.totalStorageCapacity.toLocaleString()}千m³</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>

                  {/* 貯水率 */}
                  <td className="px-3 py-3">
                    {storageRate != null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-600">
                          <div
                            className="h-2 rounded-full bg-blue-400 dark:bg-blue-500"
                            style={{ width: `${Math.min(storageRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-600 dark:text-gray-300">{storageRate}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>

                  {/* 今日の天気 */}
                  <td className="px-3 py-3">
                    {damWeather ? (
                      <div className="flex items-center gap-1">
                        <WeatherIcon code={damWeather.today.weatherCode} size="sm" />
                        <div className="text-xs">
                          <span className="text-red-500">{damWeather.today.tempMax ?? "--"}°</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-blue-500">{damWeather.today.tempMin ?? "--"}°</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>

                  {/* 明日の天気 */}
                  <td className="px-3 py-3">
                    {damWeather ? (
                      <div className="flex items-center gap-1">
                        <WeatherIcon code={damWeather.tomorrow.weatherCode} size="sm" />
                        <div className="text-xs">
                          <span className="text-red-500">
                            {damWeather.tomorrow.tempMax ?? "--"}°
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-blue-500">
                            {damWeather.tomorrow.tempMin ?? "--"}°
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>

                  {/* 雨雲レーダー */}
                  <td className="px-3 py-3 text-center">
                    <a
                      href={getYahooRadarUrl(dam.latitude, dam.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                    >
                      <CloudRain className="size-3.5" />
                      <ExternalLink className="size-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* モバイル: コンパクトカード表示 */}
      <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-700/50">
        {sortedDams.map((dam) => {
          const damStorage = storageMap.get(dam.id);
          const storageRate = damStorage?.storageRate ?? null;
          const damWeather = weatherMap.get(dam.id);
          const riverInfoUrl =
            dam.riverUrl ??
            `https://www.river.go.jp/kawabou/pc/tm?zm=15&clat=${dam.latitude}&clon=${dam.longitude}&itmkndCd=7&mapType=0`;

          return (
            <div key={dam.id} className="px-2 py-3 even:bg-gray-50/50 dark:even:bg-gray-800/30">
              <div className="flex items-center gap-2">
                {damWeather ? (
                  <WeatherIcon code={damWeather.today.weatherCode} size="sm" />
                ) : (
                  <div className="size-6" />
                )}
                <Link
                  to="/dam/$damId"
                  params={{ damId: dam.id }}
                  className="min-w-0 flex-1 truncate font-medium text-gray-900 hover:text-blue-500 dark:text-gray-100"
                >
                  {dam.damName}
                </Link>
                {storageRate != null && (
                  <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {storageRate}%
                  </span>
                )}
                <a
                  href={riverInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex shrink-0 transition-colors hover:text-blue-500 ${dam.riverUrl ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`}
                >
                  <ExternalLink className="size-3.5" />
                </a>
                <WatchlistAddButton damId={dam.id} variant="icon" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
