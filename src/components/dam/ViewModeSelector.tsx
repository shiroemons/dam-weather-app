import type { LucideIcon } from "lucide-react";
import { LayoutGrid, List } from "lucide-react";

import type { ViewMode } from "@/lib/sortDams";

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const options: { Icon: LucideIcon; mode: ViewMode; rounded: string }[] = [
  { Icon: LayoutGrid, mode: "grid", rounded: "rounded-l-md" },
  { Icon: List, mode: "list", rounded: "rounded-r-md" },
];

export default function ViewModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex">
      {options.map(({ Icon, mode, rounded }) => (
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
          <Icon className="size-5" />
        </button>
      ))}
    </div>
  );
}
