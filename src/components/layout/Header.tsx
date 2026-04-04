import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";

const NAV_LINKS = [
  { to: "/prefecture", label: "都道府県" },
  { to: "/map", label: "マップ" },
  { to: "/today", label: "今日の天気" },
  { to: "/watchlist", label: "マイリスト" },
  { to: "/glossary", label: "用語解説" },
  { to: "/about", label: "About" },
] as const;

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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
          <div className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeProps={{
                  className: "text-sky-600 dark:text-sky-400",
                  "aria-current": "page" as const,
                }}
                className="rounded-md px-2.5 py-1 text-sm text-gray-600 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:text-sky-600 sm:hidden dark:text-gray-400 dark:hover:text-sky-400"
            aria-label="メニュー"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <div
        className={`grid transition-[grid-template-rows] duration-200 sm:hidden ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-200/80 bg-slate-50/95 backdrop-blur-md dark:border-gray-700/80 dark:bg-gray-900/95">
            <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    className: "text-sky-600 dark:text-sky-400",
                    "aria-current": "page" as const,
                  }}
                  className="block rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-sky-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-sky-400"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
