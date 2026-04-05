import { Building2 } from "lucide-react";

import GlossarySection from "./GlossarySection";

const rows = [
  {
    category: "国管理（直轄）",
    manager: "国土交通省の地方整備局",
    source: "川の防災情報、各地方整備局サイト",
  },
  {
    category: "水資源機構管理",
    manager: "独立行政法人水資源機構",
    source: "川の防災情報、水資源機構サイト",
  },
  { category: "都道府県管理", manager: "各都道府県", source: "都道府県の河川防災情報システム" },
  { category: "市町村管理", manager: "各市町村", source: "市町村の水道局サイト等" },
  { category: "企業局管理", manager: "都道府県企業局", source: "企業局サイト" },
];

export default function ManagementSection() {
  return (
    <GlossarySection
      id="management"
      icon={<Building2 className="h-5 w-5 text-violet-500" />}
      title="管理区分"
      description="ダムの管理者によって、貯水率情報の公開先が異なります。"
    >
      <div className="overflow-x-auto rounded-xl bg-surface-elevated shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border-primary bg-surface-secondary">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                管理区分
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                管理者
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                主な情報公開先
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {rows.map((row) => (
              <tr key={row.category}>
                <td className="px-4 py-3 font-medium text-text-primary">{row.category}</td>
                <td className="px-4 py-3 text-text-primary">{row.manager}</td>
                <td className="px-4 py-3 text-text-primary">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlossarySection>
  );
}
