import type { Dam } from "@/types/dam";
import type { DamStorage } from "@/types/storage";
import type { DamWeather } from "@/types/weather";

import { Link } from "@tanstack/react-router";
import { ExternalLink, X, CloudRain, Droplets, Waves } from "lucide-react";
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
    <div
      className={`flex flex-col rounded-xl p-5 transition-all duration-200 hover:shadow-md ${getWeatherCardClasses(weather?.today.weatherCode)}`}
    >
      {/* ヘッダー: ダム名 + ダム種別 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to="/dam/$damId"
            params={{ damId: dam.id }}
            className="block truncate text-lg font-bold tracking-tight text-text-primary transition-colors hover:text-accent"
          >
            {dam.damName}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-text-secondary">
            <Droplets className="size-3 shrink-0 text-accent/70" />
            {dam.waterSystem}
            <span className="text-text-tertiary">·</span>
            <Waves className="size-3 shrink-0 text-blue-400/70" />
            {dam.riverName}
          </p>
        </div>
        {dam.damType && (
          <span className="shrink-0 rounded border border-border-primary bg-surface-elevated/60 px-2 py-0.5 text-[10px] font-bold text-text-secondary backdrop-blur-sm">
            {dam.damType}
          </span>
        )}
      </div>

      {/* 天気 Bento ブロック */}
      {weather === undefined ? (
        <div className="mt-4 rounded-lg border border-border-secondary bg-surface-primary px-4 py-6 text-center text-sm text-text-tertiary">
          天気情報を取得できません
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <DayWeather forecast={weather.today} label="今日" />
          <DayWeather forecast={weather.tomorrow} label="明日" />
        </div>
      )}

      {/* 貯水率プログレスバー */}
      {storage?.storageRate != null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-end justify-between">
            <p className="text-[11px] font-bold tracking-wide text-text-secondary">貯水率</p>
            <p className="font-mono text-sm font-bold text-text-primary">
              {storage.storageRate}
              <span className="ml-0.5 text-[10px] text-text-tertiary">%</span>
            </p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full border border-border-secondary bg-surface-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(storage.storageRate, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* フッター: メタ情報 + アクション */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="flex min-w-0 items-baseline gap-1.5">
          {dam.purposes.some((p) => PURPOSE_SHORT_MAP.has(p)) && (
            <div className="flex items-baseline gap-1">
              {dam.purposes.map((purpose) => {
                const short = PURPOSE_SHORT_MAP.get(purpose);
                return short ? (
                  <span key={purpose} className="group/tooltip relative">
                    <span className="cursor-default rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium leading-none text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
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
          {dam.address && (
            <span className="truncate text-[10px] text-text-tertiary">{dam.municipality}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={yahooRadarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-tertiary transition-colors hover:text-accent"
            aria-label="雨雲レーダー"
          >
            <CloudRain className="size-3.5" />
          </a>
          <span className="group/link-tooltip relative inline-flex">
            <a
              href={riverInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex transition-colors hover:text-accent ${dam.riverUrl ? "text-accent" : "text-text-tertiary"}`}
              aria-label="川の防災情報"
            >
              <ExternalLink className="size-3.5" />
            </a>
            <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/link-tooltip:opacity-100 after:absolute after:right-1 after:top-full after:border-4 after:border-transparent after:border-t-gray-800">
              {dam.riverUrl ? "川の防災情報（詳細）" : "川の防災情報（地図）"}
            </span>
          </span>
          {!onRemove && <WatchlistAddButton damId={dam.id} variant="icon" />}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex text-text-tertiary transition-colors hover:text-red-500 dark:hover:text-red-400"
              aria-label={`${dam.damName}をリストから削除`}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
