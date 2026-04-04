import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  Building2,
  Calendar,
  ChevronRight,
  CloudRain,
  Droplets,
  ExternalLink,
  Gauge,
  MapPin,
  Mountain,
  Waves,
} from "lucide-react";
import { getDamById, useDamById } from "@/hooks/useAllDams";
import { useStorage } from "@/hooks/useStorage";
import { useWeather } from "@/hooks/useWeather";
import DayWeather from "@/components/weather/DayWeather";
import { PURPOSE_SHORT_MAP } from "@/data/purposes";
import { getWeatherCardClasses } from "@/lib/weatherColors";
import { getYahooRadarUrl } from "@/lib/externalLinks";
import WatchlistAddButton from "@/components/watchlist/WatchlistAddButton";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import "leaflet/dist/leaflet.css";

const MapView = lazy(() => import("@/components/map/MapView"));

export const Route = createFileRoute("/dam/$damId")({
  head: ({ params }) => {
    const dam = getDamById(params.damId);
    if (!dam) {
      return {
        meta: [{ title: `ページが見つかりません | ${SITE_NAME}` }],
      };
    }
    const title = `${dam.damName}の天気 | ${SITE_NAME}`;
    const description = `${dam.prefecture}${dam.municipality}にある${dam.damName}（${dam.damType}）の天気予報。`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/dam/${dam.id}` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "Place",
            name: dam.damName,
            description,
            url: `${SITE_URL}/dam/${dam.id}`,
            geo: {
              "@type": "GeoCoordinates",
              latitude: dam.latitude,
              longitude: dam.longitude,
            },
            address: {
              "@type": "PostalAddress",
              addressRegion: dam.prefecture,
              addressLocality: dam.municipality,
            },
          },
        },
      ],
    };
  },
  component: DamDetailPage,
});

function DamDetailPage() {
  const { damId } = Route.useParams();
  const dam = useDamById(damId);
  const { data: weather, isLoading: weatherLoading } = useWeather(dam?.prefectureSlug ?? "");
  const { data: storage } = useStorage(dam?.prefectureSlug ?? "");

  if (!dam) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/" className="text-sm text-blue-500 hover:text-blue-700">
          ← ホームに戻る
        </Link>
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">404</p>
          <p className="mt-2 text-gray-500 dark:text-gray-400">ダムが見つかりません</p>
        </div>
      </div>
    );
  }

  const damWeather = weather?.dams.find((w) => w.damId === damId);
  const damStorage = storage?.dams.find((s) => s.damId === damId);
  const riverInfoUrl =
    dam.riverUrl ??
    `https://www.river.go.jp/kawabou/pc/tm?zm=15&clat=${dam.latitude}&clon=${dam.longitude}&itmkndCd=7&mapType=0`;
  const yahooRadarUrl = getYahooRadarUrl(dam.latitude, dam.longitude);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-blue-500">
          ホーム
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          to="/prefecture/$prefectureSlug"
          params={{ prefectureSlug: dam.prefectureSlug }}
          search={{ obs: true, group: "waterSystem", purposes: "", types: "", q: "" }}
          className="hover:text-blue-500"
        >
          {dam.prefecture}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-gray-900 dark:text-gray-100">{dam.damName}</span>
      </nav>

      {/* Dam Header */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dam.damName}</h1>
          <WatchlistAddButton damId={dam.id} variant="button" />
          <a
            href={riverInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            川の防災情報
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {dam.damType && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              {dam.damType}
            </span>
          )}
          {dam.purposes.map((purpose) => {
            const short = PURPOSE_SHORT_MAP.get(purpose);
            return short ? (
              <span
                key={purpose}
                className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                title={purpose}
              >
                {short}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* Weather Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">天気予報</h2>
        {weatherLoading ? (
          <div className="mt-3 h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
        ) : damWeather ? (
          <div
            className={`mt-3 rounded-2xl bg-gradient-to-br p-5 ${getWeatherCardClasses(damWeather.today.weatherCode)}`}
          >
            <div className="grid grid-cols-2 gap-4">
              <DayWeather forecast={damWeather.today} label="今日" />
              <DayWeather forecast={damWeather.tomorrow} label="明日" />
            </div>
            {weather?.updatedAt && (
              <p className="mt-3 text-right text-xs text-gray-400 dark:text-gray-500">
                更新:{" "}
                {new Date(weather.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
              </p>
            )}
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
        ) : (
          <div className="mt-3 rounded-2xl bg-gray-100/50 px-4 py-8 text-center text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
            天気情報を取得できません
          </div>
        )}
      </div>

      {/* Dam Details */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ダム情報</h2>
        <dl className="mt-3 divide-y divide-gray-200 rounded-xl bg-white p-4 shadow-sm dark:divide-gray-700 dark:bg-gray-800">
          {dam.address && (
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <MapPin className="size-4 text-rose-400" />
                所在地
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{dam.address}</dd>
            </div>
          )}
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Building2 className="size-4 text-violet-400" />
              市区町村
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{dam.municipality}</dd>
          </div>
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Droplets className="size-4 text-cyan-400" />
              水系
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{dam.waterSystem}</dd>
          </div>
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Waves className="size-4 text-blue-400" />
              河川名
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{dam.riverName}</dd>
          </div>
          {dam.damHeight != null && (
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Mountain className="size-4 text-orange-400" />
                堤高
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{dam.damHeight}m</dd>
            </div>
          )}
          {dam.totalStorageCapacity != null && (
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Box className="size-4 text-emerald-400" />
                総貯水容量
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {dam.totalStorageCapacity.toLocaleString()}万m³
              </dd>
            </div>
          )}
          {dam.completionYear != null && (
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Calendar className="size-4 text-gray-400" />
                竣工年
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{dam.completionYear}年</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Storage Section */}
      {damStorage && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">貯水状況</h2>
          <dl className="mt-3 divide-y divide-gray-200 rounded-xl bg-white p-4 shadow-sm dark:divide-gray-700 dark:bg-gray-800">
            {damStorage.storageRate != null && (
              <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <Activity className="size-4 text-violet-400" />
                  貯水率
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {damStorage.storageRate}%
                </dd>
              </div>
            )}
            {damStorage.storageLevel > 0 && (
              <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <Gauge className="size-4 text-sky-400" />
                  貯水位
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {damStorage.storageLevel}m
                </dd>
              </div>
            )}
            {damStorage.storageCapacity > 0 && (
              <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <Droplets className="size-4 text-teal-400" />
                  貯水量
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {damStorage.storageCapacity.toLocaleString()}千m³
                </dd>
              </div>
            )}
            {damStorage.inflow > 0 && (
              <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <ArrowDownToLine className="size-4 text-blue-400" />
                  流入量
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {damStorage.inflow}m³/s
                </dd>
              </div>
            )}
            {damStorage.outflow > 0 && (
              <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <ArrowUpFromLine className="size-4 text-orange-400" />
                  放流量
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {damStorage.outflow}m³/s
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
            観測: {damStorage.obsTime}
          </p>
        </div>
      )}

      {/* Map */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">位置情報</h2>
        <Suspense
          fallback={
            <div className="mt-3 flex h-64 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              地図を読み込み中...
            </div>
          }
        >
          <MapView
            dams={[dam]}
            singleMarker
            center={[dam.latitude, dam.longitude]}
            zoom={13}
            className="mt-3 h-64 rounded-xl"
          />
        </Suspense>
      </div>
    </div>
  );
}
