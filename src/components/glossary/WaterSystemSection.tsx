import { Droplets } from "lucide-react";
import GlossarySection from "./GlossarySection";

export default function WaterSystemSection() {
  return (
    <GlossarySection
      id="water-system"
      icon={<Droplets className="h-5 w-5 text-cyan-500" />}
      title="水系"
      description="同じ河川の本流と支流をまとめた河川群のことです。"
    >
      <div className="rounded-xl bg-surface-elevated p-4 shadow-sm">
        <p className="text-sm leading-relaxed text-text-secondary">
          例えば「利根川水系」には、利根川本流のほか、渡良瀬川、鬼怒川、江戸川などの支流が含まれます。ダムの管理や水の配分は水系単位で行われることが多く、本アプリでもダムを水系ごとにグループ化して表示できます。
        </p>
      </div>
    </GlossarySection>
  );
}
