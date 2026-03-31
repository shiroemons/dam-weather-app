export const DAM_TYPE_UNSET = "未設定";

export const DAM_TYPES = [
  { label: "アース", short: "E" },
  { label: "重力式コンクリート", short: "G" },
  { label: "ロックフィル", short: "R" },
  { label: "アーチ", short: "A" },
  { label: "重力式コンクリート・フィル複合", short: "GF" },
  { label: "フローティングゲート", short: "FG" },
  { label: "アスファルトフェイシング", short: "AF" },
  { label: "中空重力式コンクリート", short: "HG" },
  { label: "重力式アーチ", short: "GA" },
  { label: "台形CSG", short: "CSG" },
  { label: "バットレス", short: "B" },
  { label: "マルティプルアーチ", short: "MA" },
  { label: "アスファルトコア", short: "AC" },
  { label: "未設定", short: "NA" },
] as const;

export type DamType = (typeof DAM_TYPES)[number]["label"];

export const DAM_TYPE_LABEL_TO_SHORT = new Map<string, string>(
  DAM_TYPES.map(({ label, short }) => [label, short]),
);

export const DAM_TYPE_SHORT_TO_LABEL = new Map<string, string>(
  DAM_TYPES.map(({ label, short }) => [short, label]),
);
