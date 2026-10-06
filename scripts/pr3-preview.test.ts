// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  guardPreviewTarget,
  preparePreviewData,
  PROJECT,
  PREVIEW_BRANCH,
  verifyPreviewDeployment,
} from "./pr3-preview.ts";

const SHA = "a".repeat(40);
const ENV = {
  GITHUB_REPOSITORY: "shiroemons/dam-weather-app",
  GITHUB_REF: "refs/heads/feat/prefecture-storage-rate-filter",
  GITHUB_EVENT_NAME: "push",
  GITHUB_SHA: SHA,
  CLOUDFLARE_ACCOUNT_ID: "b".repeat(32),
  CLOUDFLARE_API_TOKEN: "synthetic-test-token",
};
const NOW = new Date("2026-10-06T01:00:00Z");
const DAMS = [
  { id: "one", prefectureSlug: "tokyo" },
  { id: "two", prefectureSlug: "saitama" },
];
const project = { name: PROJECT, production_branch: "main" };

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function forecast(date: string) {
  return {
    date,
    weatherCode: 0,
    weather: "晴れ",
    tempMax: 25,
    tempMin: 15,
    precipProbability: 0,
    precipitationSum: 0,
  };
}

function weather(slug: string) {
  return {
    prefectureSlug: slug,
    updatedAt: NOW.toISOString(),
    dams: DAMS.filter((d) => d.prefectureSlug === slug).map((d) => ({
      damId: d.id,
      today: forecast("2026-10-06"),
      tomorrow: forecast("2026-10-07"),
    })),
  };
}

function storage(slug: string) {
  return {
    prefectureSlug: slug,
    updatedAt: NOW.toISOString(),
    dams: DAMS.filter((d) => d.prefectureSlug === slug).map((d) => ({
      damId: d.id,
      storageRate: 0,
    })),
  };
}

function deployment(overrides: Record<string, unknown> = {}) {
  return {
    environment: "preview",
    deployment_trigger: { metadata: { branch: PREVIEW_BRANCH, commit_hash: SHA } },
    latest_stage: { name: "deploy", status: "success" },
    url: "https://abc12345.japan-dam-weather.pages.dev",
    ...overrides,
  };
}

describe("PR 3 preview deployment guard", () => {
  it("reads only the existing project, rejects credential redirects, and accepts main distinct from the preview", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ success: true, result: project }));
    await guardPreviewTarget(ENV, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}`,
      expect.objectContaining({
        redirect: "error",
        headers: { Authorization: "Bearer synthetic-test-token" },
      }),
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    { GITHUB_REPOSITORY: "other/fork" },
    { GITHUB_EVENT_NAME: "pull_request_target" },
    { GITHUB_EVENT_NAME: "pull_request" },
    { GITHUB_REF: "refs/heads/main" },
    { GITHUB_SHA: "" },
    { CLOUDFLARE_ACCOUNT_ID: "" },
    { CLOUDFLARE_API_TOKEN: "" },
  ])("rejects untrusted or missing environment before network access: %j", async (overrides) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(guardPreviewTarget({ ...ENV, ...overrides }, fetchImpl)).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    { ...project, production_branch: PREVIEW_BRANCH },
    { ...project, production_branch: "" },
    { ...project, name: "other" },
  ])("fails closed for unexpected project configuration: %j", async (result) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ success: true, result }));
    await expect(guardPreviewTarget(ENV, fetchImpl)).rejects.toThrow();
  });

  it("does not deploy or expand permissions when the token cannot read the project", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ success: false }, 403));
    await expect(guardPreviewTarget(ENV, fetchImpl)).rejects.toThrow(
      "Cloudflare read failed (HTTP 403)",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns only a successful preview URL matching the exact commit and branch", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, result: project }))
      .mockResolvedValueOnce(response({ success: true, result: [deployment()] }));
    await expect(verifyPreviewDeployment(ENV, fetchImpl)).resolves.toBe(
      "https://abc12345.japan-dam-weather.pages.dev",
    );
  });

  it.each([
    { environment: "production" },
    { deployment_trigger: { metadata: { branch: "main", commit_hash: SHA } } },
    { deployment_trigger: { metadata: { branch: PREVIEW_BRANCH, commit_hash: "c".repeat(40) } } },
    { latest_stage: { name: "deploy", status: "failure" } },
    { url: "https://japan-dam-weather.pages.dev" },
  ])("rejects mismatched or unsuccessful deployments: %j", async (overrides) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, result: project }))
      .mockResolvedValueOnce(response({ success: true, result: [deployment(overrides)] }));
    await expect(verifyPreviewDeployment(ENV, fetchImpl, { timeoutMs: 0 })).rejects.toThrow();
  });

  it("waits for this exact preview to become ready instead of treating upload completion as readiness", async () => {
    let clock = 0;
    const sleep = vi.fn(async (ms: number) => {
      clock += ms;
    });
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, result: project }))
      .mockResolvedValueOnce(response({ success: true, result: [] }))
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [deployment({ latest_stage: { name: "deploy", status: "active" } })],
        }),
      )
      .mockResolvedValueOnce(response({ success: true, result: [deployment()] }));
    await expect(
      verifyPreviewDeployment(ENV, fetchImpl, { now: () => clock, sleep }),
    ).resolves.toBe("https://abc12345.japan-dam-weather.pages.dev");
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("keeps workflow scope to the trusted push branch, explicit preview target and read-only repository permission", () => {
    const workflow = fs.readFileSync(
      new URL("../.github/workflows/preview-pr3.yml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain("branches: [feat/prefecture-storage-rate-filter]");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("group: pages-preview-pr-3");
    expect(workflow).toContain("--project-name=japan-dam-weather --branch=preview-pr-3");
    expect(workflow).not.toContain("weather-production");
    expect(workflow).not.toContain("scripts/fetch-weather.ts");
    expect(workflow).not.toContain("scripts/fetch-dam-storage.ts");
  });
});

describe("published preview snapshots", () => {
  let directory: string;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "pr3-preview-"));
  });
  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  function snapshots(override?: (url: URL) => Response | undefined) {
    return vi.fn<typeof fetch>(async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      const custom = override?.(url);
      if (custom) return custom;
      const slug = path.basename(url.pathname, ".json");
      return response(url.pathname.startsWith("/weather/") ? weather(slug) : storage(slug));
    });
  }

  it("copies complete published weather and preserves received zero rates without contacting upstream APIs", async () => {
    const fetchImpl = snapshots();
    await expect(
      preparePreviewData({ dams: DAMS, publicDir: directory, fetchImpl, now: NOW }),
    ).resolves.toEqual({ weatherFiles: 2, storageFiles: 2 });
    const saved = JSON.parse(fs.readFileSync(path.join(directory, "storage/saitama.json"), "utf8"));
    expect(saved.dams[0].storageRate).toBe(0);
    expect(saved.updatedAt).toBe(NOW.toISOString());
    for (const [url, options] of fetchImpl.mock.calls) {
      expect(url).toMatch(/^https:\/\/japan-dam-weather\.pages\.dev\/(weather|storage)\//);
      expect(options?.headers).toBeUndefined();
      expect(options?.redirect).toBe("error");
    }
  });

  it.each([404, 200])(
    "leaves absent storage files absent (status %i), without creating false zero results",
    async (status) => {
      const fetchImpl = snapshots((url) =>
        url.pathname === "/storage/tokyo.json"
          ? new Response("<!doctype html>", { status, headers: { "content-type": "text/html" } })
          : undefined,
      );
      await expect(
        preparePreviewData({ dams: DAMS, publicDir: directory, fetchImpl, now: NOW }),
      ).resolves.toEqual({ weatherFiles: 2, storageFiles: 1 });
      expect(fs.existsSync(path.join(directory, "storage/tokyo.json"))).toBe(false);
    },
  );

  it.each(["missing-weather", "incomplete-weather", "stale-weather", "bad-storage", "no-rates"])(
    "refuses unusable snapshots: %s",
    async (kind) => {
      const fetchImpl = snapshots((url) => {
        if (kind === "missing-weather" && url.pathname === "/weather/tokyo.json")
          return response({}, 404);
        if (kind === "incomplete-weather" && url.pathname === "/weather/tokyo.json")
          return response({ ...weather("tokyo"), dams: [] });
        if (kind === "stale-weather" && url.pathname === "/weather/tokyo.json")
          return response({ ...weather("tokyo"), updatedAt: "2026-10-04T00:00:00Z" });
        if (kind === "bad-storage" && url.pathname === "/storage/tokyo.json")
          return response({ ...storage("tokyo"), dams: [null] });
        if (kind === "no-rates" && url.pathname.startsWith("/storage/")) return response({}, 404);
        return undefined;
      });
      await expect(
        preparePreviewData({ dams: DAMS, publicDir: directory, fetchImpl, now: NOW }),
      ).rejects.toThrow();
    },
  );
});
