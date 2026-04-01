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
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {damType.label}
          </button>
        );
      })}
    </div>
  );
}
