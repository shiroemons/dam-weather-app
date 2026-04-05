import type { GroupByMode } from "./DamGroupedGrid";

type Props = {
  value: GroupByMode;
  onChange: (mode: GroupByMode) => void;
};

const options: { label: string; mode: GroupByMode; rounded: string }[] = [
  { label: "水系", mode: "waterSystem", rounded: "rounded-l-md" },
  { label: "市区町村", mode: "municipality", rounded: "rounded-r-md" },
];

export default function GroupBySelector({ value, onChange }: Props) {
  return (
    <div className="flex">
      {options.map(({ label, mode, rounded }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-3 py-1 text-sm font-medium transition-colors ${rounded} ${
            value === mode
              ? "bg-accent text-white"
              : "border border-border-primary bg-surface-secondary text-text-secondary hover:bg-border-primary"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
