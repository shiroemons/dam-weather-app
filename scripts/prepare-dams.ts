/**
 * prepare-dams.ts
 *
 * Parses the national land information GML dam dataset (W01-14-g_Dam.xml)
 * and generates src/data/dams.json, matching each dam to the nearest JMA
 * class10s forecast area using live JMA API data.
 *
 * Usage: npx tsx scripts/prepare-dams.ts
 */

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
  riverName: string;
  totalStorageCapacity: number | null;
  damHeight: number | null;
  completionYear: number | null;
  jmaAreaCode: string;
  jmaForecastCode: string;
  isMajor: boolean;
}

interface PrefectureInfo {
  code: string;
  name: string;
  slug: string;
  jmaOfficeCode: string;
}

interface Class10sArea {
  code: string;
  officeCode: string;
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Prefecture table (mirrors src/data/prefectures.ts)
// ---------------------------------------------------------------------------

const PREFECTURES: PrefectureInfo[] = [
  { code: "01", name: "北海道", slug: "hokkaido", jmaOfficeCode: "016000" },
  { code: "02", name: "青森県", slug: "aomori", jmaOfficeCode: "020000" },
  { code: "03", name: "岩手県", slug: "iwate", jmaOfficeCode: "030000" },
  { code: "04", name: "宮城県", slug: "miyagi", jmaOfficeCode: "040000" },
  { code: "05", name: "秋田県", slug: "akita", jmaOfficeCode: "050000" },
  { code: "06", name: "山形県", slug: "yamagata", jmaOfficeCode: "060000" },
  { code: "07", name: "福島県", slug: "fukushima", jmaOfficeCode: "070000" },
  { code: "08", name: "茨城県", slug: "ibaraki", jmaOfficeCode: "080000" },
  { code: "09", name: "栃木県", slug: "tochigi", jmaOfficeCode: "090000" },
  { code: "10", name: "群馬県", slug: "gunma", jmaOfficeCode: "100000" },
  { code: "11", name: "埼玉県", slug: "saitama", jmaOfficeCode: "110000" },
  { code: "12", name: "千葉県", slug: "chiba", jmaOfficeCode: "120000" },
  { code: "13", name: "東京都", slug: "tokyo", jmaOfficeCode: "130000" },
  { code: "14", name: "神奈川県", slug: "kanagawa", jmaOfficeCode: "140000" },
  { code: "15", name: "新潟県", slug: "niigata", jmaOfficeCode: "150000" },
  { code: "16", name: "富山県", slug: "toyama", jmaOfficeCode: "160000" },
  { code: "17", name: "石川県", slug: "ishikawa", jmaOfficeCode: "170000" },
  { code: "18", name: "福井県", slug: "fukui", jmaOfficeCode: "180000" },
  { code: "19", name: "山梨県", slug: "yamanashi", jmaOfficeCode: "190000" },
  { code: "20", name: "長野県", slug: "nagano", jmaOfficeCode: "200000" },
  { code: "21", name: "岐阜県", slug: "gifu", jmaOfficeCode: "210000" },
  { code: "22", name: "静岡県", slug: "shizuoka", jmaOfficeCode: "220000" },
  { code: "23", name: "愛知県", slug: "aichi", jmaOfficeCode: "230000" },
  { code: "24", name: "三重県", slug: "mie", jmaOfficeCode: "240000" },
  { code: "25", name: "滋賀県", slug: "shiga", jmaOfficeCode: "250000" },
  { code: "26", name: "京都府", slug: "kyoto", jmaOfficeCode: "260000" },
  { code: "27", name: "大阪府", slug: "osaka", jmaOfficeCode: "270000" },
  { code: "28", name: "兵庫県", slug: "hyogo", jmaOfficeCode: "280000" },
  { code: "29", name: "奈良県", slug: "nara", jmaOfficeCode: "290000" },
  { code: "30", name: "和歌山県", slug: "wakayama", jmaOfficeCode: "300000" },
  { code: "31", name: "鳥取県", slug: "tottori", jmaOfficeCode: "310000" },
  { code: "32", name: "島根県", slug: "shimane", jmaOfficeCode: "320000" },
  { code: "33", name: "岡山県", slug: "okayama", jmaOfficeCode: "330000" },
  { code: "34", name: "広島県", slug: "hiroshima", jmaOfficeCode: "340000" },
  { code: "35", name: "山口県", slug: "yamaguchi", jmaOfficeCode: "350000" },
  { code: "36", name: "徳島県", slug: "tokushima", jmaOfficeCode: "360000" },
  { code: "37", name: "香川県", slug: "kagawa", jmaOfficeCode: "370000" },
  { code: "38", name: "愛媛県", slug: "ehime", jmaOfficeCode: "380000" },
  { code: "39", name: "高知県", slug: "kochi", jmaOfficeCode: "390000" },
  { code: "40", name: "福岡県", slug: "fukuoka", jmaOfficeCode: "400000" },
  { code: "41", name: "佐賀県", slug: "saga", jmaOfficeCode: "410000" },
  { code: "42", name: "長崎県", slug: "nagasaki", jmaOfficeCode: "420000" },
  { code: "43", name: "熊本県", slug: "kumamoto", jmaOfficeCode: "430000" },
  { code: "44", name: "大分県", slug: "oita", jmaOfficeCode: "440000" },
  { code: "45", name: "宮崎県", slug: "miyazaki", jmaOfficeCode: "450000" },
  { code: "46", name: "鹿児島県", slug: "kagoshima", jmaOfficeCode: "460100" },
  { code: "47", name: "沖縄県", slug: "okinawa", jmaOfficeCode: "471000" },
];

// ---------------------------------------------------------------------------
// Dam type code map
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// JMA data fetching
// ---------------------------------------------------------------------------

interface AreaJson {
  class10s: Record<string, { name: string; parent: string }>;
  offices: Record<string, { name: string; parent?: string }>;
}

interface ForecastAreaEntry {
  class10: string;
  amedas: string[];
}

interface ForecastAreaJson {
  [officeCode: string]: ForecastAreaEntry[];
}

interface AmedasStation {
  lat: [number, number];
  lon: [number, number];
  kjName?: string;
}

interface AmedasTableJson {
  [stationId: string]: AmedasStation;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function buildClass10sAreas(): Promise<Class10sArea[]> {
  console.log("Fetching JMA area.json...");
  const areaJson = await fetchJson<AreaJson>(
    "https://www.jma.go.jp/bosai/common/const/area.json"
  );

  console.log("Fetching JMA forecast_area.json...");
  const forecastAreaJson = await fetchJson<ForecastAreaJson>(
    "https://www.jma.go.jp/bosai/forecast/const/forecast_area.json"
  );

  console.log("Fetching JMA amedastable.json...");
  const amedasTable = await fetchJson<AmedasTableJson>(
    "https://www.jma.go.jp/bosai/amedas/const/amedastable.json"
  );

  // Build map: class10s code -> parent office code
  const class10sToOffice = new Map<string, string>();
  for (const [code, info] of Object.entries(areaJson.class10s)) {
    class10sToOffice.set(code, info.parent);
  }

  // Build map: class10s code -> representative amedas station coordinates
  // forecast_area.json maps office code -> [{ class10, amedas: [stationId, ...] }]
  const class10sCoords = new Map<string, [number, number]>();

  for (const entries of Object.values(forecastAreaJson)) {
    for (const entry of entries) {
      const class10Code = entry.class10;
      if (class10sCoords.has(class10Code)) continue;

      for (const stationId of entry.amedas) {
        const station = amedasTable[stationId];
        if (station?.lat && station?.lon) {
          const lat = station.lat[0] + station.lat[1] / 60;
          const lon = station.lon[0] + station.lon[1] / 60;
          class10sCoords.set(class10Code, [lat, lon]);
          break;
        }
      }
    }
  }

  const areas: Class10sArea[] = [];
  for (const [code, coords] of class10sCoords.entries()) {
    const officeCode = class10sToOffice.get(code);
    if (!officeCode) continue;
    areas.push({
      code,
      officeCode,
      latitude: coords[0],
      longitude: coords[1],
    });
  }

  console.log(`Built ${areas.length} class10s areas with coordinates.`);
  return areas;
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestClass10s(
  lat: number,
  lon: number,
  areas: Class10sArea[]
): Class10sArea | null {
  let nearest: Class10sArea | null = null;
  let minDist = Infinity;
  for (const area of areas) {
    const dist = haversine(lat, lon, area.latitude, area.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = area;
    }
  }
  return nearest;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Reading GML file...");
  const xml = fs.readFileSync(GML_PATH, "utf-8");

  console.log("Parsing point definitions...");
  const points = parsePoints(xml);
  console.log(`  Found ${points.size} points.`);

  console.log("Parsing dam blocks...");
  const damBlocks = parseDamBlocks(xml);
  console.log(`  Found ${damBlocks.length} dams.`);

  const class10sAreas = await buildClass10sAreas();

  const dams: Dam[] = [];
  const missingPrefecture: string[] = [];
  const missingJma: string[] = [];

  for (const block of damBlocks) {
    const posRefMatch = block.match(/xlink:href="#([^"]+)"/);
    if (!posRefMatch) continue;
    const ptId = posRefMatch[1];
    const coords = points.get(ptId);
    if (!coords) continue;
    const [latitude, longitude] = coords;

    const damName = extractTagValue(block, "damName") ?? "";
    const damCode = extractTagValue(block, "damCode") ?? "";
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

    const pref = matchPrefecture(address);
    if (!pref) {
      missingPrefecture.push(damName || damCode);
      continue;
    }

    const nearest = findNearestClass10s(latitude, longitude, class10sAreas);
    if (!nearest) {
      missingJma.push(damName || damCode);
    }

    dams.push({
      id: `dam-${damCode}`,
      damName,
      prefecture: pref.name,
      prefectureSlug: pref.slug,
      prefectureCode: pref.code,
      latitude,
      longitude,
      damType,
      riverName,
      totalStorageCapacity,
      damHeight,
      completionYear,
      jmaAreaCode: nearest?.code ?? "",
      jmaForecastCode: nearest?.officeCode ?? "",
      isMajor: damHeight !== null && damHeight >= 15,
    });
  }

  // Sort by prefectureCode, then damName
  dams.sort((a, b) => {
    const codeCompare = a.prefectureCode.localeCompare(b.prefectureCode);
    if (codeCompare !== 0) return codeCompare;
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
    a[0].localeCompare(b[0], "ja")
  )) {
    console.log(`  ${name}: ${count}`);
  }

  if (missingPrefecture.length > 0) {
    console.log(`\nDams with unmatched prefecture (${missingPrefecture.length}):`);
    for (const name of missingPrefecture) {
      console.log(`  - ${name}`);
    }
  }

  if (missingJma.length > 0) {
    console.log(`\nDams with missing jmaAreaCode (${missingJma.length}):`);
    for (const name of missingJma) {
      console.log(`  - ${name}`);
    }
  } else {
    console.log("\nAll dams matched to a JMA area code.");
  }

  console.log(`\nOutput written to: ${OUTPUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
