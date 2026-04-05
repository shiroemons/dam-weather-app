import { DAM_TYPES } from "@/data/damTypes";

type Props = {
  selected: Set<string>;
  available: string[];
  onChange: (selected: Set<string>) => void;
};

export default function DamTypeFilter({ selected, available, onChange }: Props) {
  const availableSet = new Set(available);

  function handleToggle(label: string): void {
    const next = new Set(selected);
    if (next.has(label)) {
      next.delete(label);
    } else {
      next.add(label);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DAM_TYPES.filter((d) => availableSet.has(d.label)).map((damType) => {
        const isSelected = selected.has(damType.label);
        return (
          <button
            key={damType.short}
            type="button"
            onClick={() => handleToggle(damType.label)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-accent text-white"
                : "bg-surface-primary text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            {damType.label}
          </button>
        );
      })}
    </div>
  );
}
