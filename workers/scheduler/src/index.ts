export interface Env {
  GITHUB_PAT: string;
  GITHUB_REPO: string;
  GITHUB_WORKFLOW_ID: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW_ID}/dispatches`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "dam-weather-scheduler",
      },
      body: JSON.stringify({ ref: "main" }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`GitHub API error: ${response.status} ${body}`);
      throw new Error(`Failed to dispatch workflow: ${response.status}`);
    }

    console.log(
      `Workflow dispatched at ${new Date(controller.scheduledTime).toISOString()}`,
    );
  },
} satisfies ExportedHandler<Env>;
