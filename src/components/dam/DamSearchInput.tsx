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
        <Search size={16} className="text-text-tertiary" />
      </span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="ダム名で検索..."
        className="w-full rounded-lg border border-border-primary bg-surface-primary py-2 pl-9 pr-9 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {localValue !== "" && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-3 flex items-center"
        >
          <X size={16} className="text-text-tertiary hover:text-text-secondary" />
        </button>
      )}
    </div>
  );
}
