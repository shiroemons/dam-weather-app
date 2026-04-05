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
      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          国土交通省が運営する「川の防災情報」（
          <a
            href="https://www.river.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 underline hover:text-sky-500 dark:text-sky-400"
          >
            https://www.river.go.jp/
          </a>
          ）は、全国のダム・河川の水位や雨量をリアルタイムで提供するサービスです。本アプリではこのサービスからダムの貯水率データを取得しており、ダム詳細ページのヘッダーにリンクを表示しています。
        </p>
      </div>
    </GlossarySection>
  );
}
