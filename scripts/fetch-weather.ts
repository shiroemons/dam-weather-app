/**
 * fetch-weather.ts
 *
 * Fetches weather forecast data for all 47 prefectures from JMA API
 * and saves them as JSON files under public/weather/.
 *
 * Usage: npx tsx scripts/fetch-weather.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseJmaForecast } from "./jma-parser.ts";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "weather");
const JMA_FORECAST_URL = "https://www.jma.go.jp/bosai/forecast/data/forecast";

// ---------------------------------------------------------------------------
// Types (local – mirrors src/data/prefectures.ts)
// ---------------------------------------------------------------------------

interface PrefectureEntry {
  name: string;
  slug: string;
  jmaOfficeCode: string;
}

// ---------------------------------------------------------------------------
// Prefecture table
// ---------------------------------------------------------------------------

const PREFECTURES: PrefectureEntry[] = [
  { name: "北海道", slug: "hokkaido", jmaOfficeCode: "016000" },
  { name: "青森県", slug: "aomori", jmaOfficeCode: "020000" },
  { name: "岩手県", slug: "iwate", jmaOfficeCode: "030000" },
  { name: "宮城県", slug: "miyagi", jmaOfficeCode: "040000" },
  { name: "秋田県", slug: "akita", jmaOfficeCode: "050000" },
  { name: "山形県", slug: "yamagata", jmaOfficeCode: "060000" },
  { name: "福島県", slug: "fukushima", jmaOfficeCode: "070000" },
  { name: "茨城県", slug: "ibaraki", jmaOfficeCode: "080000" },
  { name: "栃木県", slug: "tochigi", jmaOfficeCode: "090000" },
  { name: "群馬県", slug: "gunma", jmaOfficeCode: "100000" },
  { name: "埼玉県", slug: "saitama", jmaOfficeCode: "110000" },
  { name: "千葉県", slug: "chiba", jmaOfficeCode: "120000" },
  { name: "東京都", slug: "tokyo", jmaOfficeCode: "130000" },
  { name: "神奈川県", slug: "kanagawa", jmaOfficeCode: "140000" },
  { name: "新潟県", slug: "niigata", jmaOfficeCode: "150000" },
  { name: "富山県", slug: "toyama", jmaOfficeCode: "160000" },
  { name: "石川県", slug: "ishikawa", jmaOfficeCode: "170000" },
  { name: "福井県", slug: "fukui", jmaOfficeCode: "180000" },
  { name: "山梨県", slug: "yamanashi", jmaOfficeCode: "190000" },
  { name: "長野県", slug: "nagano", jmaOfficeCode: "200000" },
  { name: "岐阜県", slug: "gifu", jmaOfficeCode: "210000" },
  { name: "静岡県", slug: "shizuoka", jmaOfficeCode: "220000" },
  { name: "愛知県", slug: "aichi", jmaOfficeCode: "230000" },
  { name: "三重県", slug: "mie", jmaOfficeCode: "240000" },
  { name: "滋賀県", slug: "shiga", jmaOfficeCode: "250000" },
  { name: "京都府", slug: "kyoto", jmaOfficeCode: "260000" },
  { name: "大阪府", slug: "osaka", jmaOfficeCode: "270000" },
  { name: "兵庫県", slug: "hyogo", jmaOfficeCode: "280000" },
  { name: "奈良県", slug: "nara", jmaOfficeCode: "290000" },
  { name: "和歌山県", slug: "wakayama", jmaOfficeCode: "300000" },
  { name: "鳥取県", slug: "tottori", jmaOfficeCode: "310000" },
  { name: "島根県", slug: "shimane", jmaOfficeCode: "320000" },
  { name: "岡山県", slug: "okayama", jmaOfficeCode: "330000" },
  { name: "広島県", slug: "hiroshima", jmaOfficeCode: "340000" },
  { name: "山口県", slug: "yamaguchi", jmaOfficeCode: "350000" },
  { name: "徳島県", slug: "tokushima", jmaOfficeCode: "360000" },
  { name: "香川県", slug: "kagawa", jmaOfficeCode: "370000" },
  { name: "愛媛県", slug: "ehime", jmaOfficeCode: "380000" },
  { name: "高知県", slug: "kochi", jmaOfficeCode: "390000" },
  { name: "福岡県", slug: "fukuoka", jmaOfficeCode: "400000" },
  { name: "佐賀県", slug: "saga", jmaOfficeCode: "410000" },
  { name: "長崎県", slug: "nagasaki", jmaOfficeCode: "420000" },
  { name: "熊本県", slug: "kumamoto", jmaOfficeCode: "430000" },
  { name: "大分県", slug: "oita", jmaOfficeCode: "440000" },
  { name: "宮崎県", slug: "miyazaki", jmaOfficeCode: "450000" },
  { name: "鹿児島県", slug: "kagoshima", jmaOfficeCode: "460100" },
  { name: "沖縄県", slug: "okinawa", jmaOfficeCode: "471000" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const pref of PREFECTURES) {
    try {
      console.log(`Fetching weather for ${pref.name} (${pref.jmaOfficeCode})...`);

      const url = `${JMA_FORECAST_URL}/${pref.jmaOfficeCode}.json`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as unknown[];
      const areas = parseJmaForecast(data);

      const prefWeather = {
        prefectureSlug: pref.slug,
        updatedAt: new Date().toISOString(),
        areas,
      };

      const outputPath = path.join(OUTPUT_DIR, `${pref.slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(prefWeather, null, 2), "utf-8");

      successCount++;
      console.log(`  ✓ ${areas.length} areas saved to ${pref.slug}.json`);
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${pref.name}: ${message}`);
      console.error(`  ✗ ${pref.name}: ${message}`);
    }

    await sleep(1000);
  }

  console.log("\n=== Summary ===");
  console.log(`Success: ${successCount}/${PREFECTURES.length}`);
  if (errorCount > 0) {
    console.log(`Errors: ${errorCount}`);
    for (const e of errors) {
      console.log(`  - ${e}`);
    }
  }
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
