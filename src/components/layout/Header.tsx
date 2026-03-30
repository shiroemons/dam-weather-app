import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-12 max-w-5xl items-center px-4 sm:px-6">
        <Link to="/" className="text-base font-semibold tracking-tight text-gray-900">
          ダム天気
        </Link>
      </nav>
    </header>
  );
}
