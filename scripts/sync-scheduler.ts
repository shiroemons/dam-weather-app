/** Reconcile only the existing scheduler's cron; never deploy Worker code. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORKER_NAME = "dam-weather-scheduler";
const TARGET_CRON = "0 */8 * * *";
const PREVIOUS_CRON = "0 */3 * * *";
const REQUEST_TIMEOUT_MS = 20_000;

interface SyncOptions {
  env?: Partial<Pick<NodeJS.ProcessEnv, "CLOUDFLARE_ACCOUNT_ID" | "CLOUDFLARE_API_TOKEN">>;
  fetchImpl?: typeof fetch;
  readConfig?: () => string;
}

class SchedulerSyncError extends Error {}

function fail(message: string): never {
  throw new SchedulerSyncError(`Scheduler sync failed: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readLocalConfig(): string {
  return fs.readFileSync(new URL("../workers/scheduler/wrangler.toml", import.meta.url), "utf8");
}

/** Accept the repository's simple, single-line TOML format and fail closed on drift. */
function validateLocalConfig(readConfig: () => string): void {
  let config: string;
  try {
    config = readConfig();
  } catch {
    fail("cannot read local scheduler configuration");
  }

  const sections = new Map<string, Map<string, string>>([["", new Map()]]);
  let current = sections.get("")!;
  for (const rawLine of config.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    // Multiline strings/arrays or quoted keys need an explicit review rather
    // than accidentally matching a name or cron embedded in another value.
    if (line.includes('"""') || line.includes("'''")) fail("unsupported local configuration");
    const section = line.match(/^\[([a-zA-Z0-9_.-]+)\]$/)?.[1];
    if (section) {
      if (sections.has(section)) fail("duplicate local configuration section");
      current = new Map();
      sections.set(section, current);
      continue;
    }
    const assignment = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
    if (!assignment || current.has(assignment[1])) fail("unsupported local configuration");
    current.set(assignment[1], assignment[2]);
  }

  if (sections.get("")?.get("name") !== `"${WORKER_NAME}"`) {
    fail("local Worker name does not match the fixed scheduler");
  }
  const cronText = sections.get("triggers")?.get("crons");
  let crons: unknown;
  try {
    crons = JSON.parse(cronText ?? "null") as unknown;
  } catch {
    fail("invalid local scheduler cron");
  }
  if (!Array.isArray(crons) || crons.length !== 1 || crons[0] !== TARGET_CRON) {
    fail("local scheduler must contain only the approved three-times-daily cron");
  }
}

/**
 * GET/PUT schemas: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/schedules/
 * Only the known previous cron may be replaced. Re-running after success is read-only.
 */
export async function syncScheduler({
  env = process.env,
  fetchImpl = fetch,
  readConfig = readLocalConfig,
}: SyncOptions = {}): Promise<"updated" | "unchanged"> {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_API_TOKEN;
  if (typeof accountId !== "string" || !/^[a-fA-F0-9]{32}$/.test(accountId)) {
    fail("CLOUDFLARE_ACCOUNT_ID must be a 32-character hexadecimal account ID");
  }
  if (typeof token !== "string" || !token.trim()) {
    fail("CLOUDFLARE_API_TOKEN is required");
  }
  validateLocalConfig(readConfig);

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${WORKER_NAME}/schedules`;

  async function request(method: "GET" | "PUT"): Promise<string[]> {
    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        ...(method === "PUT" ? { body: JSON.stringify([{ cron: TARGET_CRON }]) } : {}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: "error",
      });
    } catch {
      // Transport errors can include headers, URLs, or credentials. Never relay them.
      fail(`${method} request failed or timed out; no automatic retry was attempted`);
    }
    if (!response.ok) fail(`${method} returned HTTP ${response.status}`);

    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      fail(`${method} returned invalid JSON`);
    }
    if (!isRecord(payload) || payload.success !== true) {
      fail(`${method} did not report API success`);
    }
    if (!isRecord(payload.result) || !Array.isArray(payload.result.schedules)) {
      fail(`${method} returned invalid schedules`);
    }
    return payload.result.schedules.map((schedule: unknown) => {
      if (!isRecord(schedule) || typeof schedule.cron !== "string") {
        fail(`${method} returned an invalid schedule`);
      }
      return schedule.cron;
    });
  }

  const isSoleCron = (crons: string[], cron: string) => crons.length === 1 && crons[0] === cron;
  const before = await request("GET");
  if (isSoleCron(before, TARGET_CRON)) return "unchanged";
  if (!isSoleCron(before, PREVIOUS_CRON)) {
    fail("unexpected remote cron configuration; refusing to overwrite it");
  }

  const updated = await request("PUT");
  if (!isSoleCron(updated, TARGET_CRON)) fail("PUT response does not match the approved cron");
  if (!isSoleCron(await request("GET"), TARGET_CRON)) {
    fail("readback does not match the approved cron");
  }
  return "updated";
}

const invokedPath = process.argv[1];
if (invokedPath && path.resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  syncScheduler()
    .then((result) => {
      console.log(`Scheduler ${result}: verified JST 01:00, 09:00 and 17:00.`);
    })
    .catch((error: unknown) => {
      console.error(
        error instanceof SchedulerSyncError ? error.message : "Scheduler sync failed unexpectedly",
      );
      process.exitCode = 1;
    });
}
