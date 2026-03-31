/**
 * prepare-dams.ts
 *
 * Parses the national land information GML dam dataset (W01-14-g_Dam.xml)
 * and generates src/data/dams.json.
 *
 * Usage: npx tsx scripts/prepare-dams.ts
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GML_PATH = path.join(__dirname, "data", "W01-14-g_Dam.xml");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "dams.json");

// ---------------------------------------------------------------------------
// Types (local – mirrors src/types/dam.ts)
// ---------------------------------------------------------------------------

interface Dam {
  id: string;
  damName: string;
  prefecture: string;
  prefectureSlug: string;
  prefectureCode: string;
  latitude: number;
  longitude: number;
  damType: string;
  waterSystem: string;
  riverName: string;
  totalStorageCapacity: number | null;
  damHeight: number | null;
  completionYear: number | null;
  address: string;
  municipality: string;
  isMajor: boolean;
  purposes: string[];
}

interface PrefectureInfo {
  code: string;
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Prefecture table (mirrors src/data/prefectures.ts)
// ---------------------------------------------------------------------------

const PREFECTURES: PrefectureInfo[] = [
  { code: "01", name: "北海道", slug: "hokkaido" },
  { code: "02", name: "青森県", slug: "aomori" },
  { code: "03", name: "岩手県", slug: "iwate" },
  { code: "04", name: "宮城県", slug: "miyagi" },
  { code: "05", name: "秋田県", slug: "akita" },
  { code: "06", name: "山形県", slug: "yamagata" },
  { code: "07", name: "福島県", slug: "fukushima" },
  { code: "08", name: "茨城県", slug: "ibaraki" },
  { code: "09", name: "栃木県", slug: "tochigi" },
  { code: "10", name: "群馬県", slug: "gunma" },
  { code: "11", name: "埼玉県", slug: "saitama" },
  { code: "12", name: "千葉県", slug: "chiba" },
  { code: "13", name: "東京都", slug: "tokyo" },
  { code: "14", name: "神奈川県", slug: "kanagawa" },
  { code: "15", name: "新潟県", slug: "niigata" },
  { code: "16", name: "富山県", slug: "toyama" },
  { code: "17", name: "石川県", slug: "ishikawa" },
  { code: "18", name: "福井県", slug: "fukui" },
  { code: "19", name: "山梨県", slug: "yamanashi" },
  { code: "20", name: "長野県", slug: "nagano" },
  { code: "21", name: "岐阜県", slug: "gifu" },
  { code: "22", name: "静岡県", slug: "shizuoka" },
  { code: "23", name: "愛知県", slug: "aichi" },
  { code: "24", name: "三重県", slug: "mie" },
  { code: "25", name: "滋賀県", slug: "shiga" },
  { code: "26", name: "京都府", slug: "kyoto" },
  { code: "27", name: "大阪府", slug: "osaka" },
  { code: "28", name: "兵庫県", slug: "hyogo" },
  { code: "29", name: "奈良県", slug: "nara" },
  { code: "30", name: "和歌山県", slug: "wakayama" },
  { code: "31", name: "鳥取県", slug: "tottori" },
  { code: "32", name: "島根県", slug: "shimane" },
  { code: "33", name: "岡山県", slug: "okayama" },
  { code: "34", name: "広島県", slug: "hiroshima" },
  { code: "35", name: "山口県", slug: "yamaguchi" },
  { code: "36", name: "徳島県", slug: "tokushima" },
  { code: "37", name: "香川県", slug: "kagawa" },
  { code: "38", name: "愛媛県", slug: "ehime" },
  { code: "39", name: "高知県", slug: "kochi" },
  { code: "40", name: "福岡県", slug: "fukuoka" },
  { code: "41", name: "佐賀県", slug: "saga" },
  { code: "42", name: "長崎県", slug: "nagasaki" },
  { code: "43", name: "熊本県", slug: "kumamoto" },
  { code: "44", name: "大分県", slug: "oita" },
  { code: "45", name: "宮崎県", slug: "miyazaki" },
  { code: "46", name: "鹿児島県", slug: "kagoshima" },
  { code: "47", name: "沖縄県", slug: "okinawa" },
];

// ---------------------------------------------------------------------------
// Dam type code map
// ---------------------------------------------------------------------------

const PURPOSE_MAP: Record<string, string> = {
  "1": "洪水調節・農地防災",
  "2": "不特定用水・河川維持用水",
  "3": "灌漑・特定灌漑用水",
  "4": "上水道用水",
  "5": "工業用水道用水",
  "6": "発電",
  "7": "消流雪用水",
  "8": "レクリエーション",
};

const DAM_TYPE_MAP: Record<string, string> = {
  "1": "アーチ",
  "2": "バットレス",
  "3": "アース",
  "4": "アスファルトフェイシング",
  "5": "アスファルトコア",
  "6": "フローティングゲート",
  "7": "重力式コンクリート",
  "8": "重力式アーチ",
  "9": "重力式コンクリート・フィル複合",
  "10": "中空重力式コンクリート",
  "11": "マルティプルアーチ",
  "12": "ロックフィル",
  "13": "台形CSG",
};

// ---------------------------------------------------------------------------
// GML parsing helpers
// ---------------------------------------------------------------------------

function extractAllTagValues(block: string, tag: string): string[] {
  const re = new RegExp(`<ksj:${tag}>([^<]*)<\\/ksj:${tag}>`, "g");
  const values: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    values.push(m[1].trim());
  }
  return values;
}

function extractTagValue(block: string, tag: string): string | null {
  const re = new RegExp(`<ksj:${tag}>([^<]*)<\\/ksj:${tag}>`);
  const match = block.match(re);
  return match ? match[1].trim() : null;
}

function parsePoints(xml: string): Map<string, [number, number]> {
  const points = new Map<string, [number, number]>();
  const re = /<gml:Point gml:id="([^"]+)">\s*<gml:pos>([^<]+)<\/gml:pos>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const id = m[1];
    const parts = m[2].trim().split(/\s+/);
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    points.set(id, [lat, lng]);
  }
  return points;
}

function parseDamBlocks(xml: string): string[] {
  const blocks: string[] = [];
  const re = /<ksj:Dam gml:id="[^"]*">([\s\S]*?)<\/ksj:Dam>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    blocks.push(m[0]);
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Prefecture matching
// ---------------------------------------------------------------------------

function matchPrefecture(address: string): PrefectureInfo | null {
  for (const pref of PREFECTURES) {
    if (address.startsWith(pref.name)) {
      return pref;
    }
  }
  return null;
}

function extractMunicipality(address: string, prefectureName: string): string {
  const rest = address.startsWith(prefectureName) ? address.slice(prefectureName.length) : address;

  if (!rest) return "不明";

  // 政令指定都市: ○○市○○区（区名は1〜4文字）
  const seirei = rest.match(/^(.+?市[^市]{1,4}区)/);
  if (seirei) return seirei[1];

  // 郡+町村: ○○郡○○町/村
  const gun = rest.match(/^(.+?郡.+?[町村])/);
  if (gun) return gun[1];

  // 通常の市: ○○市
  const shi = rest.match(/^(.+?市)/);
  if (shi) return shi[1];

  // 町・村のみ
  const chouson = rest.match(/^(.+?[町村])/);
  if (chouson) return chouson[1];

  // フォールバック
  const fallback = rest.match(/^(.+?)(?:大字|字|番地)/);
  return fallback ? fallback[1] : rest;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Reading GML file...");
  const xml = fs.readFileSync(GML_PATH, "utf-8");

  console.log("Parsing point definitions...");
  const points = parsePoints(xml);
  console.log(`  Found ${points.size} points.`);

  console.log("Parsing dam blocks...");
  const damBlocks = parseDamBlocks(xml);
  console.log(`  Found ${damBlocks.length} dams.`);

  const dams: Dam[] = [];
  const missingPrefecture: string[] = [];

  for (const block of damBlocks) {
    const posRefMatch = block.match(/xlink:href="#([^"]+)"/);
    if (!posRefMatch) continue;
    const ptId = posRefMatch[1];
    const coords = points.get(ptId);
    if (!coords) continue;
    const [latitude, longitude] = coords;

    const damName = extractTagValue(block, "damName") ?? "";
    const damCode = extractTagValue(block, "damCode") ?? "";
    const waterSystem = extractTagValue(block, "waterSystemName") ?? "";
    const riverName = extractTagValue(block, "riverName") ?? "";
    const typeCode = extractTagValue(block, "type") ?? "";
    const address = extractTagValue(block, "address") ?? "";

    const totalPondageStr = extractTagValue(block, "totalPondage");
    const bankHeightStr = extractTagValue(block, "damScaleBankHeight");
    const yearStr = extractTagValue(block, "yearOfCompletion");

    const rawCapacity = totalPondageStr !== null ? parseFloat(totalPondageStr) : null;
    const rawHeight = bankHeightStr !== null ? parseFloat(bankHeightStr) : null;
    const rawYear = yearStr !== null ? parseInt(yearStr, 10) : null;

    const totalStorageCapacity = rawCapacity !== null && !isNaN(rawCapacity) ? rawCapacity : null;
    const damHeight = rawHeight !== null && !isNaN(rawHeight) ? rawHeight : null;
    const completionYear = rawYear !== null && !isNaN(rawYear) ? rawYear : null;

    const damType = DAM_TYPE_MAP[typeCode] ?? typeCode;

    const purposeCodes = extractAllTagValues(block, "purpose");
    const purposes = purposeCodes
      .map((code) => PURPOSE_MAP[code])
      .filter((name): name is string => name !== undefined);

    const pref = matchPrefecture(address);
    if (!pref) {
      missingPrefecture.push(damName || damCode);
      continue;
    }

    const municipality = extractMunicipality(address, pref.name);

    dams.push({
      id: `dam-${damCode}`,
      damName,
      prefecture: pref.name,
      prefectureSlug: pref.slug,
      prefectureCode: pref.code,
      latitude,
      longitude,
      damType,
      waterSystem,
      riverName,
      totalStorageCapacity,
      damHeight,
      completionYear,
      address,
      municipality,
      isMajor: damHeight !== null && damHeight >= 15,
      purposes,
    });
  }

  // Sort by prefectureCode, then municipality, then damName
  dams.sort((a, b) => {
    const codeCompare = a.prefectureCode.localeCompare(b.prefectureCode);
    if (codeCompare !== 0) return codeCompare;
    const munCompare = a.municipality.localeCompare(b.municipality, "ja");
    if (munCompare !== 0) return munCompare;
    return a.damName.localeCompare(b.damName, "ja");
  });

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dams, null, 2), "utf-8");

  // Summary stats
  console.log("\n=== Summary ===");
  console.log(`Total dams written: ${dams.length}`);

  const byPref = new Map<string, number>();
  for (const dam of dams) {
    byPref.set(dam.prefecture, (byPref.get(dam.prefecture) ?? 0) + 1);
  }

  console.log("\nDams per prefecture:");
  for (const [name, count] of [...byPref.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "ja"),
  )) {
    console.log(`  ${name}: ${count}`);
  }

  if (missingPrefecture.length > 0) {
    console.log(`\nDams with unmatched prefecture (${missingPrefecture.length}):`);
    for (const name of missingPrefecture) {
      console.log(`  - ${name}`);
    }
  }

  console.log(`\nOutput written to: ${OUTPUT_PATH}`);

  // Run downstream scripts
  console.log("\n--- Running merge-river-links.ts ---");
  execSync("npx tsx scripts/merge-river-links.ts", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });

  console.log("\n--- Running split-dams.ts ---");
  execSync("npx tsx scripts/split-dams.ts", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
}

main();
