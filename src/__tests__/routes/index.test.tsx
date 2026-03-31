import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getRegionsWithPrefectures, PREFECTURES, REGIONS } from "@/data/prefectures";
import PrefectureGrid from "@/components/prefecture/PrefectureGrid";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("トップページ", () => {
  describe("都道府県データ", () => {
    it("47都道府県が存在する", () => {
      expect(PREFECTURES).toHaveLength(47);
    });

    it("8地方に分類される", () => {
      expect(REGIONS).toHaveLength(8);
      expect(REGIONS).toEqual([
        "北海道",
        "東北",
        "関東",
        "中部",
        "近畿",
        "中国",
        "四国",
        "九州・沖縄",
      ]);
    });

    it("全都道府県がいずれかの地方に属する", () => {
      const regions = getRegionsWithPrefectures();
      const totalPrefectures = regions.reduce((sum, r) => sum + r.prefectures.length, 0);
      expect(totalPrefectures).toBe(47);
    });

    it("各都道府県に必須フィールドが存在する", () => {
      for (const pref of PREFECTURES) {
        expect(pref.code).toBeTruthy();
        expect(pref.name).toBeTruthy();
        expect(pref.slug).toBeTruthy();
        expect(pref.region).toBeTruthy();
        expect(pref.damCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("PrefectureGrid", () => {
    it("地方名を見出しとして表示する", () => {
      const regions = getRegionsWithPrefectures();
      const { region, prefectures } = regions[0];
      render(<PrefectureGrid region={region} prefectures={prefectures} />);
      expect(screen.getByRole("heading", { name: "北海道" })).toBeInTheDocument();
    });

    it("各地方の都道府県をすべて表示する", () => {
      const regions = getRegionsWithPrefectures();
      for (const { region, prefectures } of regions) {
        const { unmount } = render(<PrefectureGrid region={region} prefectures={prefectures} />);
        for (const pref of prefectures) {
          expect(screen.getAllByText(pref.name).length).toBeGreaterThanOrEqual(1);
        }
        unmount();
      }
    });

    it("各都道府県のダム数を表示する", () => {
      const regions = getRegionsWithPrefectures();
      const { region, prefectures } = regions[2]; // 関東
      render(<PrefectureGrid region={region} prefectures={prefectures} />);
      expect(screen.getByText("8基")).toBeInTheDocument();
    });
  });
});
