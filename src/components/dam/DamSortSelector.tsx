import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortDirection, SortField } from "@/lib/sortDams";

type Props = {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
};

const sortOptions: {
  label: string;
  field: SortField;
  defaultDir: SortDirection;
}[] = [
  { label: "ダム名", field: "name", defaultDir: "asc" },
  { label: "水系", field: "waterSystem", defaultDir: "asc" },
  { label: "河川", field: "river", defaultDir: "asc" },
  { label: "総貯水容量", field: "capacity", defaultDir: "desc" },
  { label: "貯水率", field: "rate", defaultDir: "desc" },
];

export default function DamSortSelector({ field, direction, onChange }: Props) {
  function handleClick(optField: SortField, defaultDir: SortDirection): void {
    if (optField === field) {
      onChange(field, direction === "asc" ? "desc" : "asc");
    } else {
      onChange(optField, defaultDir);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-text-secondary">並び替え:</span>
      {sortOptions.map(({ label, field: optField, defaultDir }) => {
        const isActive = optField === field;
        return (
          <button
            key={optField}
            type="button"
            onClick={() => handleClick(optField, defaultDir)}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-white"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-primary"
            }`}
          >
            {label}
            {isActive &&
              (direction === "asc" ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              ))}
          </button>
        );
      })}
    </div>
  );
}
