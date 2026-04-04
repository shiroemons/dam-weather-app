import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_NAME = "日本のダム天気";
const SITE_DESCRIPTION =
  "全国のダムの天気予報をチェック。47都道府県のダム周辺の天気情報を一覧で確認できます。";
const SITE_URL = "https://japan-dam-weather.pages.dev";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dam {
  id: string;
  damName: string;
  prefecture: string;
  municipality: string;
  damType: string;
  latitude: number;
  longitude: number;
}

interface PrefectureInfo {
  name: string;
  slug: string;
  damCount: number;
}

// ─── Prefecture data (mirrors src/data/prefectures.ts) ───────────────────────

const PREFECTURES: PrefectureInfo[] = [
  { name: "北海道", slug: "hokkaido", damCount: 190 },
  { name: "青森県", slug: "aomori", damCount: 34 },
  { name: "岩手県", slug: "iwate", damCount: 53 },
  { name: "宮城県", slug: "miyagi", damCount: 39 },
  { name: "秋田県", slug: "akita", damCount: 66 },
  { name: "山形県", slug: "yamagata", damCount: 59 },
  { name: "福島県", slug: "fukushima", damCount: 89 },
  { name: "茨城県", slug: "ibaraki", damCount: 16 },
  { name: "栃木県", slug: "tochigi", damCount: 36 },
  { name: "群馬県", slug: "gunma", damCount: 50 },
  { name: "埼玉県", slug: "saitama", damCount: 15 },
  { name: "千葉県", slug: "chiba", damCount: 50 },
  { name: "東京都", slug: "tokyo", damCount: 8 },
  { name: "神奈川県", slug: "kanagawa", damCount: 13 },
  { name: "新潟県", slug: "niigata", damCount: 114 },
  { name: "富山県", slug: "toyama", damCount: 76 },
  { name: "石川県", slug: "ishikawa", damCount: 55 },
  { name: "福井県", slug: "fukui", damCount: 26 },
  { name: "山梨県", slug: "yamanashi", damCount: 20 },
  { name: "長野県", slug: "nagano", damCount: 65 },
  { name: "岐阜県", slug: "gifu", damCount: 95 },
  { name: "静岡県", slug: "shizuoka", damCount: 45 },
  { name: "愛知県", slug: "aichi", damCount: 48 },
  { name: "三重県", slug: "mie", damCount: 86 },
  { name: "滋賀県", slug: "shiga", damCount: 25 },
  { name: "京都府", slug: "kyoto", damCount: 28 },
  { name: "大阪府", slug: "osaka", damCount: 32 },
  { name: "兵庫県", slug: "hyogo", damCount: 104 },
  { name: "奈良県", slug: "nara", damCount: 33 },
  { name: "和歌山県", slug: "wakayama", damCount: 28 },
  { name: "鳥取県", slug: "tottori", damCount: 32 },
  { name: "島根県", slug: "shimane", damCount: 49 },
  { name: "岡山県", slug: "okayama", damCount: 166 },
  { name: "広島県", slug: "hiroshima", damCount: 100 },
  { name: "山口県", slug: "yamaguchi", damCount: 86 },
  { name: "徳島県", slug: "tokushima", damCount: 22 },
  { name: "香川県", slug: "kagawa", damCount: 65 },
  { name: "愛媛県", slug: "ehime", damCount: 71 },
  { name: "高知県", slug: "kochi", damCount: 51 },
  { name: "福岡県", slug: "fukuoka", damCount: 96 },
  { name: "佐賀県", slug: "saga", damCount: 57 },
  { name: "長崎県", slug: "nagasaki", damCount: 97 },
  { name: "熊本県", slug: "kumamoto", damCount: 36 },
  { name: "大分県", slug: "oita", damCount: 84 },
  { name: "宮崎県", slug: "miyazaki", damCount: 51 },
  { name: "鹿児島県", slug: "kagoshima", damCount: 42 },
  { name: "沖縄県", slug: "okinawa", damCount: 46 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJsonLd(json: string): string {
  return json.replace(/<\/script>/gi, "<\\/script>");
}

function buildHeadTags(params: {
  title: string;
  description: string;
  url: string;
  jsonLd: object;
}): string {
  const { title, description, url, jsonLd } = params;
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedUrl = escapeHtml(url);
  const jsonLdString = escapeJsonLd(JSON.stringify(jsonLd, null, 2));

  return [
    `<title data-ssg>${escapedTitle}</title>`,
    `<meta data-ssg name="description" content="${escapedDescription}">`,
    `<meta data-ssg property="og:title" content="${escapedTitle}">`,
    `<meta data-ssg property="og:description" content="${escapedDescription}">`,
    `<meta data-ssg property="og:url" content="${escapedUrl}">`,
    `<meta data-ssg property="og:type" content="website">`,
    `<meta data-ssg property="og:locale" content="ja_JP">`,
    `<meta data-ssg property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta data-ssg name="application-name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta data-ssg name="twitter:card" content="summary">`,
    `<link data-ssg rel="canonical" href="${escapedUrl}">`,
    `<script data-ssg type="application/ld+json">${jsonLdString}</script>`,
  ].join("\n    ");
}

function writeHtml(distDir: string, routePath: string, html: string): void {
  const outputDir = routePath === "/" ? distDir : path.join(distDir, routePath);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf-8");
}

function stripTemplateSeoTags(html: string): string {
  return (
    html
      // <title>...</title>
      .replace(/<title>.*?<\/title>/s, "")
      // <meta name="application-name" .../>
      .replace(/<meta\s+name="application-name"[^>]*\/>/s, "")
      // <meta name="description" .../>
      .replace(/<meta\s+name="description"[^>]*\/>/s, "")
      // <meta property="og:..." .../> (all og: variants)
      .replace(/<meta\s+property="og:[^"]*"[^>]*\/>/gs, "")
      // <meta name="twitter:..." .../> (all twitter: variants)
      .replace(/<meta\s+name="twitter:[^"]*"[^>]*\/>/gs, "")
      // <link rel="canonical" .../>
      .replace(/<link\s+rel="canonical"[^>]*\/>/s, "")
      // <script type="application/ld+json">...</script>
      .replace(/<script\s+type="application\/ld\+json">.*?<\/script>/s, "")
  );
}

// Remove data-ssg tags before React hydrates to prevent duplication with TanStack Router's HeadContent
const CLEANUP_SCRIPT = `<script>document.querySelectorAll("[data-ssg]").forEach(function(e){while(e.previousSibling&&e.previousSibling.nodeType===3)e.previousSibling.remove();e.remove()})</script>`;

function injectHeadTags(template: string, headTags: string): string {
  const stripped = stripTemplateSeoTags(template);
  // Remove blank lines left by tag removal
  const cleaned = stripped.replace(/\n\s*\n/g, "\n");
  // Insert SSG tags + cleanup script before </head>
  // Cleanup runs after SSG tags are in DOM but before module scripts execute (modules are deferred)
  return cleaned.replace(
    "</head>",
    `    ${headTags}\n    ${CLEANUP_SCRIPT}\n  </head>`,
  );
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

function buildWebSiteJsonLd(url: string, description?: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    ...(description ? { description } : {}),
  };
}

function buildWebPageJsonLd(
  name: string,
  url: string,
  description: string,
  isPartOfUrl?: string,
): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url,
    description,
    ...(isPartOfUrl
      ? {
          isPartOf: {
            "@type": "WebSite",
            name: SITE_NAME,
            url: isPartOfUrl,
          },
        }
      : {}),
  };
}

function buildAboutPageJsonLd(url: string, description: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `このサイトについて | ${SITE_NAME}`,
    url,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

function buildPlaceJsonLd(dam: Dam): object {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: dam.damName,
    description: `${dam.prefecture}${dam.municipality}にある${dam.damName}（${dam.damType}）の天気予報。`,
    url: `${SITE_URL}/dam/${dam.id}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: dam.latitude,
      longitude: dam.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: dam.prefecture,
      addressLocality: dam.municipality,
    },
  };
}

// ─── Route definitions ────────────────────────────────────────────────────────

interface RouteSpec {
  path: string;
  title: string;
  description: string;
  url: string;
  jsonLd: object;
}

function buildStaticRoutes(): RouteSpec[] {
  return [
    {
      path: "/",
      title: `${SITE_NAME} | 全国のダムの天気予報`,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      jsonLd: buildWebSiteJsonLd(SITE_URL),
    },
    {
      path: "/about",
      title: `このサイトについて | ${SITE_NAME}`,
      description: `日本のダム天気は、全国約2,700基のダム周辺の天気予報を提供するサイトです。`,
      url: `${SITE_URL}/about`,
      jsonLd: buildAboutPageJsonLd(
        `${SITE_URL}/about`,
        `日本のダム天気は、全国約2,700基のダム周辺の天気予報を提供するサイトです。`,
      ),
    },
    {
      path: "/glossary",
      title: `用語解説 | ${SITE_NAME}`,
      description: `ダム型式や用途など、ダムに関する用語を解説します。`,
      url: `${SITE_URL}/glossary`,
      jsonLd: buildWebPageJsonLd(
        `用語解説 | ${SITE_NAME}`,
        `${SITE_URL}/glossary`,
        `ダム型式や用途など、ダムに関する用語を解説します。`,
        SITE_URL,
      ),
    },
    {
      path: "/today",
      title: `今日のダム天気 | ${SITE_NAME}`,
      description: `全国約2,700基のダムの今日の天気概況。晴れ・曇り・雨・雪の分布を確認できます。`,
      url: `${SITE_URL}/today`,
      jsonLd: buildWebPageJsonLd(
        `今日のダム天気 | ${SITE_NAME}`,
        `${SITE_URL}/today`,
        `全国約2,700基のダムの今日の天気概況。晴れ・曇り・雨・雪の分布を確認できます。`,
      ),
    },
    {
      path: "/map",
      title: `ダムマップ | ${SITE_NAME}`,
      description: `全国約2,700基のダムを地図上で確認。天気情報付きで表示します。`,
      url: `${SITE_URL}/map`,
      jsonLd: buildWebPageJsonLd(
        `ダムマップ | ${SITE_NAME}`,
        `${SITE_URL}/map`,
        `全国約2,700基のダムを地図上で確認。天気情報付きで表示します。`,
      ),
    },
    {
      path: "/prefecture",
      title: `都道府県一覧 | ${SITE_NAME}`,
      description: `全国47都道府県のダム天気情報。地方別にダムの天気予報を確認できます。`,
      url: `${SITE_URL}/prefecture`,
      jsonLd: buildWebSiteJsonLd(`${SITE_URL}/prefecture`, "全国のダムの天気予報をチェック"),
    },
  ];
}

function buildPrefectureRoutes(): RouteSpec[] {
  return PREFECTURES.map((pref) => ({
    path: `/prefecture/${pref.slug}`,
    title: `${pref.name}のダム天気 | ${SITE_NAME}`,
    description: `${pref.name}にある${pref.damCount}基のダムの天気予報。ダム周辺の天気を確認できます。`,
    url: `${SITE_URL}/prefecture/${pref.slug}`,
    jsonLd: buildWebPageJsonLd(
      `${pref.name}のダム天気 | ${SITE_NAME}`,
      `${SITE_URL}/prefecture/${pref.slug}`,
      `${pref.name}にある${pref.damCount}基のダムの天気予報。ダム周辺の天気を確認できます。`,
      `${SITE_URL}/prefecture`,
    ),
  }));
}

function buildDamRoutes(dams: Dam[]): RouteSpec[] {
  return dams.map((dam) => ({
    path: `/dam/${dam.id}`,
    title: `${dam.damName}の天気 | ${SITE_NAME}`,
    description: `${dam.prefecture}${dam.municipality}にある${dam.damName}（${dam.damType}）の天気予報。`,
    url: `${SITE_URL}/dam/${dam.id}`,
    jsonLd: buildPlaceJsonLd(dam),
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const distDir = path.resolve(__dirname, "../dist");
const damsPath = path.resolve(__dirname, "../src/data/dams.json");

const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
const dams = JSON.parse(fs.readFileSync(damsPath, "utf-8")) as Dam[];

const staticRoutes = buildStaticRoutes();
const prefectureRoutes = buildPrefectureRoutes();
const damRoutes = buildDamRoutes(dams);

const allRoutes = [...staticRoutes, ...prefectureRoutes, ...damRoutes];

for (const route of allRoutes) {
  const headTags = buildHeadTags({
    title: route.title,
    description: route.description,
    url: route.url,
    jsonLd: route.jsonLd,
  });
  const html = injectHeadTags(template, headTags);
  writeHtml(distDir, route.path, html);
}

console.log(
  `Prerendered ${allRoutes.length} pages ` +
    `(${staticRoutes.length} static + ${prefectureRoutes.length} prefecture + ${damRoutes.length} dam)`,
);
