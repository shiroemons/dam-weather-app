import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function DamSearchInput({ value, onChange }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const isComposing = useRef(false);

  useEffect(() => {
    if (!isComposing.current) {
      setLocalValue(value);
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (!isComposing.current) {
      onChange(newValue);
    }
  }

  function handleCompositionStart(): void {
    isComposing.current = true;
  }

  function handleCompositionEnd(e: React.CompositionEvent<HTMLInputElement>): void {
    isComposing.current = false;
    onChange(e.currentTarget.value);
  }

  function handleClear(): void {
    setLocalValue("");
    onChange("");
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <Search size={16} className="text-gray-400" />
      </span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="ダム名で検索..."
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
      />
      {localValue !== "" && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-3 flex items-center"
        >
          <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
      )}
    </div>
  );
}
