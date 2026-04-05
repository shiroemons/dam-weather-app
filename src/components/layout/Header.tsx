import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Droplets, Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-surface-primary">
      <nav className="mx-auto flex h-14 max-w-(--width-content) items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-text-primary"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm">
              <Droplets className="size-4" />
            </div>
            日本のダム天気
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeProps={{
                  className: "bg-accent-subtle text-accent",
                  "aria-current": "page" as const,
                }}
                inactiveProps={{
                  className:
                    "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
                }}
                className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
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
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:text-text-primary sm:hidden"
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
          <div className="border-t border-border-primary bg-surface-primary">
            <div className="mx-auto max-w-(--width-content) space-y-1 px-4 py-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    className: "bg-accent-subtle text-accent",
                    "aria-current": "page" as const,
                  }}
                  inactiveProps={{
                    className:
                      "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                  }}
                  className="block rounded-md px-3 py-2 text-sm font-medium transition-colors"
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
