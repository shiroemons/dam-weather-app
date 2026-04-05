import { createFileRoute } from "@tanstack/react-router";

import { SITE_NAME, SITE_URL } from "@/config/seo";

export const Route = createFileRoute("/about")({
  head: () => {
    const title = `このサイトについて | ${SITE_NAME}`;
    const description = "日本のダム天気は、全国約2,700基のダム周辺の天気予報を提供するサイトです。";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/about` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: title,
            description,
            url: `${SITE_URL}/about`,
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
            },
          },
        },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
    };
  },
  component: AboutPage,
});

const TECH_STACK = [
  "React",
  "TypeScript",
  "TanStack Router",
  "TanStack Query",
  "Tailwind CSS",
  "Vite",
  "Cloudflare Pages",
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-(--width-content) px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
        このサイトについて
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">日本のダム天気とは</h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          日本のダム天気は、全国47都道府県にある約2,700基のダム周辺の天気予報を提供するサイトです。
          ダム巡りや釣り、アウトドア活動の計画にお役立てください。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">作成のきっかけ</h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          最近あまり雨が降っていないとき、「近くのダムにはちゃんと雨が降っているだろうか？」とふと気になったのがきっかけです。
          身近なダムの天気だけ確認できれば十分でしたが、調べてみると日本全国のダムの天気をまとめて確認できるサイトが見つかりませんでした。
          それなら自分で作ってしまおう——そんな思いから、このサイトは生まれました。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">データ出典</h2>
        <dl className="mt-3 space-y-4">
          <div>
            <dt className="font-medium text-text-primary">天気予報データ</dt>
            <dd className="mt-1 text-sm leading-relaxed text-text-secondary">
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent"
              >
                Open-Meteo
              </a>{" "}
              の天気予報APIを使用しています。3時間ごと（1日8回）更新されます。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">ダム情報</dt>
            <dd className="mt-1 text-sm leading-relaxed text-text-secondary">
              国土交通省{" "}
              <a
                href="https://nlftp.mlit.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent"
              >
                国土数値情報
              </a>{" "}
              のダムデータを基に作成しています。
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">免責事項</h2>
        <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <ul className="list-inside list-disc space-y-1">
            <li>本サイトは非公式のサービスであり、国土交通省や気象庁とは一切関係ありません。</li>
            <li>
              天気予報は参考情報としてご利用ください。正確な情報は気象庁の公式サイトでご確認ください。
            </li>
            <li>ダムの諸元情報は最新の状態と異なる場合があります。</li>
            <li>本サイトの利用により生じた損害について、一切の責任を負いません。</li>
          </ul>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">技術スタック</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border-primary bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
