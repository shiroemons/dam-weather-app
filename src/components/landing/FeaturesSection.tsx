import { Bookmark, Cloud, Droplets, MapPin, type LucideIcon } from "lucide-react";

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
  {
    icon: Bookmark,
    title: "マイリスト",
    description:
      "お気に入りのダムをマイリストに登録。ローカルストレージに保存されるので、アカウント不要で天気をまとめてチェックできます。",
  },
];

export default function FeaturesSection() {
  return (
    <section aria-labelledby="features-heading" className="bg-surface-secondary">
      <div className="mx-auto max-w-(--width-content) px-4 py-12 sm:px-6 sm:py-16">
        <h2
          id="features-heading"
          className="font-display text-center text-2xl font-bold text-text-primary sm:text-3xl"
        >
          特徴
        </h2>

        <div className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border-primary bg-surface-elevated p-6 shadow-sm"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent-subtle">
                <Icon className="size-6 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
