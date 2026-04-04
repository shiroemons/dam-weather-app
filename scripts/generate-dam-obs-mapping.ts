/**
 * generate-dam-obs-mapping.ts
 *
 * Downloads kawabou_dam_master.json from japan-dam-map and matches entries
 * against src/data/dams.json to produce an obsFcd → dam ID mapping file.
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

// ---------------------------------------------------------------------------
// Matching passes
// ---------------------------------------------------------------------------

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

  // Pass 1: exact name match
  const pass1 = matchByExactName(kawabouEntries, dams);
  console.log(`パス1 (ダム名完全一致): ${pass1.size} 件マッチ`);

  const unmatched1 = kawabouEntries.filter(([obsFcd]) => !pass1.has(obsFcd));

  // Pass 2: normalized name match (on unmatched from pass 1)
  const usedDamIds1 = new Set(pass1.values());
  const remainingDams1 = dams.filter((d) => !usedDamIds1.has(d.id));
  const pass2 = matchByNormalizedName(unmatched1, remainingDams1);
  console.log(`パス2 (ダム名正規化一致): ${pass2.size} 件マッチ`);

  const unmatched2 = unmatched1.filter(([obsFcd]) => !pass2.has(obsFcd));

  // Pass 3: coordinate proximity match (on unmatched from pass 1 and 2)
  const usedDamIds2 = new Set([...pass1.values(), ...pass2.values()]);
  const remainingDams2 = dams.filter((d) => !usedDamIds2.has(d.id));
  const pass3 = matchByCoordProximity(unmatched2, remainingDams2);
  console.log(`パス3 (座標近接マッチ): ${pass3.size} 件マッチ`);

  // Merge all passes
  const mapping: Record<string, string> = {};
  for (const [obsFcd, damId] of pass1) {
    mapping[obsFcd] = damId;
  }
  for (const [obsFcd, damId] of pass2) {
    mapping[obsFcd] = damId;
  }
  for (const [obsFcd, damId] of pass3) {
    mapping[obsFcd] = damId;
  }

  const unmatched3 = unmatched2.filter(([obsFcd]) => !pass3.has(obsFcd));
  const totalMatched = pass1.size + pass2.size + pass3.size;

  // Summary
  console.log("\n=== Summary ===");
  console.log(`kawabouエントリ数: ${kawabouEntries.length}`);
  console.log(`マッチ数: ${totalMatched} (パス1: ${pass1.size}, パス2: ${pass2.size}, パス3: ${pass3.size})`);
  console.log(`未マッチ数: ${unmatched3.length}`);

  // Log unmatched entries for debugging
  if (unmatched3.length > 0) {
    console.log("\n=== 未マッチのkawabouエントリ ===");
    for (const [obsFcd, entry] of unmatched3) {
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
