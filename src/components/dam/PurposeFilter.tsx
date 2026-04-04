import { DAM_PURPOSES, PURPOSE_SHORT_MAP } from "@/data/purposes";

type Props = {
  selected: Set<string>;
  available: string[];
  onChange: (selected: Set<string>) => void;
};

export default function PurposeFilter({ selected, available, onChange }: Props) {
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
      {DAM_PURPOSES.filter((p) => availableSet.has(p.label)).map((purpose) => {
        const isSelected = selected.has(purpose.label);
        const short = PURPOSE_SHORT_MAP.get(purpose.label);
        return (
          <button
            key={purpose.code}
            type="button"
            onClick={() => handleToggle(purpose.label)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-amber-500 text-white dark:bg-amber-700"
                : "bg-white text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {purpose.label} ({short})
          </button>
        );
      })}
    </div>
  );
}
