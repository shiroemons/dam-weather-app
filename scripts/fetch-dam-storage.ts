/**
 * fetch-dam-storage.ts
 *
 * 国土交通省「川の防災情報」のJSON APIからダムの貯水率データを取得し、
 * 都道府県別JSONファイルとして public/storage/ に出力するスクリプト。
 *
 * Usage: npx tsx scripts/fetch-dam-storage.ts [--limit N]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "storage");
const DAMS_JSON_PATH = path.join(__dirname, "..", "src", "data", "dams.json");
const OBS_MAPPING_PATH = path.join(__dirname, "..", "src", "data", "dam-obs-mapping.json");
const KAWABOU_BASE_URL = "https://www.river.go.jp/kawabou/file/files/obslist/twninfo/tm/dam";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;
const REQUEST_DELAY_MS = 50;
const USER_AGENT = "Mozilla/5.0 (compatible; dam-weather-app/1.0)";

const HOKKAIDO_SEGMENTS = ["102", "103", "104", "105"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DamEntry {
  id: string;
  prefectureSlug: string;
  prefectureCode: string;
}

interface KawabouDam {
  obsFcd: string;
  dspFlg: number;
  obsTime: string;
  storLvl: number;
  storCap: number;
  storPcntIrr: number;
  storPcntEff: number;
  allSink: number;
  allDisch: number;
}

interface KawabouTwn {
  twnCd: number;
  dam: KawabouDam[];
}

interface KawabouResponse {
  prefTwn: KawabouTwn[];
}

interface DamStorage {
  damId: string;
  obsTime: string;
  storageLevel: number;
  storageCapacity: number;
  storageRate: number | null;
  inflow: number;
  outflow: number;
}

interface PrefectureStorage {
  prefectureSlug: string;
  updatedAt: string;
  dams: DamStorage[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSegments(prefCode: string): string[] {
  if (prefCode === "01") {
    return HOKKAIDO_SEGMENTS;
  }
  return [`${parseInt(prefCode, 10)}01`];
}

function resolveStorageRate(storPcntIrr: number, storPcntEff: number): number | null {
  if (storPcntIrr > 0) return storPcntIrr;
  if (storPcntEff > 0) return storPcntEff;
  return null;
}

function lookupDamId(obsFcd: string, obsMapping: Map<string, string>): string | undefined {
  // まず完全一致で検索
  const exact = obsMapping.get(obsFcd);
  if (exact !== undefined) return exact;

  // 見つからなければ先頭10桁でマッチを試みる
  const prefix = obsFcd.slice(0, 10);
  for (const [key, value] of obsMapping) {
    if (key.startsWith(prefix)) return value;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Kawabou fetch with retry
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string, attempt = 1): Promise<KawabouResponse> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    const message = `HTTP ${res.status} ${res.statusText}`;
    if (attempt < MAX_RETRIES) {
      let waitMs: number;
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 60_000;
        console.warn(
          `  429 Rate limited. Waiting ${waitMs / 1000}s (Retry-After: ${retryAfter ?? "none, default 60s"})`,
        );
      } else {
        waitMs = REQUEST_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`  Retry ${attempt}/${MAX_RETRIES - 1}: ${message} (wait ${waitMs}ms)`);
      }
      await sleep(waitMs);
      return fetchWithRetry(url, attempt + 1);
    }
    throw new Error(message);
  }

  return res.json() as Promise<KawabouResponse>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse --limit argument
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : undefined;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load obs mapping: obsFcd -> damId
  const rawMapping = JSON.parse(fs.readFileSync(OBS_MAPPING_PATH, "utf-8")) as Record<
    string,
    string
  >;
  const obsMapping = new Map<string, string>(Object.entries(rawMapping));
  console.log(`マッピング読み込み: ${obsMapping.size} 件`);

  // Load dams to extract unique prefecture list
  const allDams = JSON.parse(fs.readFileSync(DAMS_JSON_PATH, "utf-8")) as DamEntry[];
  console.log(`ダムデータ読み込み: ${allDams.length} 件`);

  // Unique prefectures ordered by code
  const allPrefectures = [
    ...new Map(allDams.map((d) => [d.prefectureCode, d.prefectureSlug])).entries(),
  ]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, slug]) => ({ code, slug }));

  const prefectures = limit !== undefined ? allPrefectures.slice(0, limit) : allPrefectures;
  if (limit !== undefined) {
    console.log(`最初の ${prefectures.length} 都道府県のみ処理 (--limit ${limit})`);
  }

  // Collect storage data grouped by prefectureSlug
  const storageByPref = new Map<string, DamStorage[]>();
  let totalFetched = 0;
  let totalMatched = 0;

  for (const pref of prefectures) {
    const segments = buildSegments(pref.code);
    const prefDams: DamStorage[] = [];

    for (const segment of segments) {
      const url = `${KAWABOU_BASE_URL}/${segment}.json`;
      console.log(`  Fetching ${pref.slug} [segment ${segment}]: ${url}`);

      let data: KawabouResponse;
      try {
        data = await fetchWithRetry(url);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  セグメント ${segment} の取得失敗: ${message}`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      // Flatten all dam entries from all towns
      const kawabouDams = data.prefTwn.flatMap((twn) => twn.dam ?? []);
      totalFetched += kawabouDams.length;

      for (const kawabouDam of kawabouDams) {
        const damId = lookupDamId(kawabouDam.obsFcd, obsMapping);
        if (damId === undefined) continue;

        totalMatched++;
        prefDams.push({
          damId,
          obsTime: kawabouDam.obsTime,
          storageLevel: kawabouDam.storLvl,
          storageCapacity: kawabouDam.storCap,
          storageRate: resolveStorageRate(kawabouDam.storPcntIrr, kawabouDam.storPcntEff),
          inflow: kawabouDam.allSink,
          outflow: kawabouDam.allDisch,
        });
      }

      await sleep(REQUEST_DELAY_MS);
    }

    if (prefDams.length > 0) {
      storageByPref.set(pref.slug, prefDams);
    }
    console.log(`  ${pref.slug}: ${prefDams.length} 件マッチ`);
  }

  // Write prefecture JSON files
  const updatedAt = new Date().toISOString();
  let successCount = 0;

  for (const [prefectureSlug, dams] of storageByPref) {
    const prefStorage: PrefectureStorage = { prefectureSlug, updatedAt, dams };
    const outputPath = path.join(OUTPUT_DIR, `${prefectureSlug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(prefStorage, null, 2), "utf-8");
    successCount++;
  }

  console.log("\n=== サマリ ===");
  console.log(`総ダム取得数（API）: ${totalFetched}`);
  console.log(`マッピングマッチ数: ${totalMatched}`);
  console.log(`都道府県ファイル出力数: ${successCount}`);
  console.log(`\n出力先: ${OUTPUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
