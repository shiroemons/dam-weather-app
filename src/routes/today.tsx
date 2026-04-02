import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, Snowflake } from "lucide-react";
import { useAllDams } from "@/hooks/useAllDams";
import { PREFECTURES, REGIONS } from "@/data/prefectures";
import { getWeatherCategory } from "@/lib/weatherColors";
import WeatherSummaryBar from "@/components/today/WeatherSummaryBar";
import RegionWeatherSummary from "@/components/today/RegionWeatherSummary";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { DamWeather, PrefectureWeather } from "@/types/weather";

const STALE_TIME = 30 * 60 * 1000;

export const Route = createFileRoute("/today")({
  head: () => {
    const title = `今日のダム天気 | ${SITE_NAME}`;
    const description =
      "全国約2,700基のダムの今日の天気概況。晴れ・曇り・雨・雪の分布を確認できます。";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/today` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url: `${SITE_URL}/today`,
          },
        },
      ],
    };
  },
  component: TodayPage,
});

function emptyCounts(): Record<WeatherCategory, number> {
  return { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 };
}

const CATEGORY_ICONS: Record<string, { icon: typeof Sun; label: string }> = {
  sunny: { icon: Sun, label: "晴れ" },
  cloudy: { icon: Cloud, label: "曇り" },
  rain: { icon: CloudRain, label: "雨" },
  snow: { icon: Snowflake, label: "雪" },
};

function TodayPage() {
  const allDams = useAllDams();

  const weatherQueries = useQueries({
    queries: PREFECTURES.map((pref) => ({
      queryKey: ["weather", pref.slug],
      queryFn: async (): Promise<PrefectureWeather> => {
        const res = await fetch(`/weather/${pref.slug}.json`);
        return res.json() as Promise<PrefectureWeather>;
      },
      staleTime: STALE_TIME,
    })),
  });

  const isLoading = weatherQueries.some((q) => q.isLoading);
  const loadedCount = weatherQueries.filter((q) => q.data).length;

  const weatherMap = useMemo(() => {
    const map = new Map<string, DamWeather>();
    for (const query of weatherQueries) {
      if (query.data) {
        for (const dw of query.data.dams) {
          map.set(dw.damId, dw);
        }
      }
    }
    return map;
  }, [weatherQueries]);

  const totalCounts = useMemo(() => {
    const counts = emptyCounts();
    for (const dw of weatherMap.values()) {
      const cat = getWeatherCategory(dw.today.weatherCode);
      counts[cat]++;
    }
    return counts;
  }, [weatherMap]);

  const regionData = useMemo(() => {
    return REGIONS.map((region) => {
      const regionPrefSlugs = new Set(
        PREFECTURES.filter((p) => p.region === region).map((p) => p.slug),
      );
      const regionDams = allDams.filter((d) => regionPrefSlugs.has(d.prefectureSlug));
      const counts = emptyCounts();
      for (const dam of regionDams) {
        const dw = weatherMap.get(dam.id);
        if (dw) {
          const cat = getWeatherCategory(dw.today.weatherCode);
          counts[cat]++;
        }
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { region, counts, total };
    });
  }, [allDams, weatherMap]);

  const totalDams = weatherMap.size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">今日のダム天気</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">全国のダムの天気概況</p>

      {isLoading && (
        <div className="mt-6">
          <div className="h-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            読み込み中... ({loadedCount}/{PREFECTURES.length}都道府県)
          </p>
        </div>
      )}

      {totalDams > 0 && (
        <>
          {/* Summary stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["sunny", "cloudy", "rain", "snow"] as const).map((cat) => {
              const config = CATEGORY_ICONS[cat];
              const Icon = config.icon;
              return (
                <div
                  key={cat}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
                >
                  <Icon className="size-8 text-gray-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {totalCounts[cat]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{config.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall bar */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              全体の天気分布
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{totalDams}基</p>
            <div className="mt-3">
              <WeatherSummaryBar counts={totalCounts} total={totalDams} />
            </div>
          </div>

          {/* Per-region */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              地方別の天気分布
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {regionData.map(({ region, counts, total }) => (
                <RegionWeatherSummary key={region} region={region} counts={counts} total={total} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
