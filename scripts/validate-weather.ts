/** Fail closed before publishing an incomplete or stale weather snapshot. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface ExpectedDam {
  id: string;
  prefectureSlug: string;
}

const NULLABLE_DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
] as const;
const NULLABLE_FORECAST_FIELDS = [
  "tempMax",
  "tempMin",
  "precipitationSum",
  "precipProbability",
] as const;
const CATEGORIES = ["sunny", "cloudy", "rain", "snow", "default"] as const;
type Category = (typeof CATEGORIES)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isWeatherCode(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

/** The API and published forecasts use calendar dates in Japan, not UTC. */
export function getForecastDates(now = new Date()): [string, string] {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);
  return [today, tomorrow];
}

/** Require both daily values; missing/null weather codes must never become sunny. */
export function isValidDaily(daily: unknown, dates: [string, string]): boolean {
  if (!isRecord(daily)) return false;
  const time = daily.time;
  const codes = daily.weather_code;
  if (!Array.isArray(time) || time.length !== 2 || !Array.isArray(codes) || codes.length !== 2)
    return false;
  for (let index = 0; index < 2; index++) {
    if (time[index] !== dates[index] || !isWeatherCode(codes[index])) return false;
  }
  return NULLABLE_DAILY_FIELDS.every((field) => {
    const values = daily[field];
    return (
      Array.isArray(values) &&
      values.length === 2 &&
      isNullableNumber(values[0]) &&
      isNullableNumber(values[1])
    );
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Weather validation failed: ${message}`);
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Weather validation failed: cannot read ${path.basename(filePath)}: ${detail}`);
  }
}

function category(code: number): Category {
  if (code <= 1) return "sunny";
  if (code <= 3 || code === 45 || code === 48) return "cloudy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99))
    return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  return "default";
}

function validateForecast(value: unknown, date: string, label: string): number {
  assert(isRecord(value), `${label} is missing`);
  assert(value.date === date, `${label} must have date ${date}`);
  assert(isWeatherCode(value.weatherCode), `${label} must have a numeric weatherCode`);
  assert(
    typeof value.weather === "string" && value.weather.length > 0,
    `${label} has no weather label`,
  );
  for (const field of NULLABLE_FORECAST_FIELDS) {
    assert(isNullableNumber(value[field]), `${label}.${field} must be a number or null`);
  }
  return value.weatherCode;
}

export function validateWeatherData(
  dams: ExpectedDam[],
  outputDir: string,
  now = new Date(),
): void {
  const dates = getForecastDates(now);
  assert(Array.isArray(dams) && dams.length > 0, "expected dam list is empty or invalid");
  const expected = new Map<string, string>();
  const prefectures = new Set<string>();
  for (const dam of dams) {
    assert(
      isRecord(dam) &&
        typeof dam.id === "string" &&
        dam.id.length > 0 &&
        typeof dam.prefectureSlug === "string" &&
        /^[a-z0-9-]+$/.test(dam.prefectureSlug),
      "invalid entry in expected dam list",
    );
    assert(!expected.has(dam.id), `duplicate expected dam ID ${dam.id}`);
    expected.set(dam.id, dam.prefectureSlug);
    prefectures.add(dam.prefectureSlug);
  }

  assert(fs.existsSync(outputDir), `weather directory does not exist: ${outputDir}`);
  const files = fs.readdirSync(outputDir);
  if (files.includes("_failed.json")) {
    const failed = readJson(path.join(outputDir, "_failed.json"));
    assert(
      isRecord(failed) && Array.isArray(failed.failedCoords) && failed.failedCoords.length === 0,
      "_failed.json contains unresolved failures or is malformed",
    );
  }
  for (const file of files) {
    if (file === "_failed.json" || !file.endsWith(".json")) continue;
    assert(prefectures.has(file.slice(0, -5)), `unexpected prefecture file ${file}`);
  }

  const seen = new Set<string>();
  for (const prefecture of prefectures) {
    const filename = `${prefecture}.json`;
    assert(files.includes(filename), `missing prefecture file ${filename}`);
    const payload = readJson(path.join(outputDir, filename));
    assert(isRecord(payload), `${filename} must contain an object`);
    assert(payload.prefectureSlug === prefecture, `${filename} has incorrect prefectureSlug`);
    assert(typeof payload.updatedAt === "string", `${filename} is missing updatedAt`);
    const updatedAt = new Date(payload.updatedAt);
    assert(Number.isFinite(updatedAt.getTime()), `${filename} has invalid updatedAt`);
    assert(getForecastDates(updatedAt)[0] === dates[0], `${filename} has stale updatedAt`);
    assert(updatedAt.getTime() <= now.getTime() + 5 * 60_000, `${filename} has future updatedAt`);
    assert(Array.isArray(payload.dams), `${filename} is missing its dams array`);
    const counts: Record<Category, number> = { sunny: 0, cloudy: 0, rain: 0, snow: 0, default: 0 };

    for (const dam of payload.dams) {
      assert(
        isRecord(dam) && typeof dam.damId === "string",
        `${filename} has an invalid dam entry`,
      );
      assert(expected.has(dam.damId), `${filename} has unexpected dam ID ${dam.damId}`);
      assert(
        expected.get(dam.damId) === prefecture,
        `dam ${dam.damId} is in the wrong prefecture file ${filename}`,
      );
      assert(!seen.has(dam.damId), `duplicate dam ID ${dam.damId}`);
      seen.add(dam.damId);
      const code = validateForecast(dam.today, dates[0], `${dam.damId}.today`);
      validateForecast(dam.tomorrow, dates[1], `${dam.damId}.tomorrow`);
      counts[category(code)]++;
    }

    // Older snapshots may omit this optional frontend optimization. If present,
    // it must describe the actual full set of dam forecasts, not a partial run.
    if (payload.distribution !== undefined) {
      const distribution = payload.distribution;
      assert(isRecord(distribution), `${filename} has invalid distribution`);
      assert(
        Object.keys(distribution).length === CATEGORIES.length,
        `${filename} has invalid distribution categories`,
      );
      for (const key of CATEGORIES) {
        assert(distribution[key] === counts[key], `${filename} has incorrect ${key} distribution`);
      }
    }
  }
  const missing = [...expected.keys()].filter((id) => !seen.has(id));
  assert(
    missing.length === 0,
    `missing ${missing.length} dam(s): ${missing.slice(0, 10).join(", ")}`,
  );
}

const invokedPath = process.argv[1];
if (invokedPath && path.resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  try {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const dams = readJson(path.join(root, "src", "data", "dams.json")) as ExpectedDam[];
    validateWeatherData(dams, path.join(root, "public", "weather"));
    console.log(`Weather validation passed: ${dams.length} dams have complete, current forecasts.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
