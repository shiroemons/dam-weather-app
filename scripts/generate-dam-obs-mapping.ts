/**
 * generate-dam-obs-mapping.ts
 *
 * Downloads kawabou_dam_master.json from japan-dam-map and matches entries
 * against src/data/dams.json to produce an obsFcd → dam ID mapping file.
 *
 * Matching is performed in 4 passes:
 *   Pass 0: Direct derivation from riverUrl (most reliable)
 *   Pass 1: Exact dam name match via kawabou_dam_master
 *   Pass 2: Normalized dam name match via kawabou_dam_master
 *   Pass 3: Coordinate proximity match via kawabou_dam_master
 *
 * Usage: npx tsx scripts/generate-dam-obs-mapping.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAMS_JSON_PATH = path.join(__dirname, "..", "src", "data", "dams.json");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "dam-obs-mapping.json");
const KAWABOU_MASTER_URL =
  "https://raw.githubusercontent.com/WeatherNote/japan-dam-map/main/data/kawabou_dam_master.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DamEntry {
  id: string;
  damName: string;
  prefecture: string;
  prefectureCode: string;
  latitude: number;
  longitude: number;
  riverUrl?: string;
}

interface KawabouEntry {
  name: string;
  kana: string | null;
  river: string | null;
  lat: number;
  lon: number;
  prefCd: number;
  twnCd: number;
}

interface KawabouMaster {
  _updated: string;
  _timestamp_used: string;
  dams: Record<string, KawabouEntry>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function kawabouPrefCode(prefCd: number): string {
  const str = String(prefCd);
  // 3桁以下は北海道（01）、4桁以上は上2桁が都道府県コード
  if (str.length <= 3) {
    return "01";
  }
  return str.slice(0, 2);
}

function normalizeName(name: string): string {
  // 末尾の「ダム」を除去
  let n = name.replace(/ダム$/, "");
  // 全角英数字を半角に変換
  n = n.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
  // スペース除去
  n = n.replace(/\s+/g, "");
  // 「（」「）」内の注釈を除去
  n = n.replace(/（[^）]*）/g, "");
  n = n.replace(/\([^)]*\)/g, "");
  return n;
}

function coordDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

/**
 * riverUrl から obsFcd を導出する。
 * パターン: ofcCd=XXXXX&itmkndCd=7&obsCd=Y
 * obsFcd = ofcCd(0パディング5桁) + "007" + obsCd(0パディング5桁)
 * itmkndCd=7 以外のURLはスキップする。
 */
function deriveObsFcdFromRiverUrl(riverUrl: string): string | null {
  const url = new URL(riverUrl);
  const itmkndCd = url.searchParams.get("itmkndCd");
  if (itmkndCd !== "7") {
    return null;
  }
  const ofcCd = url.searchParams.get("ofcCd");
  const obsCd = url.searchParams.get("obsCd");
  if (!ofcCd || !obsCd) {
    return null;
  }
  return ofcCd.padStart(5, "0") + "007" + obsCd.padStart(5, "0");
}

// ---------------------------------------------------------------------------
// Matching passes
// ---------------------------------------------------------------------------

function matchByRiverUrl(dams: DamEntry[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const dam of dams) {
    if (!dam.riverUrl) {
      continue;
    }
    const obsFcd = deriveObsFcdFromRiverUrl(dam.riverUrl);
    if (obsFcd) {
      result.set(obsFcd, dam.id);
    }
  }
  return result;
}

function matchByExactName(
  kawabouEntries: [string, KawabouEntry][],
  dams: DamEntry[],
): Map<string, string> {
  const damsByName = new Map<string, DamEntry>();
  for (const dam of dams) {
    damsByName.set(dam.damName, dam);
  }

  const result = new Map<string, string>();
  for (const [obsFcd, entry] of kawabouEntries) {
    const dam = damsByName.get(entry.name);
    if (dam) {
      result.set(obsFcd, dam.id);
    }
  }
  return result;
}

function matchByNormalizedName(
  kawabouEntries: [string, KawabouEntry][],
  dams: DamEntry[],
): Map<string, string> {
  const damsByNorm = new Map<string, DamEntry>();
  for (const dam of dams) {
    const norm = normalizeName(dam.damName);
    if (norm) {
      damsByNorm.set(norm, dam);
    }
  }

  const result = new Map<string, string>();
  for (const [obsFcd, entry] of kawabouEntries) {
    const norm = normalizeName(entry.name);
    const dam = damsByNorm.get(norm);
    if (dam) {
      result.set(obsFcd, dam.id);
    }
  }
  return result;
}

function matchByCoordProximity(
  kawabouEntries: [string, KawabouEntry][],
  dams: DamEntry[],
  threshold = 0.01,
): Map<string, string> {
  const result = new Map<string, string>();

  for (const [obsFcd, entry] of kawabouEntries) {
    const prefCode = kawabouPrefCode(entry.prefCd);
    const samePrefDams = dams.filter((d) => d.prefectureCode === prefCode);

    let bestDam: DamEntry | null = null;
    let bestDist = Infinity;

    for (const dam of samePrefDams) {
      const dist = coordDistance(entry.lat, entry.lon, dam.latitude, dam.longitude);
      if (dist < bestDist) {
        bestDist = dist;
        bestDam = dam;
      }
    }

    if (bestDam && bestDist <= threshold) {
      result.set(obsFcd, bestDam.id);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Fetch kawabou_dam_master.json
  console.log(`kawabou_dam_master.json を取得中: ${KAWABOU_MASTER_URL}`);
  const res = await fetch(KAWABOU_MASTER_URL);
  if (!res.ok) {
    console.error(`取得失敗: HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const kawabouMaster = (await res.json()) as KawabouMaster;
  const kawabouEntries = Object.entries(kawabouMaster.dams);
  console.log(`kawabouエントリ数: ${kawabouEntries.length}`);

  // Load dams.json
  const dams = JSON.parse(fs.readFileSync(DAMS_JSON_PATH, "utf-8")) as DamEntry[];
  console.log(`dams.json 読み込み: ${dams.length} ダム\n`);

  // Pass 0: direct derivation from riverUrl (highest reliability)
  const pass0 = matchByRiverUrl(dams);
  console.log(`パス0 (riverUrl直接導出): ${pass0.size} 件マッチ`);

  // Exclude pass0 matches from kawabou-based passes
  const pass0DamIds = new Set(pass0.values());
  const remainingForKawabou = dams.filter((d) => !pass0DamIds.has(d.id));
  const kawabouUnmatched0 = kawabouEntries.filter(([obsFcd]) => !pass0.has(obsFcd));

  // Pass 1: exact name match (on dams not matched in pass 0)
  const pass1 = matchByExactName(kawabouUnmatched0, remainingForKawabou);
  console.log(`パス1 (ダム名完全一致): ${pass1.size} 件マッチ`);

  const kawabouUnmatched1 = kawabouUnmatched0.filter(([obsFcd]) => !pass1.has(obsFcd));

  // Pass 2: normalized name match (on unmatched from pass 1)
  const usedDamIds1 = new Set([...pass0DamIds, ...pass1.values()]);
  const remainingDams1 = dams.filter((d) => !usedDamIds1.has(d.id));
  const pass2 = matchByNormalizedName(kawabouUnmatched1, remainingDams1);
  console.log(`パス2 (ダム名正規化一致): ${pass2.size} 件マッチ`);

  const kawabouUnmatched2 = kawabouUnmatched1.filter(([obsFcd]) => !pass2.has(obsFcd));

  // Pass 3: coordinate proximity match (on unmatched from passes 1 and 2)
  const usedDamIds2 = new Set([...usedDamIds1, ...pass2.values()]);
  const remainingDams2 = dams.filter((d) => !usedDamIds2.has(d.id));
  const pass3 = matchByCoordProximity(kawabouUnmatched2, remainingDams2);
  console.log(`パス3 (座標近接マッチ): ${pass3.size} 件マッチ`);

  // Merge all passes
  const mapping: Record<string, string> = {};
  for (const [obsFcd, damId] of pass0) {
    mapping[obsFcd] = damId;
  }
  for (const [obsFcd, damId] of pass1) {
    mapping[obsFcd] = damId;
  }
  for (const [obsFcd, damId] of pass2) {
    mapping[obsFcd] = damId;
  }
  for (const [obsFcd, damId] of pass3) {
    mapping[obsFcd] = damId;
  }

  const kawabouUnmatched3 = kawabouUnmatched2.filter(([obsFcd]) => !pass3.has(obsFcd));
  const totalMatched = pass0.size + pass1.size + pass2.size + pass3.size;

  // Summary
  console.log("\n=== Summary ===");
  console.log(`dams.json 総件数: ${dams.length}`);
  console.log(`kawabouエントリ数: ${kawabouEntries.length}`);
  console.log(
    `マッチ数: ${totalMatched} (パス0: ${pass0.size}, パス1: ${pass1.size}, パス2: ${pass2.size}, パス3: ${pass3.size})`,
  );
  console.log(`kawabou未マッチ数: ${kawabouUnmatched3.length}`);

  // Log unmatched kawabou entries for debugging
  if (kawabouUnmatched3.length > 0) {
    console.log("\n=== 未マッチのkawabouエントリ ===");
    for (const [obsFcd, entry] of kawabouUnmatched3) {
      const prefCode = kawabouPrefCode(entry.prefCd);
      console.log(
        `  ${obsFcd}  ${entry.name}  prefCd=${entry.prefCd}(→${prefCode})  lat=${entry.lat}  lon=${entry.lon}`,
      );
    }
  }

  // Sort by obsFcd key and write output
  const sorted = Object.fromEntries(
    Object.entries(mapping).sort(([a], [b]) => a.localeCompare(b)),
  );

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2), "utf-8");
  console.log(`\nマッピングを書き出しました: ${OUTPUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
