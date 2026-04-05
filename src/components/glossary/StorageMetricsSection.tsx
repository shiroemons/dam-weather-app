import { Activity } from "lucide-react";
import GlossarySection from "./GlossarySection";

const items = [
  {
    term: "貯水率",
    unit: "%",
    description:
      "ダムの利水容量に対する現在の貯水量の割合です。利水容量とは洪水調節容量を除いた、実際に水の供給に使える容量のことです。",
  },
  {
    term: "貯水位",
    unit: "m",
    description:
      "ダムに貯まっている水の水面の標高です。海抜（東京湾平均海面）を基準とした高さで表されます。",
  },
  {
    term: "貯水量",
    unit: "千m³",
    description: "ダムに現在貯まっている水の量です。「千m³」は1,000立方メートルを意味します。",
  },
  {
    term: "流入量",
    unit: "m³/s",
    description:
      "ダムに流れ込む水の量を1秒あたりの体積で表したものです。上流からの河川水がダム湖に入る速度を示します。",
  },
  {
    term: "放流量",
    unit: "m³/s",
    description:
      "ダムから下流へ放出する水の量を1秒あたりの体積で表したものです。発電や利水、洪水調節のために放流されます。",
  },
];

export default function StorageMetricsSection() {
  return (
    <GlossarySection
      id="storage-metrics"
      icon={<Activity className="h-5 w-5 text-teal-500" />}
      title="貯水状況の指標"
      description="ダム詳細ページに表示されるリアルタイムの観測データです。"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ term, unit, description }) => (
          <div key={term} className="rounded-xl bg-surface-elevated p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                {term}
              </span>
              <span className="text-xs text-text-tertiary">{unit}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-surface-elevated p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary">貯水率の計算式</h3>
        <div className="mt-2 rounded-lg border border-border-secondary bg-surface-secondary px-4 py-3 font-mono text-sm text-text-primary">
          貯水率（%） = 現在の貯水量 ÷ 利水容量 × 100
        </div>
        <div className="mt-2 text-xs leading-relaxed text-text-secondary">
          <p>
            <span className="font-medium">利水容量</span>:
            洪水調節容量を除いた、実際に水の供給に使える容量
          </p>
          <p className="mt-1">
            <span className="font-medium">総貯水容量</span>:
            ダムが貯められる水の総量（洪水調節容量を含む）
          </p>
        </div>
      </div>
    </GlossarySection>
  );
}
