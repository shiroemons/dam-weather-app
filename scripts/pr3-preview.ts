/** PR 3 only: reuse published snapshots and verify a separate Pages preview. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWeatherData } from "./validate-weather.ts";

export const PROJECT = "japan-dam-weather";
export const PREVIEW_BRANCH = "preview-pr-3";
const PUBLISHED_ORIGIN = "https://japan-dam-weather.pages.dev";
const TRUSTED_REF = "refs/heads/feat/prefecture-storage-rate-filter";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type ExpectedDam = { id: string; prefectureSlug: string };
type PreviewEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | "CLOUDFLARE_ACCOUNT_ID"
    | "CLOUDFLARE_API_TOKEN"
    | "GITHUB_REPOSITORY"
    | "GITHUB_REF"
    | "GITHUB_EVENT_NAME"
    | "GITHUB_SHA"
  >
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`PR 3 preview: ${message}`);
}

export async function preparePreviewData({
  dams,
  publicDir,
  fetchImpl = fetch,
  now = new Date(),
}: {
  dams: ExpectedDam[];
  publicDir: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<{ weatherFiles: number; storageFiles: number }> {
  assert(dams.length > 0, "dam list is empty");
  const slugs = [...new Set(dams.map((dam) => dam.prefectureSlug))];
  assert(
    slugs.every((slug) => /^[a-z]+$/.test(slug)),
    "invalid prefecture slug",
  );
  const expected = new Map(dams.map((dam) => [dam.id, dam.prefectureSlug]));
  for (const category of ["weather", "storage"]) {
    const directory = path.join(publicDir, category);
    fs.rmSync(directory, { recursive: true, force: true });
    fs.mkdirSync(directory, { recursive: true });
  }
  let storageFiles = 0;
  let displayableRates = 0;
  for (const slug of slugs) {
    for (const category of ["weather", "storage"]) {
      const response = await fetchImpl(`${PUBLISHED_ORIGIN}/${category}/${slug}.json`, {
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
      // Some prefectures have no published storage file; do not invent empty data.
      if (category === "storage" && response.status === 404) continue;
      assert(response.ok, `${category}/${slug}.json returned HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      // Pages serves the SPA HTML fallback for absent static storage files.
      if (category === "storage" && contentType.includes("text/html")) continue;
      const payload: unknown = await response.json();
      assert(
        isRecord(payload) && payload.prefectureSlug === slug && Array.isArray(payload.dams),
        `${category}/${slug}.json is invalid`,
      );
      if (category === "storage") {
        for (const entry of payload.dams) {
          assert(
            isRecord(entry) &&
              typeof entry.damId === "string" &&
              expected.get(entry.damId) === slug,
            `invalid storage dam in ${slug}`,
          );
          assert(
            entry.storageRate == null ||
              (typeof entry.storageRate === "number" && Number.isFinite(entry.storageRate)),
            `invalid storage rate in ${slug}`,
          );
          if (Number.isFinite(entry.storageRate)) displayableRates++;
        }
        storageFiles++;
      }
      fs.writeFileSync(path.join(publicDir, category, `${slug}.json`), JSON.stringify(payload));
    }
  }
  validateWeatherData(dams, path.join(publicDir, "weather"), now);
  assert(displayableRates > 0, "published snapshots contain no displayable storage rates");
  return { weatherFiles: slugs.length, storageFiles };
}

function validateEnvironment(env: PreviewEnv): void {
  assert(
    env.GITHUB_REPOSITORY === "shiroemons/dam-weather-app" &&
      env.GITHUB_REF === TRUSTED_REF &&
      env.GITHUB_EVENT_NAME === "push",
    "untrusted repository, branch or event",
  );
  assert(
    typeof env.GITHUB_SHA === "string" && /^[a-f0-9]{40}$/.test(env.GITHUB_SHA),
    "missing commit SHA",
  );
  assert(
    typeof env.CLOUDFLARE_ACCOUNT_ID === "string" &&
      /^[a-fA-F0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID),
    "missing Cloudflare account ID",
  );
  assert(
    typeof env.CLOUDFLARE_API_TOKEN === "string" && env.CLOUDFLARE_API_TOKEN.trim(),
    "missing Cloudflare token",
  );
}

async function cloudflareRead(
  suffix: string,
  env: PreviewEnv,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  validateEnvironment(env);
  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}${suffix}`,
    {
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    },
  );
  assert(
    response.ok,
    `Cloudflare read failed (HTTP ${response.status}); no permission changes attempted`,
  );
  const payload: unknown = await response.json();
  assert(isRecord(payload) && payload.success === true, "Cloudflare read was not successful");
  return payload.result;
}

export async function guardPreviewTarget(
  env: PreviewEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const project = await cloudflareRead("", env, fetchImpl);
  assert(isRecord(project) && project.name === PROJECT, "unexpected Pages project");
  assert(
    project.production_branch === "main",
    "production branch does not match the expected main; refusing upload",
  );
}

export async function verifyPreviewDeployment(
  env: PreviewEnv = process.env,
  fetchImpl: typeof fetch = fetch,
  {
    timeoutMs = 120_000,
    now = Date.now,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  }: { timeoutMs?: number; now?: () => number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<string> {
  await guardPreviewTarget(env, fetchImpl);
  const deadline = now() + timeoutMs;
  // Wrangler may finish before Pages exposes the completed deployment status.
  while (true) {
    const deployments = await cloudflareRead("/deployments?per_page=25", env, fetchImpl);
    assert(Array.isArray(deployments), "deployment list is invalid");
    const deployment: unknown = deployments.find((entry: unknown) => {
      if (
        !isRecord(entry) ||
        !isRecord(entry.deployment_trigger) ||
        !isRecord(entry.deployment_trigger.metadata)
      )
        return false;
      return (
        entry.deployment_trigger.metadata.branch === PREVIEW_BRANCH &&
        entry.deployment_trigger.metadata.commit_hash === env.GITHUB_SHA
      );
    });
    if (isRecord(deployment)) {
      assert(deployment.environment === "preview", "matching deployment is not a preview");
      const stage = deployment.latest_stage;
      assert(isRecord(stage), "preview deployment stage is invalid");
      assert(
        stage.status !== "failure" && stage.status !== "canceled",
        "preview deployment failed or was canceled",
      );
      if (stage.name === "deploy" && stage.status === "success") {
        assert(
          typeof deployment.url === "string" &&
            /^https:\/\/[a-z0-9-]+\.japan-dam-weather\.pages\.dev$/.test(deployment.url),
          "unexpected preview URL",
        );
        return deployment.url;
      }
    }
    const remaining = deadline - now();
    assert(
      remaining > 0,
      "preview readiness verification timed out; inspect the deployment before retrying",
    );
    await sleep(Math.min(5000, remaining));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2];
    if (mode === "prepare") {
      const dams = JSON.parse(
        fs.readFileSync(path.join(ROOT, "src/data/dams.json"), "utf8"),
      ) as ExpectedDam[];
      console.log(await preparePreviewData({ dams, publicDir: path.join(ROOT, "public") }));
    } else if (mode === "guard") {
      await guardPreviewTarget();
      console.log(`Verified ${PROJECT}: production main, target ${PREVIEW_BRANCH}`);
    } else if (mode === "verify") {
      const url = await verifyPreviewDeployment();
      console.log(`Verified PR 3 preview: ${url}`);
      if (process.env.GITHUB_STEP_SUMMARY)
        fs.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `## PR 3 preview\n\n${url}\n\nCommit: ${process.env.GITHUB_SHA}\n`,
        );
    } else throw new Error("Use prepare, guard or verify");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Preview failed");
    process.exitCode = 1;
  }
}
