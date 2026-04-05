import { CloudRain } from "lucide-react";
import GlossarySection from "./GlossarySection";

const weatherTerms = [
  {
    term: "最高気温",
    unit: "°C",
    description: "その日の最も高い気温の予測値です。",
  },
  {
    term: "最低気温",
    unit: "°C",
    description: "その日の最も低い気温の予測値です。",
  },
  {
    term: "降水確率",
    unit: "%",
    description:
      "一定時間内に1mm以上の降水がある確率です。0%でも絶対に降らないわけではなく、100%でも降水量が多いとは限りません。",
  },
  {
    term: "降水量",
    unit: "mm",
    description:
      "1日に降る雨や雪の合計量を水の深さ（mm）で表したものです。1mmは1平方メートルあたり1リットルの水に相当します。",
  },
];

export default function WeatherTermsSection() {
  return (
    <GlossarySection
      id="weather-terms"
      icon={<CloudRain className="h-5 w-5 text-indigo-500" />}
      title="天気予報の用語"
      description="ダム詳細ページに表示される天気予報データの用語です。"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {weatherTerms.map(({ term, unit, description }) => (
          <div key={term} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                {term}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {description}
            </p>
          </div>
        ))}
      </div>
    </GlossarySection>
  );
}
