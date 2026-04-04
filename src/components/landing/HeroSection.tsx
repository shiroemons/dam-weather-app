import { Link } from "@tanstack/react-router";
import { Bookmark, ChevronRight, CloudSun, Droplets } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 py-20 sm:py-28 lg:py-36 dark:from-sky-700 dark:to-blue-900"
    >
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Droplets className="size-10 text-sky-200 sm:size-12" />
          <h1 id="hero-heading" className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            日本のダム天気
          </h1>
        </div>
        <p className="mt-4 max-w-xl text-lg text-sky-100 sm:text-xl">
          全国のダムの天気をチェック。都道府県を選んでダムの天気予報を確認しましょう。
        </p>
        <div className="mt-8 text-center sm:text-left">
          <Link
            to="/prefecture"
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-orange-600 motion-reduce:hover:scale-100 dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            都道府県一覧を見る
            <ChevronRight className="size-5" />
          </Link>
          <div className="mt-4 flex justify-center gap-3 sm:justify-start">
            <Link
              to="/today"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
            >
              <CloudSun className="size-4" />
              今日の天気
            </Link>
            <Link
              to="/watchlist"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
            >
              <Bookmark className="size-4" />
              マイリスト
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
