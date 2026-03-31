/**
 * fetch-weather.ts
 *
 * Fetches weather forecast data for all dams from Open-Meteo API
 * and saves them as prefecture-grouped JSON files under public/weather/.
 *
 * Usage: npx tsx scripts/fetch-weather.ts
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
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_SIZE = 1000;
const MAX_RETRIES = 3;
const BATCH_DELAY_MS = 1000;

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

// ---------------------------------------------------------------------------
// Open-Meteo fetch with retry
// ---------------------------------------------------------------------------

async function fetchBatch(dams: DamEntry[], attempt = 1): Promise<OpenMeteoResponse[]> {
  const latitudes = dams.map((d) => d.latitude).join(",");
  const longitudes = dams.map((d) => d.longitude).join(",");

  const params = new URLSearchParams({
    latitude: latitudes,
    longitude: longitudes,
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    timezone: "Asia/Tokyo",
    forecast_days: "2",
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!res.ok) {
    const message = `HTTP ${res.status} ${res.statusText}`;
    if (attempt < MAX_RETRIES) {
      console.warn(`  Retry ${attempt}/${MAX_RETRIES - 1}: ${message}`);
      await sleep(BATCH_DELAY_MS * attempt);
      return fetchBatch(dams, attempt + 1);
    }
    throw new Error(message);
  }

  const data = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[];
  return Array.isArray(data) ? data : [data];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allDams = JSON.parse(fs.readFileSync(DAMS_JSON_PATH, "utf-8")) as DamEntry[];

  console.log(`Loaded ${allDams.length} dams from dams.json`);

  const damWeatherMap = new Map<string, DamWeather>();
  let batchIndex = 0;

  for (let i = 0; i < allDams.length; i += BATCH_SIZE) {
    const batch = allDams.slice(i, i + BATCH_SIZE);
    batchIndex++;
    console.log(
      `\nBatch ${batchIndex}: fetching ${batch.length} dams (index ${i}–${i + batch.length - 1})...`,
    );

    let responses: OpenMeteoResponse[];
    try {
      responses = await fetchBatch(batch);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Batch ${batchIndex} failed: ${message}`);
      if (i + BATCH_SIZE < allDams.length) {
        await sleep(BATCH_DELAY_MS);
      }
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const dam = batch[j];
      const res = responses[j];
      if (!dam || !res) continue;

      damWeatherMap.set(dam.id, {
        damId: dam.id,
        today: buildDayForecast(res.daily, 0),
        tomorrow: buildDayForecast(res.daily, 1),
      });
    }

    console.log(`  ✓ ${responses.length} responses processed`);

    if (i + BATCH_SIZE < allDams.length) {
      await sleep(BATCH_DELAY_MS);
    }
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
    const prefWeather: PrefectureWeather = { prefectureSlug, updatedAt, dams };
    const outputPath = path.join(OUTPUT_DIR, `${prefectureSlug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(prefWeather, null, 2), "utf-8");
    successCount++;
    console.log(`  ✓ ${dams.length} dams saved to ${prefectureSlug}.json`);
  }

  console.log("\n=== Summary ===");
  console.log(`Prefectures written: ${successCount}`);
  console.log(`Dams processed: ${damWeatherMap.size}/${allDams.length}`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
