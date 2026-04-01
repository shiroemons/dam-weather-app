import { Link } from "@tanstack/react-router";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md dark:border-gray-700/80 dark:bg-gray-900/80">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/prefecture"
          className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100"
        >
          ダム天気
        </Link>
        <ThemeSwitcher />
      </nav>
    </header>
  );
}
