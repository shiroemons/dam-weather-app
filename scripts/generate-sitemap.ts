import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://japan-dam-weather.pages.dev";

const PREFECTURE_SLUGS = [
  "hokkaido",
  "aomori",
  "iwate",
  "miyagi",
  "akita",
  "yamagata",
  "fukushima",
  "ibaraki",
  "tochigi",
  "gunma",
  "saitama",
  "chiba",
  "tokyo",
  "kanagawa",
  "niigata",
  "toyama",
  "ishikawa",
  "fukui",
  "yamanashi",
  "nagano",
  "gifu",
  "shizuoka",
  "aichi",
  "mie",
  "shiga",
  "kyoto",
  "osaka",
  "hyogo",
  "nara",
  "wakayama",
  "tottori",
  "shimane",
  "okayama",
  "hiroshima",
  "yamaguchi",
  "tokushima",
  "kagawa",
  "ehime",
  "kochi",
  "fukuoka",
  "saga",
  "nagasaki",
  "kumamoto",
  "oita",
  "miyazaki",
  "kagoshima",
  "okinawa",
];

// Read all dam IDs from dams.json
const damsPath = path.resolve(__dirname, "../src/data/dams.json");
const damsData = JSON.parse(fs.readFileSync(damsPath, "utf-8")) as { id: string }[];

const lastmod = new Date().toISOString().split("T")[0];

const urls = [
  { loc: `${SITE_URL}/`, priority: "1.0" },
  { loc: `${SITE_URL}/prefecture`, priority: "1.0" },
  { loc: `${SITE_URL}/map`, priority: "0.7" },
  { loc: `${SITE_URL}/today`, priority: "0.7" },
  { loc: `${SITE_URL}/about`, priority: "0.5" },
  { loc: `${SITE_URL}/glossary`, priority: "0.5" },
  ...PREFECTURE_SLUGS.map((slug) => ({
    loc: `${SITE_URL}/prefecture/${slug}`,
    priority: "0.8",
  })),
  ...damsData.map((dam) => ({
    loc: `${SITE_URL}/dam/${dam.id}`,
    priority: "0.6",
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const outputPath = path.resolve(__dirname, "../public/sitemap.xml");
fs.writeFileSync(outputPath, sitemap, "utf-8");
console.log(`sitemap.xml generated with ${urls.length} URLs at ${outputPath}`);
