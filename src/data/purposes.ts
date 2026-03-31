export const DAM_PURPOSES = [
  { code: "1", label: "洪水調節・農地防災", short: "F" },
  { code: "2", label: "不特定用水・河川維持用水", short: "N" },
  { code: "3", label: "灌漑・特定灌漑用水", short: "A" },
  { code: "4", label: "上水道用水", short: "W" },
  { code: "5", label: "工業用水道用水", short: "I" },
  { code: "6", label: "発電", short: "P" },
  { code: "7", label: "消流雪用水", short: "S" },
  { code: "8", label: "レクリエーション", short: "R" },
] as const;

export type DamPurpose = (typeof DAM_PURPOSES)[number]["label"];

export const PURPOSE_SHORT_MAP = new Map<string, string>(
  DAM_PURPOSES.map(({ label, short }) => [label, short]),
);

export const PURPOSE_SHORT_TO_LABEL = new Map<string, string>(
  DAM_PURPOSES.map(({ label, short }) => [short, label]),
);
