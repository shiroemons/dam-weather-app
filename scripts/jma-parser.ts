/**
 * jma-parser.ts
 *
 * Parses JMA (Japan Meteorological Agency) forecast API responses and extracts
 * weather data into the app's AreaWeather type format.
 *
 * The API endpoint is:
 *   https://www.jma.go.jp/bosai/forecast/data/forecast/{officeCode}.json
 *
 * Usage: import { parseJmaForecast } from "./jma-parser.ts"
 */

// ---------------------------------------------------------------------------
// Types (local – mirrors src/types/weather.ts)
// ---------------------------------------------------------------------------

interface DayForecast {
  date: string;
  weatherCode: string;
  weather: string;
  tempMax: string | null;
  tempMin: string | null;
  precipProbability: string | null;
}

interface WeeklyForecast {
  date: string;
  weatherCode: string;
  tempMax: string;
  tempMin: string;
  reliability: string;
}

interface AreaWeather {
  areaCode: string;
  areaName: string;
  today: DayForecast;
  tomorrow: DayForecast;
  weekly: WeeklyForecast[];
  publishedAt: string;
}

// ---------------------------------------------------------------------------
// Internal JMA response shape (loosely typed – external API)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JmaAny = any;

interface JmaArea {
  area: { code: string; name: string };
  weatherCodes?: string[];
  weathers?: string[];
  pops?: string[];
  temps?: string[];
  tempsMin?: string[];
  tempsMax?: string[];
  reliabilities?: string[];
}

interface JmaTimeSeries {
  timeDefines: string[];
  areas: JmaArea[];
}

interface JmaForecast {
  reportDatetime: string;
  timeSeries: JmaTimeSeries[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateString(isoString: string): string {
  return isoString.slice(0, 10);
}

/**
 * Returns the hour portion of an ISO datetime string (e.g. "09" from "2024-06-01T09:00:00+09:00").
 */
function toHourString(isoString: string): string {
  // Format: YYYY-MM-DDTHH:MM:SS+ZZ:ZZ
  return isoString.slice(11, 13);
}

/**
 * Converts an empty string to null, otherwise returns the value as-is.
 */
function emptyToNull(value: string | undefined): string | null {
  if (value === undefined || value === "") return null;
  return value;
}

/**
 * Groups precipitation probability values by date and returns the maximum
 * non-empty value per date. Returns null if all values for a date are empty.
 */
function maxPopByDate(
  timeDefines: string[],
  pops: string[],
  targetDate: string
): string | null {
  let max: number | null = null;

  for (let i = 0; i < timeDefines.length; i++) {
    if (toDateString(timeDefines[i]) !== targetDate) continue;
    const pop = pops[i];
    if (pop === "" || pop === undefined) continue;
    const val = parseInt(pop, 10);
    if (!isNaN(val) && (max === null || val > max)) {
      max = val;
    }
  }

  return max !== null ? String(max) : null;
}

// ---------------------------------------------------------------------------
// Temperature extraction
// ---------------------------------------------------------------------------

interface DayTemps {
  tempMax: string | null;
  tempMin: string | null;
}

/**
 * Extracts today's and tomorrow's max/min temps from the temperature timeSeries.
 * timeDefines with hour "09" are max temps; hour "00" are min temps.
 */
function extractTemps(
  tempTimeSeries: JmaTimeSeries | undefined,
  areaIndex: number,
  todayDate: string,
  tomorrowDate: string
): { today: DayTemps; tomorrow: DayTemps } {
  const noData: DayTemps = { tempMax: null, tempMin: null };

  if (!tempTimeSeries) {
    return { today: noData, tomorrow: noData };
  }

  const tempArea = tempTimeSeries.areas[areaIndex];
  if (!tempArea) {
    return { today: noData, tomorrow: noData };
  }

  const { timeDefines } = tempTimeSeries;
  const temps = tempArea.temps ?? [];

  const today: DayTemps = { tempMax: null, tempMin: null };
  const tomorrow: DayTemps = { tempMax: null, tempMin: null };

  for (let i = 0; i < timeDefines.length; i++) {
    const date = toDateString(timeDefines[i]);
    const hour = toHourString(timeDefines[i]);
    const value = emptyToNull(temps[i]);

    if (date === todayDate) {
      if (hour === "09") today.tempMax = value;
      if (hour === "00") today.tempMin = value;
    } else if (date === tomorrowDate) {
      if (hour === "00") tomorrow.tempMin = value;
      if (hour === "09") tomorrow.tempMax = value;
    }
  }

  return { today, tomorrow };
}

// ---------------------------------------------------------------------------
// Weekly forecast extraction
// ---------------------------------------------------------------------------

function extractWeekly(
  weeklyForecast: JmaForecast | undefined,
  areaCode: string,
  weatherAreaIndex: number
): WeeklyForecast[] {
  if (!weeklyForecast) return [];

  const weeklyWeatherSeries = weeklyForecast.timeSeries[0];
  const weeklyTempSeries = weeklyForecast.timeSeries[1];

  if (!weeklyWeatherSeries) return [];

  const weatherArea = weeklyWeatherSeries.areas.find(
    (a) => a.area.code === areaCode
  );
  if (!weatherArea) return [];

  const tempArea = weeklyTempSeries?.areas[weatherAreaIndex];
  const timeDefines = weeklyWeatherSeries.timeDefines;

  const weekly: WeeklyForecast[] = [];

  // Skip index 0 and 1 (today and tomorrow covered by short-term forecast)
  for (let i = 2; i < timeDefines.length; i++) {
    weekly.push({
      date: toDateString(timeDefines[i]),
      weatherCode: weatherArea.weatherCodes?.[i] ?? "",
      tempMax: tempArea?.tempsMax?.[i] ?? "",
      tempMin: tempArea?.tempsMin?.[i] ?? "",
      reliability: weatherArea.reliabilities?.[i] ?? "",
    });
  }

  return weekly;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a JMA forecast API response array and returns structured weather data
 * for each class10s area in the short-term forecast.
 *
 * @param data - The raw JSON array from the JMA forecast API
 * @returns An array of AreaWeather objects, one per class10s forecast area
 */
export function parseJmaForecast(data: JmaAny[]): AreaWeather[] {
  const shortTerm = data[0] as JmaForecast | undefined;
  const weekly = data[1] as JmaForecast | undefined;

  if (!shortTerm) return [];

  const weatherSeries = shortTerm.timeSeries[0];
  const popSeries = shortTerm.timeSeries[1];
  const tempSeries = shortTerm.timeSeries[2];

  if (!weatherSeries) return [];

  const publishedAt = shortTerm.reportDatetime ?? "";
  const todayDate = toDateString(weatherSeries.timeDefines[0] ?? "");
  const tomorrowDate = toDateString(weatherSeries.timeDefines[1] ?? "");

  const results: AreaWeather[] = [];

  for (let i = 0; i < weatherSeries.areas.length; i++) {
    const weatherArea = weatherSeries.areas[i];
    const areaCode = weatherArea.area.code;
    const areaName = weatherArea.area.name;

    // Precipitation probability: find matching area by code, take daily max
    const popArea = popSeries?.areas.find((a) => a.area.code === areaCode);
    const todayPop = popArea
      ? maxPopByDate(popSeries!.timeDefines, popArea.pops ?? [], todayDate)
      : null;
    const tomorrowPop = popArea
      ? maxPopByDate(popSeries!.timeDefines, popArea.pops ?? [], tomorrowDate)
      : null;

    // Temperature: map by index (station areas may be fewer than weather areas)
    const { today: todayTemps, tomorrow: tomorrowTemps } = extractTemps(
      tempSeries,
      i,
      todayDate,
      tomorrowDate
    );

    const today: DayForecast = {
      date: todayDate,
      weatherCode: weatherArea.weatherCodes?.[0] ?? "",
      weather: weatherArea.weathers?.[0] ?? "",
      tempMax: todayTemps.tempMax,
      tempMin: todayTemps.tempMin,
      precipProbability: todayPop,
    };

    const tomorrow: DayForecast = {
      date: tomorrowDate,
      weatherCode: weatherArea.weatherCodes?.[1] ?? "",
      weather: weatherArea.weathers?.[1] ?? "",
      tempMax: tomorrowTemps.tempMax,
      tempMin: tomorrowTemps.tempMin,
      precipProbability: tomorrowPop,
    };

    const weeklyForecasts = extractWeekly(weekly, areaCode, i);

    results.push({
      areaCode,
      areaName,
      today,
      tomorrow,
      weekly: weeklyForecasts,
      publishedAt,
    });
  }

  return results;
}
