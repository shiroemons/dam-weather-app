import type { Dam } from "@/types/dam";
import type { DamStorage } from "@/types/storage";
import type { DamWeather } from "@/types/weather";

import { Link } from "@tanstack/react-router";
import { Activity, MapPin, Droplets, Waves, Box, ExternalLink, X, CloudRain } from "lucide-react";
import DayWeather from "@/components/weather/DayWeather";
import WatchlistAddButton from "@/components/watchlist/WatchlistAddButton";
import { PURPOSE_SHORT_MAP } from "@/data/purposes";
import { getWeatherCardClasses } from "@/lib/weatherColors";
import { getYahooRadarUrl } from "@/lib/externalLinks";

type Props = {
  dam: Dam;
  weather: DamWeather | undefined;
  storage?: DamStorage;
  onRemove?: () => void;
};

export default function DamCard({ dam, weather, storage, onRemove }: Props) {
  const riverInfoUrl =
    dam.riverUrl ??
    `https://www.river.go.jp/kawabou/pc/tm?zm=15&clat=${dam.latitude}&clon=${dam.longitude}&itmkndCd=7&mapType=0`;
  const yahooRadarUrl = getYahooRadarUrl(dam.latitude, dam.longitude);

  return (
    <div className={`rounded-xl p-5 ${getWeatherCardClasses(weather?.today.weatherCode)}`}>
      {/* 1行目: ダム名 + 外部リンク */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/dam/$damId"
          params={{ damId: dam.id }}
          className="truncate text-lg font-semibold text-gray-900 transition-colors hover:text-blue-500 dark:text-gray-100 dark:hover:text-blue-400"
        >
          {dam.damName}
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {!onRemove && <WatchlistAddButton damId={dam.id} variant="icon" />}
          <span className="group/link-tooltip relative inline-flex">
            <a
              href={riverInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex transition-colors hover:text-blue-500 ${dam.riverUrl ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`}
            >
              <ExternalLink className="size-4" />
            </a>
            <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/link-tooltip:opacity-100 after:absolute after:right-1 after:top-full after:border-4 after:border-transparent after:border-t-gray-800">
              {dam.riverUrl ? "川の防災情報（詳細）" : "川の防災情報（地図）"}
            </span>
          </span>
          {onRemove && (
            <span className="group/remove relative inline-flex">
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex text-gray-400 transition-colors hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                aria-label={`${dam.damName}をリストから削除`}
              >
                <X className="size-4" />
              </button>
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/remove:opacity-100 after:absolute after:right-1 after:top-full after:border-4 after:border-transparent after:border-t-gray-800">
                リストから削除
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 2行目: 用途 */}
      {dam.purposes.some((p) => PURPOSE_SHORT_MAP.has(p)) && (
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <span className="text-gray-500 dark:text-gray-400">用途：</span>
          {dam.purposes.map((purpose) => {
            const short = PURPOSE_SHORT_MAP.get(purpose);
            return short ? (
              <span key={purpose} className="group/tooltip relative">
                <span className="cursor-default rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  {short}
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
                  {purpose}
                </span>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* 3行目: ダム種別 */}
      {dam.damType && (
        <div className="mt-1">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400">
            {dam.damType}
          </span>
        </div>
      )}

      <div className="mt-2 space-y-1">
        {dam.address && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="size-3.5 shrink-0 text-rose-400" />
            <span>{dam.address}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Droplets className="size-3.5 shrink-0 text-cyan-400" />
          <span>{dam.waterSystem}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Waves className="size-3.5 shrink-0 text-blue-400" />
          <span>{dam.riverName}</span>
        </div>
        {dam.totalStorageCapacity != null && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Box className="size-3.5 shrink-0 text-emerald-400" />
            <span>{dam.totalStorageCapacity.toLocaleString()}千m³</span>
          </div>
        )}
        <div
          className={`flex items-center gap-1.5 text-sm ${storage?.storageRate != null ? "text-gray-500 dark:text-gray-400" : "invisible"}`}
        >
          <Activity className="size-3.5 shrink-0 text-violet-400" />
          <span>貯水率 {storage?.storageRate ?? 0}%</span>
        </div>
      </div>

      {weather === undefined ? (
        <div className="mt-4 rounded-xl bg-gray-100/50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
          天気情報を取得できません
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <DayWeather forecast={weather.today} label="今日" />
            </div>
            <div className="flex-1">
              <DayWeather forecast={weather.tomorrow} label="明日" />
            </div>
          </div>
          <a
            href={yahooRadarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-end gap-1 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <CloudRain className="size-3" />
            <span>雨雲レーダー</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  );
}
