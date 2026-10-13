// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { fetchBatch, fetchLoop, main, retryAfterMs } from "./fetch-weather.ts";
import { validateWeatherData } from "./validate-weather.ts";

const now = new Date("2026-10-06T00:00:00Z");
const group = { lat: 35, lng: 135, damIds: ["a"] };
function forecast() {
  return {
    daily: {
      time: ["2026-10-06", "2026-10-07"],
      weather_code: [0, 3],
      temperature_2m_max: [24, null],
      temperature_2m_min: [16, null],
      precipitation_sum: [0, null],
      precipitation_probability_max: [10, null],
    },
  };
}
function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}
const fetchMock = vi.fn<typeof fetch>();
let temp: string;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  temp = fs.mkdtempSync(path.join(os.tmpdir(), "weather-fetch-"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fs.rmSync(temp, { recursive: true, force: true });
});
function fixture(
  dams = [
    { id: "a", latitude: 35, longitude: 135, prefectureSlug: "kyoto" },
    { id: "b", latitude: 35.001, longitude: 135.001, prefectureSlug: "osaka" },
  ],
) {
  const damsJsonPath = path.join(temp, "dams.json");
  fs.writeFileSync(damsJsonPath, JSON.stringify(dams));
  return { dams, damsJsonPath, outputDir: path.join(temp, "weather"), args: [] };
}

describe("rate-limit-aware bounded recovery", () => {
  it("recovers timeout -> 429 -> success, waiting a minute before each retry", async () => {
    fetchMock
      .mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"))
      .mockResolvedValueOnce(response({ reason: "Minutely API request limit exceeded" }, 429))
      .mockResolvedValueOnce(response(forecast()));
    const result = fetchBatch([group]);
    await vi.advanceTimersByTimeAsync(60_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(60_999);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("honors numeric and HTTP-date Retry-After with safe invalid fallbacks", () => {
    expect(retryAfterMs("90", now.getTime())).toBe(90_000);
    expect(retryAfterMs("Tue, 06 Oct 2026 00:01:30 GMT", now.getTime())).toBe(90_000);
    for (const value of [null, "broken", "0", "-1", "Tue, 06 Oct 2026 00:00:00 GMT"]) {
      expect(retryAfterMs(value, now.getTime())).toBe(61_000);
    }
  });

  it.each(["Daily", "Hourly", "Monthly"])(
    "stops %s quota errors without retrying or advancing batches",
    async (quota) => {
      fetchMock.mockImplementation(async () =>
        response({ reason: `${quota} API request limit exceeded` }, 429),
      );
      const groups = Array.from({ length: 501 }, (_, i) => ({
        lat: i,
        lng: 135,
        damIds: [`${i}`],
      }));
      const results = new Map();
      const { failedCoords } = await fetchLoop(groups, results);
      expect(failedCoords).toHaveLength(501);
      expect(results.size).toBe(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("does not shorten a Retry-After longer than the job's retry budget", async () => {
    fetchMock.mockImplementation(async () =>
      response({ reason: "limit" }, 429, { "Retry-After": "3600" }),
    );
    await expect(fetchBatch([group])).rejects.toThrow("HTTP 429");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after three 429s and records all unattempted coordinates", async () => {
    fetchMock.mockImplementation(async () =>
      response({ reason: "Minutely API request limit exceeded" }, 429),
    );
    const groups = Array.from({ length: 501 }, (_, i) => ({ lat: i, lng: 135, damIds: [`${i}`] }));
    const result = fetchLoop(groups, new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toHaveLength(501);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries truncated responses rather than counting them as complete", async () => {
    fetchMock
      .mockResolvedValueOnce(response([forecast()]))
      .mockResolvedValueOnce(response([forecast(), forecast()]));
    const result = fetchBatch([group, { ...group, lat: 36 }]);
    await vi.runAllTimersAsync();
    await expect(result).resolves.toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid weather codes instead of producing sunny defaults", async () => {
    const invalid = forecast();
    invalid.daily.weather_code = [];
    fetchMock.mockImplementation(async () => response(invalid));
    const assertion = expect(fetchBatch([group])).rejects.toThrow(
      "Incomplete/invalid API response",
    );
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("one-shot deferred transient recovery", () => {
  function groups(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      lat: 30 + i / 100,
      lng: 135,
      damIds: [`${i}`],
    }));
  }

  function succeed(_url: unknown, init?: RequestInit) {
    const { latitude } = JSON.parse(init!.body as string);
    return Promise.resolve(response(latitude.map(() => forecast())));
  }

  it.each([408, 503])("recovers exhausted HTTP %s failures once", async (status) => {
    fetchMock
      .mockResolvedValueOnce(response({}, status))
      .mockResolvedValueOnce(response({}, status))
      .mockResolvedValueOnce(response({}, status))
      .mockImplementation(succeed);
    const results = new Map();
    const result = fetchLoop([group], results);
    await vi.advanceTimersByTimeAsync(182_999);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    expect((await result).failedCoords).toHaveLength(0);
    expect(results.size).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("does not recurse when the final recovery request also times out", async () => {
    fetchMock.mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    const result = fetchLoop([group], new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toEqual([group]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("never retries a 429 during the final recovery request", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(response({ reason: "Minutely limit" }, 429, { "Retry-After": "90" }));
    const result = fetchLoop([group], new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toEqual([group]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(Date.now() - now.getTime()).toBe(183_000);
  });

  it.each([400, 429])("suppresses pending recovery after terminal HTTP %s", async (status) => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(response({ reason: "Daily limit" }, status));
    const result = fetchLoop(groups(501), new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toHaveLength(501);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("keeps the circuit breaker and records unattempted batches", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const result = fetchLoop(groups(1501), new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toHaveLength(1501);
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it("skips recovery when transient failures exceed one batch", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const result = fetchLoop(groups(501), new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toHaveLength(501);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("does not add a recovery request for malformed successful responses", async () => {
    fetchMock.mockImplementation(async () => response({ daily: {} }));
    const result = fetchLoop([group], new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toEqual([group]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each(["TimeoutError", "AbortError"])(
    "recovers exhausted response-body %s failures",
    async (name) => {
      let calls = 0;
      fetchMock.mockImplementation(async () => {
        const res = response(forecast());
        if (++calls <= 3)
          vi.spyOn(res, "json").mockRejectedValue(new DOMException("body failed", name));
        return res;
      });
      const result = fetchLoop([group], new Map());
      await vi.runAllTimersAsync();
      expect((await result).failedCoords).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    },
  );

  it("does not recover exhausted JSON syntax errors", async () => {
    fetchMock.mockImplementation(async () => new Response("{broken json"));
    const result = fetchLoop([group], new Map());
    await vi.runAllTimersAsync();
    expect((await result).failedCoords).toEqual([group]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("fails publication and retains missing coordinates after recovery is exhausted", async () => {
    const options = fixture();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const assertion = expect(main(options)).rejects.toThrow("Weather update incomplete");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(
      JSON.parse(fs.readFileSync(path.join(options.outputDir, "_failed.json"), "utf8"))
        .failedCoords,
    ).toEqual([{ ...group, damIds: ["a", "b"] }]);
    expect(() => validateWeatherData(options.dams, options.outputDir, now)).toThrow();
  });

  it("recovers the failed first 500 coordinates after the other 2,099 without refetching successes", async () => {
    const dams = JSON.parse(
      fs.readFileSync(new URL("../src/data/dams.json", import.meta.url), "utf8"),
    );
    const options = fixture(dams);
    const requests: { latitude: number[]; longitude: number[]; at: number }[] = [];
    fetchMock.mockImplementation(async (_url, init) => {
      const body = JSON.parse(init!.body as string);
      requests.push({ ...body, at: Date.now() });
      if (requests.length <= 3)
        throw new TypeError("fetch failed", { cause: new Error("connect timeout") });
      return response(
        body.latitude.map((lat: number) => {
          const data = forecast();
          data.daily.temperature_2m_max[0] = lat;
          return data;
        }),
      );
    });
    const result = main(options);
    await vi.runAllTimersAsync();
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(requests.map((r) => r.latitude.length)).toEqual([
      500, 500, 500, 500, 500, 500, 500, 99, 500,
    ]);
    expect(requests[8].latitude).toEqual(requests[0].latitude);
    expect(requests[8].longitude).toEqual(requests[0].longitude);
    for (let i = 1; i < requests.length; i++) {
      expect(requests[i].at - requests[i - 1].at).toBeGreaterThanOrEqual(61_000);
    }
    expect(fs.readdirSync(options.outputDir)).toHaveLength(47);
    expect(fs.existsSync(path.join(options.outputDir, "_failed.json"))).toBe(false);
    expect(() => validateWeatherData(options.dams, options.outputDir)).not.toThrow();
    for (const dam of options.dams) {
      const saved = JSON.parse(
        fs.readFileSync(path.join(options.outputDir, `${dam.prefectureSlug}.json`), "utf8"),
      );
      expect(
        saved.dams.find((entry: { damId: string }) => entry.damId === dam.id).today.tempMax,
      ).toBe(Math.round(dam.latitude * 100) / 100);
    }
  });
});

describe("publication completeness", () => {
  it("writes every dam, including shared coordinates, and validates full coverage", async () => {
    const options = fixture();
    fetchMock.mockResolvedValueOnce(response(forecast()));
    await main(options);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(() => validateWeatherData(options.dams, options.outputDir, now)).not.toThrow();
    expect(fs.existsSync(path.join(options.outputDir, "_failed.json"))).toBe(false);
  });

  it("covers all 2,749 source dams and 47 prefectures with bounded batches", async () => {
    const dams = JSON.parse(
      fs.readFileSync(new URL("../src/data/dams.json", import.meta.url), "utf8"),
    );
    const options = fixture(dams);
    fetchMock.mockImplementation(async (_url, init) => {
      const { latitude } = JSON.parse(init!.body as string);
      expect(latitude.length).toBeLessThanOrEqual(500);
      return response(Array.from({ length: latitude.length }, forecast));
    });
    const result = main(options);
    await vi.runAllTimersAsync();
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(fs.readdirSync(options.outputDir)).toHaveLength(47);
    expect(() => validateWeatherData(options.dams, options.outputDir)).not.toThrow();
  });

  it("fails a partially fetched run and retains missing coordinates for recovery", async () => {
    const dams = Array.from({ length: 501 }, (_, i) => ({
      id: `${i}`,
      latitude: 30 + i / 100,
      longitude: 135,
      prefectureSlug: i < 500 ? "kyoto" : "osaka",
    }));
    const options = fixture(dams);
    fetchMock
      .mockResolvedValueOnce(response(Array.from({ length: 500 }, forecast)))
      .mockImplementation(async () =>
        response({ reason: "Minutely API request limit exceeded" }, 429),
      );
    const assertion = expect(main(options)).rejects.toThrow("Weather update incomplete");
    await vi.runAllTimersAsync();
    await assertion;
    const failurePath = path.join(options.outputDir, "_failed.json");
    const failures = JSON.parse(fs.readFileSync(failurePath, "utf8"));
    expect(failures.failedCoords).toHaveLength(1);
    expect(() => validateWeatherData(options.dams, options.outputDir, now)).toThrow();
    fetchMock.mockResolvedValueOnce(response(forecast()));
    await main({ ...options, args: ["--retry"] });
    expect(fs.existsSync(failurePath)).toBe(false);
    expect(() => validateWeatherData(options.dams, options.outputDir, now)).not.toThrow();
  });

  it("fails retry mode when no failure marker exists but full data is absent", async () => {
    await expect(main({ ...fixture(), args: ["--retry"] })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails retry mode when coordinates still fail", async () => {
    const options = fixture();
    fs.mkdirSync(options.outputDir);
    fs.writeFileSync(
      path.join(options.outputDir, "_failed.json"),
      JSON.stringify({ savedAt: now.toISOString(), failedCoords: [group] }),
    );
    fetchMock.mockImplementation(async () =>
      response({ reason: "Daily API request limit exceeded" }, 429),
    );
    await expect(main({ ...options, args: ["--retry"] })).rejects.toThrow("still failed");
    expect(
      JSON.parse(fs.readFileSync(path.join(options.outputDir, "_failed.json"), "utf8"))
        .failedCoords,
    ).toHaveLength(1);
  });

  it("rejects invalid --limit values", async () => {
    await expect(main({ ...fixture(), args: ["--limit", "bogus"] })).rejects.toThrow(
      "positive integer",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
