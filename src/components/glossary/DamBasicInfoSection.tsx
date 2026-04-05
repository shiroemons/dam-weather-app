import { Info } from "lucide-react";
import GlossarySection from "./GlossarySection";

const items = [
  {
    term: "堤高",
    unit: "m",
    description:
      "ダムの基礎地盤の最深部から堤頂（ダムの一番上）までの高さです。一般に15m以上のものが「ダム」、それ未満は「堰（せき）」に分類されます。",
  },
  {
    term: "総貯水容量",
    unit: "千m³",
    description: "ダムが貯められる水の総量です。洪水調節容量と利水容量を合わせた容量を指します。",
  },
  {
    term: "竣工年",
    unit: "年",
    description: "ダムが完成し、運用を開始した年です。",
  },
];

export default function DamBasicInfoSection() {
  return (
    <GlossarySection
      id="basic-info"
      icon={<Info className="h-5 w-5 text-blue-500" />}
      title="ダムの基本情報"
      description="ダム詳細ページに表示される基本的な諸元です。"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ term, unit, description }) => (
          <div key={term} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
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
