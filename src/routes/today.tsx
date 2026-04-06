import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, Snowflake } from "lucide-react";
import { PREFECTURES, REGIONS } from "@/data/prefectures";
import { WEATHER_CLASSES } from "@/lib/weatherColors";
import WeatherSummaryBar from "@/components/today/WeatherSummaryBar";
import RegionWeatherSummary from "@/components/today/RegionWeatherSummary";
import { SITE_NAME, SITE_URL } from "@/config/seo";
import { getDistribution } from "@/lib/weatherUtils";
import type { WeatherCategory } from "@/lib/weatherColors";
import type { PrefectureWeather } from "@/types/weather";

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
      links: [{ rel: "canonical", href: `${SITE_URL}/today` }],
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

const CATEGORY_ICON_COLORS: Record<string, string> = {
  sunny: "text-orange-400 dark:text-orange-300",
  cloudy: "text-gray-400 dark:text-gray-300",
  rain: "text-blue-400 dark:text-blue-300",
  snow: "text-sky-400 dark:text-sky-300",
};

function TodayPage() {
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

  const totalCounts = useMemo(() => {
    const counts = emptyCounts();
    for (const query of weatherQueries) {
      if (query.data) {
        const dist = getDistribution(query.data);
        for (const [cat, count] of Object.entries(dist)) {
          counts[cat as WeatherCategory] += count;
        }
      }
    }
    return counts;
  }, [weatherQueries]);

  const regionData = useMemo(() => {
    const prefWeatherMap = new Map<string, PrefectureWeather>();
    for (let i = 0; i < PREFECTURES.length; i++) {
      const data = weatherQueries[i]?.data;
      if (data) {
        prefWeatherMap.set(PREFECTURES[i].slug, data);
      }
    }
    return REGIONS.map((region) => {
      const regionPrefSlugs = PREFECTURES.filter((p) => p.region === region).map((p) => p.slug);
      const counts = emptyCounts();
      for (const slug of regionPrefSlugs) {
        const pw = prefWeatherMap.get(slug);
        if (pw) {
          const dist = getDistribution(pw);
          for (const [cat, count] of Object.entries(dist)) {
            counts[cat as WeatherCategory] += count;
          }
        }
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { region, counts, total };
    });
  }, [weatherQueries]);

  const totalDams = Object.values(totalCounts).reduce((a, b) => a + b, 0);

  const latestUpdatedAt = useMemo(() => {
    let latest = "";
    for (const query of weatherQueries) {
      if (query.data?.updatedAt && query.data.updatedAt > latest) {
        latest = query.data.updatedAt;
      }
    }
    return latest || null;
  }, [weatherQueries]);

  return (
    <div className="mx-auto max-w-(--width-content) px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
        今日のダム天気
      </h1>
      <p className="mt-1 text-sm text-text-secondary">全国のダムの天気概況</p>
      {latestUpdatedAt && (
        <p className="mt-1 text-xs text-text-tertiary">
          更新日時: {new Date(latestUpdatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
        </p>
      )}

      {isLoading && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border border-border-secondary bg-surface-primary"
              />
            ))}
          </div>
          <div className="mt-4 h-2.5 animate-pulse rounded-full border border-border-secondary bg-surface-primary" />
          <p className="mt-2 text-xs text-text-tertiary">
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
                  className={`flex items-center gap-3 rounded-xl p-4 ${WEATHER_CLASSES[cat]}`}
                >
                  <Icon className={`size-8 ${CATEGORY_ICON_COLORS[cat]}`} />
                  <div>
                    <p className="text-2xl font-bold text-text-primary">
                      {totalCounts[cat]}
                      <span className="ml-1 text-xs font-normal text-text-tertiary">
                        ({totalDams > 0 ? Math.round((totalCounts[cat] / totalDams) * 100) : 0}%)
                      </span>
                    </p>
                    <p className="text-xs text-text-secondary">{config.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall bar */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-text-primary">全体の天気分布</h2>
            <p className="mt-1 text-xs text-text-secondary">{totalDams}基</p>
            <div className="mt-3">
              <WeatherSummaryBar counts={totalCounts} total={totalDams} />
            </div>
          </div>

          {/* Per-region */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-text-primary">地方別の天気分布</h2>
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
