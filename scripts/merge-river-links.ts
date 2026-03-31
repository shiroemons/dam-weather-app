/**
 * merge-river-links.ts
 *
 * Merges dam data from river.go.jp (TSV) with the project's dams.json,
 * adding a riverUrl field to matched dams.
 *
 * Usage: npx tsx scripts/merge-river-links.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TSV_PATH = path.join(__dirname, "data", "river-dam-links.tsv");
const DAMS_JSON_PATH = path.join(__dirname, "..", "src", "data", "dams.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RiverDamRecord {
  obs_nm: string;
  lat: number | null;
  lon: number | null;
  url: string;
}

interface DamEntry {
  id: string;
  damName: string;
  latitude: number;
  longitude: number;
  riverUrl?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips the trailing "ダム" (and optional parenthetical suffix like "（発電）")
 * from a river.go.jp dam name.
 *
 * Examples:
 *   "ペーパンダム"     → "ペーパン"
 *   "クチスボダム（発電）" → "クチスボ"
 *   "畑ダム"           → "畑"
 */
function stripDamSuffix(obsName: string): string {
  return obsName.replace(/ダム(?:（[^）]*）)?$/, "");
}

/**
 * Computes the approximate distance between two lat/lon points in degrees.
 * Uses simple Euclidean distance — sufficient for nearby-point comparison.
 */
function coordDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Parses the TSV file and returns records with valid lat/lon (excludes aggregate rows).
 */
function parseTsv(tsvContent: string): RiverDamRecord[] {
  const lines = tsvContent.trim().split("\n");
  // Skip header
  const dataLines = lines.slice(1);

  const records: RiverDamRecord[] = [];

  for (const line of dataLines) {
    const cols = line.split("\t");
    const obs_nm = cols[0] ?? "";
    const latStr = cols[4] ?? "";
    const lonStr = cols[5] ?? "";
    const url = cols[6] ?? "";

    // Skip rows with empty lat/lon (aggregate rows like "10ダム合計")
    if (latStr === "" || lonStr === "") {
      continue;
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      continue;
    }

    records.push({ obs_nm, lat, lon, url });
  }

  return records;
}

/**
 * Finds the best matching dam for a given river record.
 *
 * 1. Name match: compare stripped obs_nm with damName
 * 2. If multiple name matches, pick the closest by coordinates
 * 3. Fallback: coordinate-only match within 0.01 degrees
 */
function findBestMatch(
  record: RiverDamRecord,
  dams: DamEntry[],
  assignedDamIds: Set<string>,
): DamEntry | null {
  const strippedName = stripDamSuffix(record.obs_nm);

  // Step 1 & 2: Name match candidates
  const nameCandidates = dams.filter(
    (dam) => dam.damName === strippedName && !assignedDamIds.has(dam.id),
  );

  if (nameCandidates.length === 1) {
    return nameCandidates[0]!;
  }

  if (nameCandidates.length > 1 && record.lat !== null && record.lon !== null) {
    // Pick the closest by coordinates
    let bestDam: DamEntry | null = null;
    let bestDist = Infinity;

    for (const dam of nameCandidates) {
      const dist = coordDistance(record.lat, record.lon, dam.latitude, dam.longitude);
      if (dist < bestDist) {
        bestDist = dist;
        bestDam = dam;
      }
    }

    return bestDam;
  }

  // Step 3: Coordinate-only fallback (within 0.01 degrees)
  if (record.lat !== null && record.lon !== null) {
    const COORD_THRESHOLD = 0.01;
    let bestDam: DamEntry | null = null;
    let bestDist = Infinity;

    for (const dam of dams) {
      if (assignedDamIds.has(dam.id)) continue;

      const dist = coordDistance(record.lat, record.lon, dam.latitude, dam.longitude);
      if (dist < COORD_THRESHOLD && dist < bestDist) {
        bestDist = dist;
        bestDam = dam;
      }
    }

    return bestDam;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // Read inputs
  const tsvContent = fs.readFileSync(TSV_PATH, "utf-8");
  const dams = JSON.parse(fs.readFileSync(DAMS_JSON_PATH, "utf-8")) as DamEntry[];

  // Parse TSV (excluding aggregate rows)
  const riverRecords = parseTsv(tsvContent);
  console.log(`TSV records (excluding aggregate rows): ${riverRecords.length}`);
  console.log(`dams.json entries: ${dams.length}`);

  // Build dam index by name for quick lookup (not used directly, but matching is done in findBestMatch)
  const assignedDamIds = new Set<string>();
  let matchCount = 0;
  const unmatchedNames: string[] = [];

  for (const record of riverRecords) {
    const matched = findBestMatch(record, dams, assignedDamIds);

    if (matched) {
      matched.riverUrl = record.url;
      assignedDamIds.add(matched.id);
      matchCount++;
    } else {
      unmatchedNames.push(record.obs_nm);
    }
  }

  // Count dams with riverUrl
  const damsWithRiverUrl = dams.filter((d) => d.riverUrl !== undefined).length;

  // Write updated dams.json
  fs.writeFileSync(DAMS_JSON_PATH, JSON.stringify(dams, null, 2) + "\n", "utf-8");

  // Print summary
  console.log("\n=== Summary ===");
  console.log(`TSV total records (excluding aggregates): ${riverRecords.length}`);
  console.log(`Match succeeded: ${matchCount}`);
  console.log(`Match failed: ${unmatchedNames.length}`);

  if (unmatchedNames.length > 0) {
    console.log("\nUnmatched TSV dams:");
    for (const name of unmatchedNames) {
      console.log(`  - ${name}`);
    }
  }

  console.log(`\ndams.json entries with riverUrl: ${damsWithRiverUrl}/${dams.length}`);
}

main();
