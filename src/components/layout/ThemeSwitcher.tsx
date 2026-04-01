import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

type ThemePreference = "system" | "light" | "dark";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "システム", Icon: Monitor },
  { value: "light", label: "ライト", Icon: Sun },
  { value: "dark", label: "ダーク", Icon: Moon },
];

export default function ThemeSwitcher() {
  const { preference, resolved, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CurrentIcon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
        aria-label="テーマを切り替え"
      >
        <CurrentIcon className="size-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 py-1 dark:bg-gray-800 dark:ring-gray-700">
          {OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPreference(value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                preference === value
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
