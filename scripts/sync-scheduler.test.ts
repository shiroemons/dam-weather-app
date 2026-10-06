// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { syncScheduler } from "./sync-scheduler";

const ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
const TOKEN = "test-token-never-print-me";
const ENV = { CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID, CLOUDFLARE_API_TOKEN: TOKEN };
const TARGET = "0 */8 * * *";
const PREVIOUS = "0 */3 * * *";
const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/dam-weather-scheduler/schedules`;
const CONFIG = `name = "dam-weather-scheduler"
main = "src/index.ts"
[triggers]
# UTC 00:00 / 08:00 / 16:00
crons = ["${TARGET}"]
[vars]
GITHUB_WORKFLOW_ID = "update-weather.yml"
`;

function payload(crons = [TARGET]): unknown {
  return { success: true, result: { schedules: crons.map((cron) => ({ cron })) } };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function setup() {
  const fetchImpl = vi.fn<typeof fetch>();
  const options = { env: ENV, fetchImpl, readConfig: () => CONFIG };
  return { fetchImpl, options };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("syncScheduler", () => {
  it("updates the known previous cron and verifies a fresh GET", async () => {
    const { fetchImpl, options } = setup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])))
      .mockResolvedValueOnce(jsonResponse(payload()))
      .mockResolvedValueOnce(jsonResponse(payload()));

    await expect(syncScheduler(options)).resolves.toBe("updated");
    expect(fetchImpl.mock.calls.map(([, init]) => init?.method)).toEqual(["GET", "PUT", "GET"]);
    for (const [url, init] of fetchImpl.mock.calls) {
      expect(url).toBe(ENDPOINT);
      expect(init).toMatchObject({
        redirect: "error",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(fetchImpl.mock.calls[0][1]?.body).toBeUndefined();
    expect(JSON.parse(fetchImpl.mock.calls[1][1]?.body as string)).toEqual([{ cron: TARGET }]);
    expect(fetchImpl.mock.calls[2][1]?.body).toBeUndefined();
  });

  it("is read-only when the sole cron already matches, including the real local config", async () => {
    const { fetchImpl } = setup();
    fetchImpl.mockResolvedValueOnce(jsonResponse(payload()));
    await expect(syncScheduler({ env: ENV, fetchImpl })).resolves.toBe("unchanged");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe("GET");
  });

  it.each([
    {},
    { CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
    { CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID, CLOUDFLARE_API_TOKEN: "  " },
    { CLOUDFLARE_ACCOUNT_ID: "invalid", CLOUDFLARE_API_TOKEN: TOKEN },
    { CLOUDFLARE_ACCOUNT_ID: `${ACCOUNT_ID}/../other`, CLOUDFLARE_API_TOKEN: TOKEN },
  ])("rejects missing or invalid credentials before any request (%j)", async (env) => {
    const { fetchImpl, options } = setup();
    await expect(syncScheduler({ ...options, env })).rejects.toThrow(/CLOUDFLARE_/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    CONFIG.replace('name = "dam-weather-scheduler"', 'name = "other-worker"'),
    CONFIG.replace(TARGET, PREVIOUS),
    CONFIG.replace(`crons = ["${TARGET}"]`, `crons = ["${TARGET}", "${PREVIOUS}"]`),
    CONFIG.replace("[triggers]", "[unrelated]"),
    CONFIG.replace("[triggers]", "[triggers]\n[triggers]"),
    CONFIG.replace(`crons = ["${TARGET}"]`, "crons = broken"),
    CONFIG.replace(`crons = ["${TARGET}"]`, "crons = []"),
    CONFIG.replace("main =", 'name = "other-worker"\nmain ='),
    `description = """\n${CONFIG}\n"""`,
  ])("rejects local configuration drift before any request", async (config) => {
    const { fetchImpl, options } = setup();
    await expect(syncScheduler({ ...options, readConfig: () => config })).rejects.toThrow(
      /Scheduler sync failed/,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sanitizes local configuration read errors", async () => {
    const { fetchImpl, options } = setup();
    await expect(
      syncScheduler({
        ...options,
        readConfig: () => {
          throw new Error(TOKEN);
        },
      }),
    ).rejects.toThrow("cannot read local scheduler configuration");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([[], ["0 * * * *"], [PREVIOUS, TARGET], [TARGET, TARGET], [PREVIOUS, PREVIOUS]])(
    "refuses unexpected or multiple remote crons (%j)",
    async (...crons) => {
      const { fetchImpl, options } = setup();
      fetchImpl.mockResolvedValueOnce(jsonResponse(payload(crons)));
      await expect(syncScheduler(options)).rejects.toThrow("unexpected remote cron configuration");
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["GET", "PUT", "readback"])(
    "stops on HTTP 403 at %s without leaking its body",
    async (stage) => {
      const { fetchImpl, options } = setup();
      if (stage !== "GET") fetchImpl.mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])));
      if (stage === "readback") fetchImpl.mockResolvedValueOnce(jsonResponse(payload()));
      fetchImpl.mockResolvedValueOnce(jsonResponse({ errors: [{ message: TOKEN }] }, 403));
      await expect(syncScheduler(options)).rejects.toThrow(`returned HTTP 403`);
      expect(fetchImpl).toHaveBeenCalledTimes(stage === "GET" ? 1 : stage === "PUT" ? 2 : 3);
    },
  );

  it.each(["GET", "PUT", "readback"])(
    "stops when HTTP 200 reports success:false at %s",
    async (stage) => {
      const { fetchImpl, options } = setup();
      if (stage !== "GET") fetchImpl.mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])));
      if (stage === "readback") fetchImpl.mockResolvedValueOnce(jsonResponse(payload()));
      fetchImpl.mockResolvedValueOnce(
        jsonResponse({ success: false, errors: [{ message: TOKEN }] }),
      );
      await expect(syncScheduler(options)).rejects.toThrow("did not report API success");
      expect(fetchImpl).toHaveBeenCalledTimes(stage === "GET" ? 1 : stage === "PUT" ? 2 : 3);
    },
  );

  it.each([
    null,
    [],
    { result: { schedules: [{ cron: TARGET }] } },
    { success: "true", result: { schedules: [{ cron: TARGET }] } },
    { success: true },
    { success: true, result: [] },
    { success: true, result: { schedules: null } },
    { success: true, result: { schedules: [{ cron: null }] } },
    { success: true, result: { schedules: [TARGET] } },
  ])("rejects malformed API payloads", async (body) => {
    const { fetchImpl, options } = setup();
    fetchImpl.mockResolvedValueOnce(jsonResponse(body));
    await expect(syncScheduler(options)).rejects.toThrow(/Scheduler sync failed/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid JSON without echoing its contents", async () => {
    const { fetchImpl, options } = setup();
    fetchImpl.mockResolvedValueOnce(new Response(TOKEN));
    await expect(syncScheduler(options)).rejects.toThrow("GET returned invalid JSON");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops on a mismatched PUT response without retrying the mutation", async () => {
    const { fetchImpl, options } = setup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])))
      .mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])));
    await expect(syncScheduler(options)).rejects.toThrow("PUT response does not match");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([[PREVIOUS], [], [TARGET, PREVIOUS]])(
    "fails if readback is not the sole target cron",
    async (...crons) => {
      const { fetchImpl, options } = setup();
      fetchImpl
        .mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])))
        .mockResolvedValueOnce(jsonResponse(payload()))
        .mockResolvedValueOnce(jsonResponse(payload(crons)));
      await expect(syncScheduler(options)).rejects.toThrow("readback does not match");
      expect(fetchImpl).toHaveBeenCalledTimes(3);
    },
  );

  it("uses a 20-second timeout and never retries an ambiguous PUT failure", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const { fetchImpl, options } = setup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse(payload([PREVIOUS])))
      .mockRejectedValueOnce(new Error(`Request failed: Authorization: Bearer ${TOKEN}`));
    await expect(syncScheduler(options)).rejects.toThrow(
      "PUT request failed or timed out; no automatic retry was attempted",
    );
    expect(timeout.mock.calls).toEqual([[20_000], [20_000]]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("never logs credentials, account IDs, or arbitrary error details", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, options } = setup();
    fetchImpl.mockRejectedValueOnce(new Error(`${TOKEN} ${ACCOUNT_ID}`));
    const error: unknown = await syncScheduler(options).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain(TOKEN);
    expect(String(error)).not.toContain(ACCOUNT_ID);
    expect(log).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
  });
});
