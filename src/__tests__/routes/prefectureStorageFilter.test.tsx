import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { filterDamsWithStorageRate } from "@/lib/filterDamsWithStorageRate";
import { routeTree } from "@/routeTree.gen";
import type { Dam } from "@/types/dam";
import type { DamStorage, PrefectureStorage } from "@/types/storage";

const baseDam: Dam = {
  id: "zero",
  damName: "対象ゼロダム",
  prefecture: "東京都",
  prefectureSlug: "tokyo",
  prefectureCode: "13",
  latitude: 35.68,
  longitude: 139.76,
  damType: "重力式コンクリート",
  waterSystem: "多摩川",
  riverName: "多摩川",
  totalStorageCapacity: 10000,
  damHeight: 50,
  completionYear: 2000,
  address: "東京都西多摩郡奥多摩町",
  municipality: "西多摩郡奥多摩町",
  isMajor: true,
  riverUrl: "https://www.river.go.jp/",
  purposes: ["上水道用水"],
};

const dams: Dam[] = [
  baseDam,
  { ...baseDam, id: "normal", damName: "通常ダム", isMajor: false },
  { ...baseDam, id: "null", damName: "率なしダム" },
  { ...baseDam, id: "missing", damName: "記録なしダム" },
  { ...baseDam, id: "other-type", damName: "対象型式違いダム", damType: "アーチ" },
  { ...baseDam, id: "other-purpose", damName: "対象用途違いダム", purposes: ["発電"] },
];

function storageEntry(damId: string, storageRate: number | null): DamStorage {
  return {
    damId,
    storageRate,
    obsTime: "2026-10-06T09:00:00+09:00",
    storageLevel: 0,
    storageCapacity: 0,
    inflow: 0,
    outflow: 0,
  };
}

const storage: PrefectureStorage = {
  prefectureSlug: "tokyo",
  updatedAt: "2026-10-06T00:00:00Z",
  dams: [
    storageEntry("zero", 0),
    storageEntry("normal", 75),
    storageEntry("null", null),
    storageEntry("other-type", 35),
    storageEntry("other-purpose", 50),
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

let storageResponse: () => Promise<Response>;
let damsResponse: () => Promise<Response>;
const clients: QueryClient[] = [];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("theme", "light");
  storageResponse = () => Promise.resolve(jsonResponse(storage));
  damsResponse = () => Promise.resolve(jsonResponse(dams));
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === "/data/dams/tokyo.json") return damsResponse();
      if (url === "/weather/tokyo.json") {
        return Promise.resolve(jsonResponse({ ...storage, dams: [] }));
      }
      if (url === "/storage/tokyo.json") return storageResponse();
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
});

afterEach(() => {
  cleanup();
  for (const client of clients) client.clear();
  clients.length = 0;
  onlineManager.setOnline(true);
  vi.unstubAllGlobals();
});

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

async function renderPage(search = "", client = createClient()) {
  const history = createMemoryHistory({ initialEntries: [`/prefecture/tokyo${search}`] });
  const router = createRouter({ routeTree, history });
  clients.push(client);
  await router.load();
  const rendered = render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <WatchlistProvider>
          <RouterProvider router={router} />
        </WatchlistProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  await screen.findByRole("heading", { name: "東京都", level: 1 });
  return { ...rendered, router, history, client };
}

function expectDam(name: string, visible: boolean) {
  expect(screen.queryAllByRole("link", { name }).length > 0).toBe(visible);
}

describe("貯水率が表示できるダムの判定", () => {
  it("0と通常値を含め、null・欠損・非数値を除外する", () => {
    const invalidRates = [null, undefined, NaN, Infinity, "0"];
    for (const rate of invalidRates) {
      const entries = [storageEntry("zero", 0), storageEntry("normal", 75)];
      entries.push({ ...storageEntry("null", null), storageRate: rate } as DamStorage);
      expect(
        filterDamsWithStorageRate(dams, { ...storage, dams: entries }).map((dam) => dam.id),
      ).toEqual(["zero", "normal"]);
    }
    expect(filterDamsWithStorageRate(dams, undefined)).toEqual([]);
  });
});

describe("都道府県ページの貯水率フィルター", () => {
  it("観測所と貯水率ありを折り返さない共通の横並びにまとめる", async () => {
    await renderPage();
    const obsToggle = screen.getByRole("switch", { name: "観測所" });
    const storageToggle = screen.getByRole("switch", { name: "貯水率あり" });
    const toggleRow = obsToggle.parentElement?.parentElement;

    expect(toggleRow).toBe(storageToggle.parentElement?.parentElement);
    for (const className of ["flex", "flex-nowrap", "shrink-0", "whitespace-nowrap"]) {
      expect(toggleRow?.classList.contains(className)).toBe(true);
    }
    expect(toggleRow?.children).toHaveLength(2);
    expect(toggleRow?.parentElement?.classList.contains("flex-wrap")).toBe(true);
  });

  it("初期OFFで、キーボードでON/OFFでき、0%を含むカードと件数を更新する", async () => {
    const user = userEvent.setup();
    const { history } = await renderPage();
    await screen.findByText("6基のダム");
    const toggle = screen.getByRole("switch", { name: "貯水率あり" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expectDam("率なしダム", true);
    toggle.focus();
    await user.keyboard(" ");
    await screen.findByText("4基のダム / 全6基");
    expectDam("対象ゼロダム", true);
    expectDam("通常ダム", true);
    expectDam("率なしダム", false);
    expectDam("記録なしダム", false);
    expect(history.location.search).toContain("storage=true");
    await user.keyboard("{Enter}");
    await screen.findByText("6基のダム");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expectDam("記録なしダム", true);
  });

  it("既存の名前検索・用途・型式・観測所とANDで併用し、条件を保ったまま解除する", async () => {
    const user = userEvent.setup();
    const { history } = await renderPage("?storage=true&obs=true&purposes=W&types=G&q=対象");
    await screen.findByText("1基のダム / 全6基");
    expectDam("対象ゼロダム", true);
    expectDam("通常ダム", false);
    expectDam("対象型式違いダム", false);
    expectDam("対象用途違いダム", false);
    await user.click(screen.getByRole("switch", { name: "貯水率あり" }));
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(history.location.search).toContain("obs=true");
    expect(history.location.search).toContain("purposes=W");
    expect(history.location.search).toContain("types=G");
    expect((screen.getByPlaceholderText("ダム名で検索...") as HTMLInputElement).value).toBe("対象");
  });

  it("一覧の貯水率順とカード切替で状態を保ち、URLから再表示できる", async () => {
    const user = userEvent.setup();
    const first = await renderPage("?storage=true&view=list&sort=rate&order=asc");
    await screen.findByText("4基のダム / 全6基");
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getByRole("link", { name: /ダム$/ }).textContent)).toEqual(
      ["対象ゼロダム", "対象型式違いダム", "対象用途違いダム", "通常ダム"],
    );
    await user.click(screen.getByRole("button", { name: "カード表示" }));
    await waitFor(() => expect(screen.queryByRole("table")).toBeNull());
    expect(screen.getByRole("switch", { name: "貯水率あり" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(first.history.location.search).toContain("sort=rate");
    const search = first.history.location.search;
    first.unmount();
    await renderPage(search);
    await screen.findByText("4基のダム / 全6基");
    expectDam("対象ゼロダム", true);
    expectDam("率なしダム", false);
  });

  it("貯水率の読み込み中を0件とせず、解除すれば他のデータだけで表示する", async () => {
    let resolveStorage!: (response: Response) => void;
    storageResponse = () =>
      new Promise((resolve) => {
        resolveStorage = resolve;
      });
    const user = userEvent.setup();
    await renderPage("?storage=true");
    expect(await screen.findByText("貯水率データを読み込み中…")).not.toBeNull();
    expect(screen.queryByText(/0基のダム/)).toBeNull();
    expect(screen.queryByText("条件に合うダムがありません")).toBeNull();
    await user.click(screen.getByRole("switch", { name: "貯水率あり" }));
    await screen.findByText("6基のダム");
    expectDam("記録なしダム", true);
    await user.click(screen.getByRole("switch", { name: "貯水率あり" }));
    await act(async () => resolveStorage(jsonResponse(storage)));
    await screen.findByText("4基のダム / 全6基");
    expectDam("対象ゼロダム", true);
  });

  it.each([404, 500])("HTTP %iを0件とせず、再読み込みで回復する", async (status) => {
    storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: [] }, status));
    const user = userEvent.setup();
    await renderPage("?storage=true");
    expect((await screen.findByRole("alert")).textContent).toContain(
      "貯水率データを取得できません",
    );
    expect(screen.queryByText(/0基のダム/)).toBeNull();
    expect(screen.queryByText("条件に合うダムがありません")).toBeNull();
    storageResponse = () => Promise.resolve(jsonResponse(storage));
    await user.click(screen.getByRole("button", { name: "貯水率データを再読み込み" }));
    await screen.findByText("4基のダム / 全6基");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([{ error: "unavailable" }, { ...storage, dams: [null] }])(
    "形式の異なる応答を取得エラーにし、フィルター解除で全件を表示できる (%j)",
    async (response) => {
      storageResponse = () => Promise.resolve(jsonResponse(response));
      const user = userEvent.setup();
      await renderPage("?storage=true");
      await screen.findByRole("alert");
      await user.click(screen.getByRole("switch", { name: "貯水率あり" }));
      await screen.findByText("6基のダム");
      expect(screen.queryByRole("alert")).toBeNull();
      expectDam("記録なしダム", true);
    },
  );

  it.each([
    ["記録なし", []],
    ["すべてnull", dams.map((dam) => storageEntry(dam.id, null))],
    ["県外の記録のみ", [storageEntry("outside-prefecture", 75)]],
    ["貯水率フィールドなし", [{ damId: "zero" }]],
  ])("正常取得した県全体に表示可能な貯水率がなければスイッチを隠す (%s)", async (_, entries) => {
    storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: entries }));
    const { client } = await renderPage();
    await waitFor(() => expect(client.getQueryState(["storage", "tokyo"])?.status).toBe("success"));
    await waitFor(() => expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull());
    expect(screen.getByRole("switch", { name: "観測所" })).not.toBeNull();
    await screen.findByText("6基のダム");
    expectDam("率なしダム", true);
  });

  it("0%のダムしかなくてもスイッチを表示する", async () => {
    storageResponse = () =>
      Promise.resolve(jsonResponse({ ...storage, dams: [storageEntry("zero", 0)] }));
    await renderPage("?storage=true");
    await screen.findByText("1基のダム / 全6基");
    expect(screen.getByRole("switch", { name: "貯水率あり" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expectDam("対象ゼロダム", true);
  });

  it("非表示にしたフィルターをURLから解除し、他の条件と表示を保つ", async () => {
    storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: [] }));
    const { history } = await renderPage(
      "?storage=true&obs=true&purposes=W&types=G&q=対象&group=municipality&view=list&sort=rate&order=desc",
    );
    await screen.findByText("1基のダム / 全6基");
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(history.length).toBe(1);
    for (const value of [
      "obs=true",
      "purposes=W",
      "types=G",
      "group=municipality",
      "view=list",
      "sort=rate",
      "order=desc",
    ]) {
      expect(history.location.search).toContain(value);
    }
    expect((screen.getByPlaceholderText("ダム名で検索...") as HTMLInputElement).value).toBe("対象");
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
    expect(screen.queryByText("条件に合うダムがありません")).toBeNull();
    expectDam("対象ゼロダム", true);
  });

  it("他の条件で貯水率のあるダムが0件になっても、スイッチと解除手段を残す", async () => {
    const user = userEvent.setup();
    await renderPage("?storage=true&q=率なし");
    await screen.findByText("0基のダム / 全6基");
    expect(screen.getByRole("switch", { name: "貯水率あり" })).not.toBeNull();
    expect(screen.getByText("条件に合うダムがありません")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "「貯水率あり」を解除" }));
    await screen.findByText("1基のダム / 全6基");
    expectDam("率なしダム", true);
  });

  it("読み込み中はスイッチを残し、データなしが確定してから非表示とURL解除を行う", async () => {
    let resolveStorage!: (response: Response) => void;
    storageResponse = () =>
      new Promise((resolve) => {
        resolveStorage = resolve;
      });
    const { history } = await renderPage("?storage=true");
    await screen.findByText("貯水率データを読み込み中…");
    expect(screen.getByRole("switch", { name: "貯水率あり" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(history.location.search).toContain("storage=true");
    await act(async () => resolveStorage(jsonResponse({ ...storage, dams: [] })));
    await screen.findByText("6基のダム");
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
  });

  it("取得エラーではスイッチを残し、再試行でデータなしが確定したら非表示にする", async () => {
    storageResponse = () => Promise.resolve(jsonResponse({}, 500));
    const user = userEvent.setup();
    const { history } = await renderPage("?storage=true");
    await screen.findByRole("alert");
    expect(screen.getByRole("switch", { name: "貯水率あり" })).not.toBeNull();
    expect(history.location.search).toContain("storage=true");
    storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: [] }));
    await user.click(screen.getByRole("button", { name: "貯水率データを再読み込み" }));
    await screen.findByText("6基のダム");
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("初回取得がオフラインで一時停止しても0件と表示せず、接続復帰で絞り込む", async () => {
    const client = createClient();
    client.setQueryData(["dams", "tokyo"], dams);
    client.setQueryData(["weather", "tokyo"], { ...storage, dams: [] });
    onlineManager.setOnline(false);
    await renderPage("?storage=true", client);
    await waitFor(() =>
      expect(client.getQueryState(["storage", "tokyo"])?.fetchStatus).toBe("paused"),
    );
    expect(screen.getByText("貯水率データを読み込み中…")).not.toBeNull();
    expect(screen.queryByText(/0基のダム/)).toBeNull();
    expect(screen.queryByText("条件に合うダムがありません")).toBeNull();
    await act(async () => onlineManager.setOnline(true));
    await screen.findByText("4基のダム / 全6基");
  });

  it("貯水率だけ先に取得できても、ダム情報の取得完了まで0件と表示しない", async () => {
    let resolveDams!: (response: Response) => void;
    damsResponse = () =>
      new Promise((resolve) => {
        resolveDams = resolve;
      });
    const { client } = await renderPage("?storage=true");
    await waitFor(() => expect(client.getQueryState(["storage", "tokyo"])?.status).toBe("success"));
    expect(screen.getByText("ダム情報を読み込み中…")).not.toBeNull();
    expect(screen.queryByText(/0基のダム/)).toBeNull();
    await act(async () => resolveDams(jsonResponse(dams)));
    await screen.findByText("4基のダム / 全6基");
  });

  it("貯水率が空でもダム情報の取得中は非表示にせず、確定後に解除する", async () => {
    let resolveDams!: (response: Response) => void;
    damsResponse = () =>
      new Promise((resolve) => {
        resolveDams = resolve;
      });
    storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: [] }));
    const { client, history } = await renderPage("?storage=true");
    await waitFor(() => expect(client.getQueryState(["storage", "tokyo"])?.status).toBe("success"));
    expect(screen.getByRole("switch", { name: "貯水率あり" })).not.toBeNull();
    expect(history.location.search).toContain("storage=true");
    await act(async () => resolveDams(jsonResponse(dams)));
    await screen.findByText("6基のダム");
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
  });

  it("後から貯水率が取得できればスイッチをOFFの状態で再表示する", async () => {
    storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: [] }));
    const { client, history } = await renderPage("?storage=true");
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
    storageResponse = () => Promise.resolve(jsonResponse(storage));
    await act(async () => {
      await client.refetchQueries({ queryKey: ["storage", "tokyo"] });
    });
    expect(
      (await screen.findByRole("switch", { name: "貯水率あり" })).getAttribute("aria-checked"),
    ).toBe("false");
    await screen.findByText("6基のダム");
  });

  it.each([404, 500])(
    "ダム情報のHTTP %iをデータなしとせず、再読み込みで確認する",
    async (status) => {
      damsResponse = () => Promise.resolve(jsonResponse([], status));
      storageResponse = () => Promise.resolve(jsonResponse({ ...storage, dams: [] }));
      const user = userEvent.setup();
      const { history } = await renderPage("?storage=true");
      await screen.findByText("ダム情報を確認できません");
      expect(screen.getByRole("switch", { name: "貯水率あり" })).not.toBeNull();
      expect(history.location.search).toContain("storage=true");
      damsResponse = () => Promise.resolve(jsonResponse(dams));
      await user.click(screen.getByRole("button", { name: "再読み込み" }));
      await screen.findByText("6基のダム");
      await waitFor(() => expect(history.location.search).toContain("storage=false"));
      expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
      expect(screen.queryByText("データの読み込みに失敗しました")).toBeNull();
    },
  );

  it("県の切り替えと戻る・進むで、県ごとのスイッチとURLを一致させる", async () => {
    const client = createClient();
    const osakaDam = {
      ...baseDam,
      id: "osaka-dam",
      damName: "大阪ダム",
      prefecture: "大阪府",
      prefectureSlug: "osaka",
    };
    client.setQueryData(["dams", "osaka"], [osakaDam]);
    client.setQueryData(["weather", "osaka"], { ...storage, prefectureSlug: "osaka", dams: [] });
    client.setQueryData(["storage", "osaka"], { ...storage, prefectureSlug: "osaka", dams: [] });
    const { router, history } = await renderPage("?storage=true", client);
    await screen.findByText("4基のダム / 全6基");
    await act(async () => {
      await router.navigate({
        from: "/prefecture/$prefectureSlug",
        to: "/prefecture/$prefectureSlug",
        params: { prefectureSlug: "osaka" },
        search: {
          obs: false,
          storage: true,
          group: "waterSystem",
          purposes: "",
          types: "",
          q: "",
          view: "grid",
          sort: "name",
          order: "asc",
        },
      });
    });
    await screen.findByRole("heading", { name: "大阪府", level: 1 });
    await screen.findByText("1基のダム");
    await waitFor(() => expect(history.location.search).toContain("storage=false"));
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
    expectDam("大阪ダム", true);
    expect(history.length).toBe(2);
    await act(async () => history.back());
    await screen.findByRole("heading", { name: "東京都", level: 1 });
    await screen.findByText("4基のダム / 全6基");
    expect(screen.getByRole("switch", { name: "貯水率あり" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(history.location.search).toContain("storage=true");
    await act(async () => history.forward());
    await screen.findByRole("heading", { name: "大阪府", level: 1 });
    await screen.findByText("1基のダム");
    expect(screen.queryByRole("switch", { name: "貯水率あり" })).toBeNull();
    expect(history.location.search).toContain("storage=false");
  });
});
