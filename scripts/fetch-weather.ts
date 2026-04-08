/**
 * fetch-weather.ts
 *
 * Fetches weather forecast data for all dams from Open-Meteo API
 * and saves them as prefecture-grouped JSON files under public/weather/.
 *
 * Usage: npx tsx scripts/fetch-weather.ts [--limit N] [--retry]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "weather");
const DAMS_JSON_PATH = path.join(__dirname, "..", "src", "data", "dams.json");
const FAILED_JSON_PATH = path.join(OUTPUT_DIR, "_failed.json");
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_SIZE = 650;
const MAX_RETRIES = 2; // 1 initial + 1 retry
const BATCH_DELAY_MS = 15_000; // 15s between batches
const FETCH_TIMEOUT_MS = 30_000; // 30s per-request timeout
const MAX_RETRY_WAIT_MS = 60_000; // cap Retry-After at 60s
const MAX_CONSECUTIVE_FAILURES = 3; // circuit breaker threshold
const COORD_PRECISION = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DamEntry {
  id: string;
  prefectureSlug: string;
  latitude: number;
  longitude: number;
}

interface DayForecast {
  date: string;
  weatherCode: number;
  weather: string;
  tempMax: number | null;
  tempMin: number | null;
  precipProbability: number | null;
  precipitationSum: number | null;
}

interface DamWeather {
  damId: string;
  today: DayForecast;
  tomorrow: DayForecast;
}

interface PrefectureWeather {
  prefectureSlug: string;
  updatedAt: string;
  distribution: Record<WeatherCategory, number>;
  dams: DamWeather[];
}

interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  precipitation_probability_max: (number | null)[];
}

interface OpenMeteoResponse {
  daily: OpenMeteoDaily;
}

interface CoordGroup {
  lat: number;
  lng: number;
  damIds: string[];
}

interface FailedCoordsFile {
  savedAt: string;
  failedCoords: CoordGroup[];
}

class RateLimitError extends Error {
  retryAfterMs: number;
  daily: boolean;
  constructor(message: string, retryAfterMs: number, daily = false) {
    super(message);
    this.retryAfterMs = retryAfterMs;
    this.daily = daily;
  }
}

// ---------------------------------------------------------------------------
// WMO weather code helpers
// ---------------------------------------------------------------------------

type WeatherCategory = "sunny" | "cloudy" | "rain" | "snow" | "default";

function getWeatherCategory(code: number): WeatherCategory {
  if (code <= 1) return "sunny";
  if (code <= 3 || code === 45 || code === 48) return "cloudy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99))
    return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  return "default";
}

// ---------------------------------------------------------------------------
// WMO weather code labels
// ---------------------------------------------------------------------------

const WMO_LABELS: Record<number, string> = {
  0: "快晴",
  1: "晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "着氷性の霧",
  51: "弱い霧雨",
  53: "霧雨",
  55: "強い霧雨",
  56: "弱い着氷性霧雨",
  57: "強い着氷性霧雨",
  61: "弱い雨",
  63: "雨",
  65: "強い雨",
  66: "弱い着氷性の雨",
  67: "強い着氷性の雨",
  71: "弱い雪",
  73: "雪",
  75: "強い雪",
  77: "霧雪",
  80: "弱いにわか雨",
  81: "にわか雨",
  82: "激しいにわか雨",
  85: "弱いにわか雪",
  86: "強いにわか雪",
  95: "雷雨",
  96: "雹を伴う雷雨",
  99: "激しい雹を伴う雷雨",
};

function wmoLabel(code: number): string {
  return WMO_LABELS[code] ?? `天気コード ${code}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDayForecast(daily: OpenMeteoDaily, index: number): DayForecast {
  const code = daily.weather_code[index] ?? 0;
  return {
    date: daily.time[index] ?? "",
    weatherCode: code,
    weather: wmoLabel(code),
    tempMax: daily.temperature_2m_max[index] ?? null,
    tempMin: daily.temperature_2m_min[index] ?? null,
    precipProbability: daily.precipitation_probability_max[index] ?? null,
    precipitationSum: daily.precipitation_sum[index] ?? null,
  };
}

function coordKey(lat: number, lng: number): string {
  const f = Math.pow(10, COORD_PRECISION);
  return `${Math.round(lat * f) / f},${Math.round(lng * f) / f}`;
}

function groupByCoord(dams: DamEntry[]): CoordGroup[] {
  const map = new Map<string, CoordGroup>();

  for (const dam of dams) {
    const key = coordKey(dam.latitude, dam.longitude);
    const existing = map.get(key);
    if (existing) {
      existing.damIds.push(dam.id);
    } else {
      const f = Math.pow(10, COORD_PRECISION);
      map.set(key, {
        lat: Math.round(dam.latitude * f) / f,
        lng: Math.round(dam.longitude * f) / f,
        damIds: [dam.id],
      });
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Open-Meteo fetch with retry
// ---------------------------------------------------------------------------

async function fetchBatch(coords: CoordGroup[], attempt = 1): Promise<OpenMeteoResponse[]> {
  const body = {
    latitude: coords.map((c) => c.lat),
    longitude: coords.map((c) => c.lng),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
    ],
    timezone: ["Asia/Tokyo"],
    forecast_days: 2,
  };

  console.log(`  POST ${coords.length} coordinates (attempt ${attempt}/${MAX_RETRIES})`);

  let res: Response;
  try {
    res = await fetch(OPEN_METEO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && err.cause ? ` [cause: ${err.cause}]` : "";
    if (attempt < MAX_RETRIES) {
      console.warn(`  Request failed: ${message}${cause}. Waiting 5s before retry...`);
      await sleep(5_000);
      return fetchBatch(coords, attempt + 1);
    }
    throw new Error(`Request failed after ${MAX_RETRIES} attempts: ${message}${cause}`);
  }

  if (!res.ok) {
    let reason = "";
    if (res.status === 429) {
      try {
        const errBody = (await res.json()) as { error?: boolean; reason?: string };
        reason = errBody.reason ?? "";
      } catch {
        // ignore parse errors
      }
    }

    const message = reason
      ? `HTTP ${res.status} ${res.statusText} (${reason})`
      : `HTTP ${res.status} ${res.statusText}`;

    if (res.status === 429) {
      const isDaily = reason.toLowerCase().includes("daily");
      if (isDaily) {
        console.error(`  Daily API limit exceeded. Stopping retries.`);
        throw new RateLimitError(message, 0, true);
      }

      const retryAfter = res.headers.get("Retry-After");
      const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 60_000;

      if (retryAfterMs > MAX_RETRY_WAIT_MS) {
        console.error(
          `  Retry-After ${retryAfterMs / 1000}s exceeds cap of ${MAX_RETRY_WAIT_MS / 1000}s. Aborting.`,
        );
        throw new RateLimitError(message, retryAfterMs);
      }

      if (attempt < MAX_RETRIES) {
        console.warn(
          `  429 Rate limited: ${reason || "unknown reason"}. Waiting ${retryAfterMs / 1000}s...`,
        );
        await sleep(retryAfterMs);
        return fetchBatch(coords, attempt + 1);
      }

      throw new RateLimitError(message, retryAfterMs);
    }

    if (attempt < MAX_RETRIES) {
      console.warn(`  Retry ${attempt}/${MAX_RETRIES}: ${message}. Waiting 5s...`);
      await sleep(5_000);
      return fetchBatch(coords, attempt + 1);
    }

    throw new Error(message);
  }

  const data = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[];
  return Array.isArray(data) ? data : [data];
}

// ---------------------------------------------------------------------------
// Circuit-breaker fetch loop
// ---------------------------------------------------------------------------

interface FetchLoopResult {
  dailyLimitHit: boolean;
  failedCoords: CoordGroup[];
}

async function fetchLoop(
  coordGroups: CoordGroup[],
  weatherByCoordKey: Map<string, OpenMeteoResponse>,
): Promise<FetchLoopResult> {
  const batches: CoordGroup[][] = [];
  for (let i = 0; i < coordGroups.length; i += BATCH_SIZE) {
    batches.push(coordGroups.slice(i, i + BATCH_SIZE));
  }

  const failedCoords: CoordGroup[] = [];
  let consecutiveFailures = 0;
  let dailyLimitHit = false;

  for (let b = 0; b < batches.length; b++) {
    const coords = batches[b];
    const batchNum = b + 1;
    const startIndex = b * BATCH_SIZE;
    console.log(
      `\nBatch ${batchNum}/${batches.length}: fetching ${coords.length} coordinates (index ${startIndex}–${startIndex + coords.length - 1})...`,
    );

    let responses: OpenMeteoResponse[];
    try {
      responses = await fetchBatch(coords);
      consecutiveFailures = 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Batch ${batchNum} failed: ${message}`);

      if (err instanceof RateLimitError && err.daily) {
        dailyLimitHit = true;
        for (let r = b; r < batches.length; r++) {
          failedCoords.push(...(batches[r] ?? []));
        }
        break;
      }

      failedCoords.push(...coords);

      if (err instanceof RateLimitError) {
        // 429 rate limit: do not count toward circuit breaker
      } else {
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.error(
            `  ${MAX_CONSECUTIVE_FAILURES} consecutive failures — API appears down, aborting.`,
          );
          for (let r = b + 1; r < batches.length; r++) {
            failedCoords.push(...(batches[r] ?? []));
          }
          break;
        }
      }

      if (b + 1 < batches.length) {
        await sleep(BATCH_DELAY_MS);
      }
      continue;
    }

    for (let j = 0; j < coords.length; j++) {
      const group = coords[j];
      const res = responses[j];
      if (!group || !res) continue;
      weatherByCoordKey.set(coordKey(group.lat, group.lng), res);
    }

    console.log(`  ${responses.length} responses processed`);

    if (b + 1 < batches.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { dailyLimitHit, failedCoords };
}

// ---------------------------------------------------------------------------
// Merge retry results into existing prefecture JSON files
// ---------------------------------------------------------------------------

function mergeRetryResults(
  weatherByCoordKey: Map<string, OpenMeteoResponse>,
  fetchedGroups: CoordGroup[],
): void {
  const allDams = JSON.parse(fs.readFileSync(DAMS_JSON_PATH, "utf-8")) as DamEntry[];
  const fetchedDamIds = new Set(fetchedGroups.flatMap((g) => g.damIds));
  const relevantDams = allDams.filter((d) => fetchedDamIds.has(d.id));

  const newDamWeather = new Map<string, DamWeather>();
  for (const dam of relevantDams) {
    const key = coordKey(dam.latitude, dam.longitude);
    const res = weatherByCoordKey.get(key);
    if (!res) continue;
    newDamWeather.set(dam.id, {
      damId: dam.id,
      today: buildDayForecast(res.daily, 0),
      tomorrow: buildDayForecast(res.daily, 1),
    });
  }

  const byPrefecture = new Map<string, DamWeather[]>();
  for (const dam of relevantDams) {
    const weather = newDamWeather.get(dam.id);
    if (!weather) continue;
    const list = byPrefecture.get(dam.prefectureSlug) ?? [];
    list.push(weather);
    byPrefecture.set(dam.prefectureSlug, list);
  }

  const updatedAt = new Date().toISOString();

  for (const [prefectureSlug, newDams] of byPrefecture) {
    const outputPath = path.join(OUTPUT_DIR, `${prefectureSlug}.json`);

    let existing: PrefectureWeather;
    if (fs.existsSync(outputPath)) {
      existing = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as PrefectureWeather;
      const newIds = new Set(newDams.map((d) => d.damId));
      existing.dams = existing.dams.filter((d) => !newIds.has(d.damId));
    } else {
      existing = {
        prefectureSlug,
        updatedAt,
        distribution: { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 },
        dams: [],
      };
    }

    existing.dams.push(...newDams);
    existing.updatedAt = updatedAt;

    const distribution: Record<WeatherCategory, number> = {
      sunny: 0,
      cloudy: 0,
      rain: 0,
      snow: 0,
      default: 0,
    };
    for (const dam of existing.dams) {
      distribution[getWeatherCategory(dam.today.weatherCode)]++;
    }
    existing.distribution = distribution;

    fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2), "utf-8");
    console.log(`  Merged ${newDams.length} dam(s) into ${prefectureSlug}.json`);
  }
}

// ---------------------------------------------------------------------------
// --retry mode: reprocess _failed.json
// ---------------------------------------------------------------------------

async function retryFailedCoords(): Promise<void> {
  if (!fs.existsSync(FAILED_JSON_PATH)) {
    console.log("No _failed.json found. Nothing to retry.");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(FAILED_JSON_PATH, "utf-8")) as FailedCoordsFile;
  const { failedCoords } = raw;

  if (failedCoords.length === 0) {
    console.log("_failed.json is empty. Nothing to retry.");
    fs.unlinkSync(FAILED_JSON_PATH);
    return;
  }

  console.log(`Retrying ${failedCoords.length} failed coordinates (saved at ${raw.savedAt})`);

  const weatherByCoordKey = new Map<string, OpenMeteoResponse>();
  const { dailyLimitHit } = await fetchLoop(failedCoords, weatherByCoordKey);

  if (dailyLimitHit) {
    console.error("Daily API limit exceeded. Cannot retry until tomorrow (UTC 0:00).");
  }

  const stillFailed = failedCoords.filter((g) => !weatherByCoordKey.has(coordKey(g.lat, g.lng)));
  const successCount = failedCoords.length - stillFailed.length;

  if (successCount > 0) {
    const successfulGroups = failedCoords.filter((g) =>
      weatherByCoordKey.has(coordKey(g.lat, g.lng)),
    );
    mergeRetryResults(weatherByCoordKey, successfulGroups);
  }

  if (stillFailed.length === 0) {
    fs.unlinkSync(FAILED_JSON_PATH);
    console.log("\nAll coordinates fetched successfully. _failed.json removed.");
  } else {
    const payload: FailedCoordsFile = {
      savedAt: new Date().toISOString(),
      failedCoords: stillFailed,
    };
    fs.writeFileSync(FAILED_JSON_PATH, JSON.stringify(payload, null, 2), "utf-8");
    console.warn(`\n${stillFailed.length} coordinates still failed. _failed.json updated.`);
  }

  console.log("\n=== Retry Summary ===");
  console.log(`Attempted coordinates: ${failedCoords.length}`);
  console.log(`Successfully fetched: ${successCount}`);
  console.log(`Still failing: ${stillFailed.length}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : undefined;
  const retryFlag = process.argv.includes("--retry");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (retryFlag) {
    if (limit !== undefined) {
      console.warn("Warning: --limit is ignored when --retry is used.");
    }
    await retryFailedCoords();
    return;
  }

  const allDams = JSON.parse(fs.readFileSync(DAMS_JSON_PATH, "utf-8")) as DamEntry[];
  console.log(`Loaded ${allDams.length} dams from dams.json`);

  const allCoordGroups = groupByCoord(allDams);
  console.log(`Unique coordinates: ${allCoordGroups.length} (from ${allDams.length} dams)`);

  const coordGroups = limit !== undefined ? allCoordGroups.slice(0, limit) : allCoordGroups;
  if (limit !== undefined) {
    console.log(`Limiting to ${coordGroups.length} unique coordinates (--limit ${limit})`);
  }

  const weatherByCoordKey = new Map<string, OpenMeteoResponse>();
  const { failedCoords } = await fetchLoop(coordGroups, weatherByCoordKey);

  // Map weather responses back to each dam via coordinate key
  const damWeatherMap = new Map<string, DamWeather>();
  for (const dam of allDams) {
    const key = coordKey(dam.latitude, dam.longitude);
    const res = weatherByCoordKey.get(key);
    if (!res) continue;
    damWeatherMap.set(dam.id, {
      damId: dam.id,
      today: buildDayForecast(res.daily, 0),
      tomorrow: buildDayForecast(res.daily, 1),
    });
  }

  // Group dams by prefecture and write JSON files
  const byPrefecture = new Map<string, DamWeather[]>();
  for (const dam of allDams) {
    const weather = damWeatherMap.get(dam.id);
    if (!weather) continue;
    const list = byPrefecture.get(dam.prefectureSlug) ?? [];
    list.push(weather);
    byPrefecture.set(dam.prefectureSlug, list);
  }

  const updatedAt = new Date().toISOString();
  let successCount = 0;

  for (const [prefectureSlug, dams] of byPrefecture) {
    const distribution: Record<WeatherCategory, number> = {
      sunny: 0,
      cloudy: 0,
      rain: 0,
      snow: 0,
      default: 0,
    };
    for (const dam of dams) {
      distribution[getWeatherCategory(dam.today.weatherCode)]++;
    }
    const prefWeather: PrefectureWeather = { prefectureSlug, updatedAt, distribution, dams };
    const outputPath = path.join(OUTPUT_DIR, `${prefectureSlug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(prefWeather, null, 2), "utf-8");
    successCount++;
    console.log(`  ${dams.length} dams saved to ${prefectureSlug}.json`);
  }

  if (failedCoords.length > 0) {
    const payload: FailedCoordsFile = { savedAt: new Date().toISOString(), failedCoords };
    fs.writeFileSync(FAILED_JSON_PATH, JSON.stringify(payload, null, 2), "utf-8");
    console.warn(`Saved to _failed.json. Re-run with --retry to attempt again.`);
  } else if (fs.existsSync(FAILED_JSON_PATH)) {
    fs.unlinkSync(FAILED_JSON_PATH);
  }

  console.log("\n=== Summary ===");
  console.log(`Total dams: ${allDams.length}`);
  console.log(`Unique coordinates: ${allCoordGroups.length}`);
  console.log(`Coordinates fetched: ${weatherByCoordKey.size}`);
  console.log(`Dams processed: ${damWeatherMap.size}/${allDams.length}`);
  console.log(`Prefectures written: ${successCount}`);
  if (failedCoords.length > 0) {
    console.log(`Failed coordinates: ${failedCoords.length}`);
  }
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
