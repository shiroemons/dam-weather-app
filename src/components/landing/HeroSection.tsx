import { Link } from "@tanstack/react-router";
import { Bookmark, ChevronRight, CloudSun, Droplets } from "lucide-react";
import { PREFECTURES } from "@/data/prefectures";

const totalDams = PREFECTURES.reduce((sum, p) => sum + p.damCount, 0);
const totalObs = PREFECTURES.reduce((sum, p) => sum + p.obsCount, 0);
const totalStorageRate = PREFECTURES.reduce((sum, p) => sum + p.storageRateCount, 0);

const STATS = [
  { label: "ダム数", value: totalDams, unit: "基" },
  { label: "観測所", value: totalObs, unit: "基" },
  { label: "貯水率あり", value: totalStorageRate, unit: "基" },
];

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 py-16 sm:py-24 lg:py-32 dark:from-sky-700 dark:to-blue-900"
    >
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10" />

      <div className="relative mx-auto max-w-(--width-content) px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Droplets className="size-10 text-sky-200 sm:size-12" />
          <h1
            id="hero-heading"
            className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            日本のダム天気
          </h1>
        </div>
        <p className="mt-4 max-w-xl text-lg text-sky-100 sm:text-xl">
          全国{totalDams.toLocaleString()}
          基のダムの天気予報をまとめてチェック。都道府県を選んでダムの天気予報を確認しましょう。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/prefecture"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-sky-600 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-sky-50 motion-reduce:hover:scale-100"
          >
            都道府県一覧を見る
            <ChevronRight className="size-5" />
          </Link>
          <div className="flex gap-3">
            <Link
              to="/today"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
            >
              <CloudSun className="size-4" />
              今日の天気
            </Link>
            <Link
              to="/watchlist"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
            >
              <Bookmark className="size-4" />
              マイリスト
            </Link>
          </div>
        </div>

        {/* 統計情報（旧StatsSection統合） */}
        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/20 pt-8 sm:gap-8">
          {STATS.map(({ label, value, unit }) => (
            <div key={label} className="text-center">
              <dd className="font-mono text-2xl font-bold text-white sm:text-3xl">
                {value.toLocaleString()}
                <span className="ml-1 text-sm font-medium text-sky-200">{unit}</span>
              </dd>
              <dt className="mt-1 text-xs text-sky-200 sm:text-sm">{label}</dt>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
