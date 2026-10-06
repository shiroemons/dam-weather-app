// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { getForecastDates, isValidDaily, validateWeatherData } from "./validate-weather";

const NOW = new Date("2026-10-05T15:30:00.000Z"); // October 6 in Japan, October 5 in UTC.
const DATES: [string, string] = ["2026-10-06", "2026-10-07"];
const DAMS = [
  { id: "dam-1", prefectureSlug: "hokkaido" },
  { id: "dam-2", prefectureSlug: "hokkaido" },
  { id: "dam-3", prefectureSlug: "aomori" },
];

function forecast(date: string) {
  return {
    date,
    weatherCode: 61,
    weather: "弱い雨",
    tempMax: 18,
    tempMin: null,
    precipProbability: 70,
    precipitationSum: 2,
  };
}

function prefecture(slug: string, ids: string[]) {
  return {
    prefectureSlug: slug,
    updatedAt: NOW.toISOString(),
    distribution: { sunny: 0, cloudy: 0, rain: ids.length, snow: 0, default: 0 },
    dams: ids.map((damId) => ({ damId, today: forecast(DATES[0]), tomorrow: forecast(DATES[1]) })),
  };
}

function daily() {
  return {
    time: [...DATES],
    weather_code: [0, 61],
    temperature_2m_max: [20, null],
    temperature_2m_min: [null, 10],
    precipitation_sum: [0, 4],
    precipitation_probability_max: [null, 70],
  };
}

describe("forecast date and API validation", () => {
  it("uses Japan calendar dates on both sides of midnight, including year rollover", () => {
    expect(getForecastDates(NOW)).toEqual(DATES);
    expect(getForecastDates(new Date("2026-10-05T14:59:59Z"))).toEqual([
      "2026-10-05",
      "2026-10-06",
    ]);
    expect(getForecastDates(new Date("2026-12-31T15:00:00Z"))).toEqual([
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("accepts explicit nullable measurements and a real zero weather code", () => {
    expect(isValidDaily(daily(), DATES)).toBe(true);
  });

  it.each([undefined, null, {}, [], { daily: daily() }])(
    "rejects malformed daily data %j",
    (value) => {
      expect(isValidDaily(value, DATES)).toBe(false);
    },
  );

  it.each([
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "precipitation_probability_max",
  ])("requires two explicit values for %s", (field) => {
    const input: Record<string, unknown> = daily();
    delete input[field];
    expect(isValidDaily(input, DATES)).toBe(false);
    input[field] = [10];
    expect(isValidDaily(input, DATES)).toBe(false);
    input[field] = [10, 20, 30];
    expect(isValidDaily(input, DATES)).toBe(false);
    input[field] = [10, undefined];
    expect(isValidDaily(input, DATES)).toBe(false);
  });

  it.each([null, undefined, "0", NaN, Infinity, -1, 1.5])(
    "rejects invalid weather code %j",
    (code) => {
      expect(isValidDaily({ ...daily(), weather_code: [0, code] }, DATES)).toBe(false);
    },
  );

  it("rejects stale, reversed, truncated, and extended date arrays", () => {
    for (const time of [
      ["2026-10-05", DATES[0]],
      [...DATES].reverse(),
      [DATES[0]],
      [...DATES, "2026-10-08"],
    ]) {
      expect(isValidDaily({ ...daily(), time }, DATES)).toBe(false);
    }
  });

  it("rejects nonnumeric measurements and sparse arrays", () => {
    expect(isValidDaily({ ...daily(), precipitation_sum: [0, "4"] }, DATES)).toBe(false);
    expect(isValidDaily({ ...daily(), temperature_2m_max: Array(2) }, DATES)).toBe(false);
  });
});

describe("weather publication completeness", () => {
  let outputDir: string;
  const write = (name: string, value: unknown) =>
    fs.writeFileSync(path.join(outputDir, name), JSON.stringify(value));
  const validate = () => validateWeatherData(DAMS, outputDir, NOW);

  beforeEach(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-weather-"));
    write("hokkaido.json", prefecture("hokkaido", ["dam-1", "dam-2"]));
    write("aomori.json", prefecture("aomori", ["dam-3"]));
  });

  afterEach(() => fs.rmSync(outputDir, { recursive: true, force: true }));

  it("accepts complete, current data with every expected dam exactly once", () => {
    expect(validate).not.toThrow();
  });

  it("rejects a missing prefecture even when other prefectures are complete", () => {
    fs.unlinkSync(path.join(outputDir, "aomori.json"));
    expect(validate).toThrow(/missing prefecture file aomori/);
  });

  it("rejects a missing dam even when every prefecture file exists", () => {
    write("hokkaido.json", prefecture("hokkaido", ["dam-1"]));
    expect(validate).toThrow(/missing 1 dam.*dam-2/);
  });

  it("rejects duplicate and unexpected dam IDs", () => {
    write("hokkaido.json", prefecture("hokkaido", ["dam-1", "dam-1", "dam-2"]));
    expect(validate).toThrow(/duplicate dam ID dam-1/);
    write("hokkaido.json", prefecture("hokkaido", ["dam-1", "dam-2", "unknown"]));
    expect(validate).toThrow(/unexpected dam ID unknown/);
  });

  it("rejects a dam assigned to another prefecture", () => {
    write("hokkaido.json", prefecture("hokkaido", ["dam-1", "dam-2", "dam-3"]));
    expect(validate).toThrow(/dam-3.*wrong prefecture/);
  });

  it("rejects unexpected prefecture files and incorrect prefecture metadata", () => {
    write("tokyo.json", prefecture("tokyo", []));
    expect(validate).toThrow(/unexpected prefecture file tokyo/);
    fs.unlinkSync(path.join(outputDir, "tokyo.json"));
    write("aomori.json", prefecture("tokyo", ["dam-3"]));
    expect(validate).toThrow(/incorrect prefectureSlug/);
  });

  it.each(["today", "tomorrow"] as const)(
    "rejects stale %s data even with a fresh timestamp",
    (day) => {
      const payload = prefecture("aomori", ["dam-3"]);
      payload.dams[0][day].date = "2026-10-05";
      write("aomori.json", payload);
      expect(validate).toThrow(/must have date/);
    },
  );

  it.each(["2026-10-05T14:59:59.999Z", "2026-10-05T16:30:00.000Z", "not-a-date"])(
    "rejects stale, future, or invalid updatedAt %s",
    (updatedAt) => {
      write("aomori.json", { ...prefecture("aomori", ["dam-3"]), updatedAt });
      expect(validate).toThrow(/updatedAt/);
    },
  );

  it.each([null, undefined, "0"])("rejects missing/nonnumeric weatherCode %j", (weatherCode) => {
    const payload = prefecture("aomori", ["dam-3"]);
    write("aomori.json", {
      ...payload,
      dams: [{ ...payload.dams[0], today: { ...forecast(DATES[0]), weatherCode } }],
    });
    expect(validate).toThrow(/numeric weatherCode/);
  });

  it.each(["tempMax", "tempMin", "precipProbability", "precipitationSum"])(
    "rejects an absent %s instead of silently treating it as null",
    (field) => {
      const today: Record<string, unknown> = forecast(DATES[0]);
      delete today[field];
      const payload = prefecture("aomori", ["dam-3"]);
      write("aomori.json", { ...payload, dams: [{ ...payload.dams[0], today }] });
      expect(validate).toThrow(/must be a number or null/);
    },
  );

  it("rejects unresolved and malformed failure markers but accepts an empty failure list", () => {
    write("_failed.json", { failedCoords: [{ lat: 35, lng: 139, damIds: ["dam-1"] }] });
    expect(validate).toThrow(/_failed.json/);
    write("_failed.json", {});
    expect(validate).toThrow(/_failed.json/);
    write("_failed.json", { savedAt: NOW.toISOString(), failedCoords: [] });
    expect(validate).not.toThrow();
  });

  it("rejects distribution counts that do not match the actual forecasts", () => {
    const payload = prefecture("aomori", ["dam-3"]);
    payload.distribution.rain = 0;
    payload.distribution.sunny = 1;
    write("aomori.json", payload);
    expect(validate).toThrow(/incorrect sunny distribution/);
  });

  it("rejects malformed JSON, empty source lists, and duplicate source IDs", () => {
    expect(() => validateWeatherData([], outputDir, NOW)).toThrow(/expected dam list/);
    expect(() => validateWeatherData([...DAMS, DAMS[0]], outputDir, NOW)).toThrow(
      /duplicate expected/,
    );
    fs.writeFileSync(path.join(outputDir, "aomori.json"), "{");
    expect(validate).toThrow(/cannot read aomori.json/);
  });
});
