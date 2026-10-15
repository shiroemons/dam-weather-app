// @vitest-environment node
import fs from "node:fs";
import { describe, expect, it } from "vite-plus/test";

const config = fs.readFileSync(
  new URL("../workers/scheduler/wrangler.toml", import.meta.url),
  "utf8",
);

describe("weather and storage update schedule", () => {
  it("dispatches one shared workflow three times per UTC day", () => {
    const cron = config.match(/^crons\s*=\s*(\[[^\n]+\])/m)?.[1];
    expect(cron).toBeDefined();
    expect(JSON.parse(cron!)).toEqual(["0 1,8,16 * * *"]);
    expect(config).toContain('GITHUB_WORKFLOW_ID = "update-weather.yml"');
  });

  it("maps the configured UTC hours to 01:00, 10:00 and 17:00 in Japan", () => {
    const cron = JSON.parse(config.match(/^crons\s*=\s*(\[[^\n]+\])/m)![1])[0] as string;
    const hours = cron
      .split(" ")[1]
      .split(",")
      .map(Number)
      .map((hour) =>
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Tokyo",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date(Date.UTC(2026, 9, 6, hour))),
      );
    expect(hours.sort()).toEqual(["01:00", "10:00", "17:00"]);
  });
});
