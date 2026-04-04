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
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          <Icon className="size-5" />
        </button>
      ))}
    </div>
  );
}
