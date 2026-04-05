import { Link } from "@tanstack/react-router";

import { getRegionsWithPrefectures } from "../../data/prefectures";

const regionsWithPrefectures = getRegionsWithPrefectures();

export default function Footer() {
  return (
    <footer className="border-t border-border-primary bg-surface-primary">
      <div className="mx-auto max-w-(--width-content) px-4 sm:px-6 lg:px-8">
        <details className="group py-8">
          <summary className="cursor-pointer list-none text-sm font-semibold text-text-primary">
            <span className="flex items-center gap-2">
              都道府県一覧
              <svg
                className="size-4 text-text-tertiary transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>
          <nav aria-label="都道府県一覧" className="mt-6">
            <div className="grid grid-cols-4 gap-x-3 gap-y-4 sm:gap-6">
              {regionsWithPrefectures.map(({ region, prefectures }) => (
                <div key={region}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-text-primary">
                    {region}
                  </h3>
                  <ul>
                    {prefectures.map((pref) => (
                      <li key={pref.code}>
                        <Link
                          to="/prefecture/$prefectureSlug"
                          params={{ prefectureSlug: pref.slug }}
                          search={{
                            obs: true,
                            group: "waterSystem",
                            purposes: "",
                            types: "",
                            q: "",
                            view: "grid",
                            sort: "name",
                            order: "asc",
                          }}
                          className="block py-1 text-xs text-text-tertiary transition-colors hover:text-accent"
                        >
                          {pref.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </details>

        <div className="flex flex-col items-center gap-4 border-t border-border-primary py-6 md:flex-row md:justify-between">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/prefecture"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              都道府県
            </Link>
            <Link
              to="/map"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              マップ
            </Link>
            <Link
              to="/today"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              今日の天気
            </Link>
            <Link
              to="/watchlist"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              マイリスト
            </Link>
            <Link
              to="/glossary"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              用語解説
            </Link>
            <Link
              to="/about"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              このサイトについて
            </Link>
          </div>
          <div className="text-center text-xs text-text-tertiary md:text-right">
            <p>データ出典: 国土数値情報（国土交通省）・Open-Meteo</p>
            <p className="mt-1">© {new Date().getFullYear()} 日本のダム天気</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
