import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterToggle from "@/components/dam/FilterToggle";
import DamCardGrid from "@/components/dam/DamCardGrid";
import DamCard from "@/components/dam/DamCard";
import type { Dam } from "@/types/dam";

const mockDam: Dam = {
  id: "dam-1",
  damName: "テストダム",
  prefecture: "東京都",
  prefectureSlug: "tokyo",
  prefectureCode: "13",
  latitude: 35.68,
  longitude: 139.76,
  damType: "重力式コンクリート",
  riverName: "多摩川",
  totalStorageCapacity: 10000,
  damHeight: 50,
  completionYear: 2000,
  address: "東京都西多摩郡奥多摩町",
  municipality: "西多摩郡奥多摩町",
  isMajor: true,
};

const mockMajorDam: Dam = { ...mockDam, id: "dam-1", damName: "主要ダム", isMajor: true };
const mockMinorDam: Dam = { ...mockDam, id: "dam-2", damName: "副次ダム", isMajor: false };

describe("都道府県ページ", () => {
  describe("FilterToggle", () => {
    it("「主要ダムのみ」ラベルを表示する", () => {
      render(<FilterToggle enabled={false} onChange={() => {}} />);
      expect(screen.getByText("主要ダムのみ")).toBeInTheDocument();
    });

    it("スイッチの状態がaria-checkedに反映される", () => {
      const { rerender } = render(<FilterToggle enabled={false} onChange={() => {}} />);
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
      rerender(<FilterToggle enabled={true} onChange={() => {}} />);
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    it("クリックでonChangeが呼ばれる", async () => {
      const onChange = vi.fn();
      render(<FilterToggle enabled={false} onChange={onChange} />);
      await userEvent.click(screen.getByRole("switch"));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("有効時のクリックでfalseが渡される", async () => {
      const onChange = vi.fn();
      render(<FilterToggle enabled={true} onChange={onChange} />);
      await userEvent.click(screen.getByRole("switch"));
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe("DamCardGrid", () => {
    it("ダムが0件の場合メッセージを表示する", () => {
      render(<DamCardGrid dams={[]} weather={undefined} />);
      expect(screen.getByText("ダムが見つかりません")).toBeInTheDocument();
    });

    it("ダムカードを表示する", () => {
      render(<DamCardGrid dams={[mockMajorDam, mockMinorDam]} weather={undefined} />);
      expect(screen.getByText("主要ダム")).toBeInTheDocument();
      expect(screen.getByText("副次ダム")).toBeInTheDocument();
    });
  });

  describe("DamCard", () => {
    it("ダム名と基本情報を表示する", () => {
      render(<DamCard dam={mockDam} weather={undefined} />);
      expect(screen.getByText("テストダム")).toBeInTheDocument();
      expect(screen.getByText("多摩川")).toBeInTheDocument();
      expect(screen.getByText("重力式コンクリート")).toBeInTheDocument();
    });

    it("天気データなしの場合、メッセージを表示する", () => {
      render(<DamCard dam={mockDam} weather={undefined} />);
      expect(screen.getByText("天気情報を取得できません")).toBeInTheDocument();
    });
  });
});
