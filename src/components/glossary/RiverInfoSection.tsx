import { Shield } from "lucide-react";
import GlossarySection from "./GlossarySection";

export default function RiverInfoSection() {
  return (
    <GlossarySection
      id="river-info"
      icon={<Shield className="h-5 w-5 text-rose-500" />}
      title="川の防災情報"
      description="国土交通省が運営するリアルタイム河川情報サービスです。"
    >
      <div className="rounded-xl bg-surface-elevated p-4 shadow-sm">
        <p className="text-sm leading-relaxed text-text-secondary">
          国土交通省が運営する「川の防災情報」（
          <a
            href="https://www.river.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:text-accent"
          >
            https://www.river.go.jp/
          </a>
          ）は、全国のダム・河川の水位や雨量をリアルタイムで提供するサービスです。本アプリではこのサービスからダムの貯水率データを取得しており、ダム詳細ページのヘッダーにリンクを表示しています。
        </p>
      </div>
    </GlossarySection>
  );
}
