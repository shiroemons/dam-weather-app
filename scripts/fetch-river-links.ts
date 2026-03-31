/**
 * fetch-river-links.ts
 *
 * Fetches dam observatory data from the river disaster prevention API (river.go.jp)
 * and saves the results as a TSV file under scripts/data/.
 *
 * Usage: npx tsx scripts/fetch-river-links.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "data", "river-dam-links.tsv");
const TOWN_AREA_URL = "https://www.river.go.jp/kawabou/file/files/map/twn/twnarea.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Town {
  twnCd: string;
  damExistFlg: unknown;
}

interface TownAreaResponse {
  towns: Town[];
}

interface DamFeatureProperties {
  obs_nm: string;
  ofc_cd: string;
  obs_cd: string;
  itmknd_cd: string;
  lat: number;
  lon: number;
}

interface DamFeature {
  properties: DamFeatureProperties;
}

interface DamGeoJSON {
  features: DamFeature[];
}

interface DamRecord {
  obs_nm: string;
  ofc_cd: string;
  obs_cd: string;
  itmknd_cd: string;
  lat: number;
  lon: number;
  url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes the date/time path segments for the river.go.jp API.
 * Uses the current JST time minus 10 minutes, rounded down to the nearest 10 minutes.
 */
function computeDateTimePath(): { datePart: string; timePart: string } {
  const now = new Date();

  // Convert to JST (UTC+9)
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstMs = now.getTime() + jstOffset;
  const jst = new Date(jstMs);

  // Subtract 10 minutes to account for data publication delay
  jst.setUTCMinutes(jst.getUTCMinutes() - 10);

  // Round down to the nearest 10 minutes
  const roundedMinutes = Math.floor(jst.getUTCMinutes() / 10) * 10;
  jst.setUTCMinutes(roundedMinutes);

  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jst.getUTCDate()).padStart(2, "0");
  const hours = String(jst.getUTCHours()).padStart(2, "0");
  const minutes = String(jst.getUTCMinutes()).padStart(2, "0");

  return {
    datePart: `${year}${month}${day}`,
    timePart: `${hours}${minutes}`,
  };
}

function buildRiverUrl(props: DamFeatureProperties): string {
  const params = new URLSearchParams({
    zm: "15",
    clat: String(props.lat),
    clon: String(props.lon),
    fld: "0",
    ofcCd: props.ofc_cd,
    itmkndCd: props.itmknd_cd,
    obsCd: props.obs_cd,
    mapType: "0",
  });
  return `https://www.river.go.jp/kawabou/pc/tm?${params.toString()}`;
}

function deduplicateKey(record: DamRecord): string {
  return `${record.ofc_cd}:${record.obs_cd}`;
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function fetchTownArea(): Promise<Town[]> {
  console.log("Fetching town area list...");
  const res = await fetch(TOWN_AREA_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch town area: HTTP ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as TownAreaResponse;
  const damTowns = data.towns.filter((t) => t.damExistFlg);
  console.log(`  Found ${data.towns.length} towns, ${damTowns.length} with dams`);
  return damTowns;
}

async function fetchDamGeoJSON(
  twnCd: string,
  datePart: string,
  timePart: string,
): Promise<DamFeature[]> {
  const url = `https://www.river.go.jp/kawabou/file/gjson/obs/${datePart}/${timePart}/dam/${twnCd}.json`;
  const res = await fetch(url);

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    console.warn(`  Warning: Failed to fetch dam data for town ${twnCd}: HTTP ${res.status}`);
    return [];
  }

  const data = (await res.json()) as DamGeoJSON;
  return data.features ?? [];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const towns = await fetchTownArea();
  const { datePart, timePart } = computeDateTimePath();
  console.log(`\nUsing date/time: ${datePart}/${timePart}`);

  const allRecords: DamRecord[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < towns.length; i++) {
    const town = towns[i];
    if (!town) continue;

    console.log(`Fetching dams for town ${town.twnCd} (${i + 1}/${towns.length})...`);

    let features: DamFeature[];
    try {
      features = await fetchDamGeoJSON(town.twnCd, datePart, timePart);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  Warning: Skipping town ${town.twnCd}: ${message}`);
      await sleep(FETCH_DELAY_MS);
      continue;
    }

    for (const feature of features) {
      const props = feature.properties;
      const record: DamRecord = {
        obs_nm: props.obs_nm,
        ofc_cd: props.ofc_cd,
        obs_cd: props.obs_cd,
        itmknd_cd: props.itmknd_cd,
        lat: props.lat,
        lon: props.lon,
        url: buildRiverUrl(props),
      };

      const key = deduplicateKey(record);
      if (!seen.has(key)) {
        seen.add(key);
        allRecords.push(record);
      }
    }

    if (features.length > 0) {
      console.log(`  Found ${features.length} dam(s)`);
    }

    if (i < towns.length - 1) {
      await sleep(FETCH_DELAY_MS);
    }
  }

  // Sort by obs_nm
  allRecords.sort((a, b) => a.obs_nm.localeCompare(b.obs_nm, "ja"));

  // Build TSV content
  const header = ["obs_nm", "ofc_cd", "obs_cd", "itmknd_cd", "lat", "lon", "url"].join("\t");
  const rows = allRecords.map((r) =>
    [r.obs_nm, r.ofc_cd, r.obs_cd, r.itmknd_cd, r.lat, r.lon, r.url].join("\t"),
  );
  const tsv = [header, ...rows].join("\n") + "\n";

  fs.writeFileSync(OUTPUT_PATH, tsv, "utf-8");

  console.log("\n=== Summary ===");
  console.log(`Towns with dams: ${towns.length}`);
  console.log(`Unique dams found: ${allRecords.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
