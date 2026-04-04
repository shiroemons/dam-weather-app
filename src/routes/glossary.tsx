import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Target } from "lucide-react";

import { SITE_NAME, SITE_URL } from "@/config/seo";
import { DAM_TYPES } from "@/data/damTypes";
import { DAM_PURPOSES } from "@/data/purposes";

export const Route = createFileRoute("/glossary")({
  head: () => {
    const title = `用語解説 | ${SITE_NAME}`;
    const description = "ダム型式や用途など、ダムに関する用語を解説します。";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/glossary` },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url: `${SITE_URL}/glossary`,
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
            },
          },
        },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/glossary` }],
    };
  },
  component: GlossaryPage,
});

const DAM_TYPE_DESCRIPTIONS: Record<string, { description: string; kids: string; abbr: string }> = {
  G: {
    abbr: "Gravity",
    description: "コンクリートの重さで水圧を支えるダム。日本で最も多い型式です。",
    kids: "とても重いコンクリートのかたまりで水をせき止めるダムだよ。日本でいちばん多いタイプ！",
  },
  A: {
    abbr: "Arch",
    description:
      "アーチ形状で水圧を両岸の岩盤に伝えるダム。コンクリート量を抑えられますが、堅固な岩盤が必要です。",
    kids: "弓のようなカーブした形で水の力を両がわの山に逃がすダムだよ。黒部ダムがこのタイプ！",
  },
  GA: {
    abbr: "Gravity Arch",
    description: "重力式とアーチ式を組み合わせた型式。自重とアーチ作用の両方で水圧を支えます。",
    kids: "重いコンクリートとカーブした形の両方の力で水をおさえるダムだよ。",
  },
  HG: {
    abbr: "Hollow Gravity",
    description: "重力式コンクリートダムの内部を空洞にした型式。コンクリート量を削減できます。",
    kids: "コンクリートのダムの中が空っぽになっている型だよ。材料を節約できるんだ。",
  },
  R: {
    abbr: "Rockfill",
    description: "岩石を積み上げて築造し、内部に遮水壁を設けたダム。大規模なダムに適しています。",
    kids: "大きな石をたくさん積み上げて作るダムだよ。とても大きなダムを作るのに向いているよ。",
  },
  E: {
    abbr: "Earth",
    description:
      "土を主材料として築造されたダム。フィルダムの一種で、比較的小規模なダムに多い型式です。",
    kids: "土を盛って作るダムだよ。いちばんシンプルな作り方で、小さめのダムに多いんだ。",
  },
  AC: {
    abbr: "Asphalt Core",
    description: "ロックフィルダムの中心部にアスファルトの遮水壁を設けた型式です。",
    kids: "石を積んだダムの真ん中に、アスファルトという水を通さない材料を入れて水もれを防ぐよ。",
  },
  AF: {
    abbr: "Asphalt Facing",
    description: "ダム上流面にアスファルトの遮水層を施したフィルダムです。",
    kids: "ダムの水がわの表面にアスファルトをぬって、水がしみ出ないようにしたダムだよ。",
  },
  GF: {
    abbr: "Gravity Fill combined",
    description: "重力式コンクリートダムとフィルダムを組み合わせた複合型式です。",
    kids: "コンクリートのダムと石や土のダムをくっつけて作った、合体タイプのダムだよ。",
  },
  CSG: {
    abbr: "Cemented Sand and Gravel",
    description:
      "セメントで固めた砂礫（CSG）を台形に積み上げた型式。環境負荷が少なく、近年注目されています。",
    kids: "セメントと砂利をまぜた材料で作る新しいタイプのダムだよ。自然にやさしいんだ。",
  },
  B: {
    abbr: "Buttress",
    description:
      "鉄筋コンクリートの壁（バットレス）で水圧を支える型式。日本では数基のみ現存します。",
    kids: "コンクリートの板で水をおさえる、めずらしいダムだよ。日本にはほんの数か所しかないよ。",
  },
  MA: {
    abbr: "Multiple Arch",
    description: "複数のアーチを並列に配置した型式。日本では豊稔池ダムなど非常に珍しい型式です。",
    kids: "小さなアーチがいくつも横にならんだ、とてもめずらしいダムだよ。",
  },
  FG: {
    abbr: "Floating Gate",
    description: "水面に浮かぶゲートを利用して水位を調節する構造です。",
    kids: "水にうかぶ大きな板（ゲート）で水の量を調整するしくみだよ。",
  },
};

const DAM_PURPOSE_DESCRIPTIONS: Record<
  string,
  { description: string; kids: string; abbr: string }
> = {
  F: {
    abbr: "Flood control",
    description: "大雨時にダムに水を貯めて下流の洪水被害を防ぎます。",
    kids: "大雨のとき、水をダムにためて町が水びたしにならないようにするよ。",
  },
  N: {
    abbr: "Normal flow maintenance",
    description: "渇水時に河川の流量を確保し、生態系や既存の水利用を守ります。",
    kids: "川の水が少なくなったとき、ダムから水を流して川の生き物を守るよ。",
  },
  A: {
    abbr: "Agriculture",
    description: "農業用水として田畑に必要な水を供給します。",
    kids: "お米や野菜を育てる田んぼや畑に水をおくるよ。",
  },
  W: {
    abbr: "Water supply",
    description: "飲料水や生活用水として水道に供給します。",
    kids: "みんなが毎日つかう水道の水をおくるよ。",
  },
  I: {
    abbr: "Industrial water",
    description: "工場などの産業活動に必要な水を供給します。",
    kids: "工場でものを作るときに使う水をおくるよ。",
  },
  P: {
    abbr: "Power generation",
    description: "ダムの水の落差を利用して水力発電を行います。",
    kids: "高いところから水を落として電気を作るよ。水力発電っていうんだ。",
  },
  S: {
    abbr: "Snow melting",
    description: "積雪地域で道路や側溝に水を流して雪を溶かすために使用します。",
    kids: "雪がたくさんふる地域で、水を流して道路の雪をとかすよ。",
  },
  R: {
    abbr: "Recreation",
    description: "ダム湖でのボート、釣り、キャンプなどのレクリエーション利用です。",
    kids: "ダムの湖でボートにのったり、つりをしたり、楽しくあそべるよ。",
  },
};

const damTypesForDisplay = DAM_TYPES.filter((t) => t.short !== "NA");

function GlossaryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">用語解説</h1>

      <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">
        ダムに関する用語を解説します。
      </p>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Landmark className="h-5 w-5 text-emerald-500" />
          ダム型式
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          ダムの構造や建設方法による分類です。略号はダムカードなどで使用されます。
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {damTypesForDisplay.map((type) => (
            <div key={type.short} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {type.label}
                </span>
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  {type.short}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {DAM_TYPE_DESCRIPTIONS[type.short].abbr}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {DAM_TYPE_DESCRIPTIONS[type.short].description}
              </p>
              <p className="mt-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                <span className="mr-1 font-medium">やさしい解説:</span>
                {DAM_TYPE_DESCRIPTIONS[type.short].kids}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Target className="h-5 w-5 text-amber-500" />
          用途
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          ダムが果たす役割を示す分類です。多くのダムは複数の用途を持っています。
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DAM_PURPOSES.map((purpose) => (
            <div key={purpose.short} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  {purpose.label}
                </span>
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  {purpose.short}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {DAM_PURPOSE_DESCRIPTIONS[purpose.short].abbr}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {DAM_PURPOSE_DESCRIPTIONS[purpose.short].description}
              </p>
              <p className="mt-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                <span className="mr-1 font-medium">やさしい解説:</span>
                {DAM_PURPOSE_DESCRIPTIONS[purpose.short].kids}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
