import { Link } from "@tanstack/react-router";
import { ChevronRight, Cloud, Droplets, MapPin, type LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: "全国のダム情報",
    description: "全国のダム情報を網羅。お近くのダムを簡単に検索できます。",
  },
  {
    icon: Cloud,
    title: "天気予報",
    description: "各ダム周辺の天気予報をリアルタイムで確認。お出かけ前のチェックに最適です。",
  },
  {
    icon: Droplets,
    title: "観測所データ",
    description: "ダムに関連する観測所の情報も併せて確認できます。",
  },
];

export default function FeaturesSection() {
  return (
    <section aria-labelledby="features-heading" className="bg-slate-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2
          id="features-heading"
          className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100"
        >
          特徴
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md motion-reduce:hover:scale-100 dark:border-sky-900/30 dark:bg-gray-800"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/30">
                <Icon className="size-6 text-sky-500 dark:text-sky-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/prefecture"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-sky-600 hover:to-blue-700 motion-reduce:hover:scale-100 dark:from-sky-600 dark:to-blue-700 dark:hover:from-sky-500 dark:hover:to-blue-600"
          >
            都道府県一覧を見る
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
