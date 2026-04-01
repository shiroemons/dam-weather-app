import { Link } from "@tanstack/react-router";
import ThemeSwitcher from "./ThemeSwitcher";

const NAV_LINKS = [
  { to: "/prefecture", label: "都道府県" },
  { to: "/map", label: "マップ" },
  { to: "/today", label: "今日の天気" },
  { to: "/about", label: "About" },
] as const;

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-slate-50/80 backdrop-blur-md dark:border-gray-700/80 dark:bg-gray-900/80">
      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100"
          >
            日本のダム天気
          </Link>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeProps={{ className: "text-sky-600 dark:text-sky-400" }}
                className="rounded-md px-2.5 py-1 text-sm text-gray-600 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <ThemeSwitcher />
      </nav>
    </header>
  );
}
