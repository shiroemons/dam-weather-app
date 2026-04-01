import { PREFECTURES } from "@/data/prefectures";

const HEADING_ID = "stats-heading";

const totalDams = PREFECTURES.reduce((sum, p) => sum + p.damCount, 0);
const totalObs = PREFECTURES.reduce((sum, p) => sum + p.obsCount, 0);

type StatItem = {
  label: string;
  value: number;
  unit: string;
};

const STATS: StatItem[] = [
  { label: "ダム数", value: totalDams, unit: "基" },
  { label: "観測所情報あり", value: totalObs, unit: "基" },
];

export default function StatsSection() {
  return (
    <section aria-labelledby={HEADING_ID} className="bg-white dark:bg-gray-800/50">
      <h2 id={HEADING_ID} className="sr-only">
        統計情報
      </h2>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <dl className="grid grid-cols-2 gap-6 sm:gap-8">
          {STATS.map(({ label, value, unit }) => (
            <div key={label} className="text-center">
              <dd className="text-3xl font-bold text-sky-600 sm:text-4xl dark:text-sky-400">
                {value.toLocaleString()}
                <span className="ml-1 text-base font-medium">{unit}</span>
              </dd>
              <dt className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
