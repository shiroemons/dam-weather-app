import { Link } from "@tanstack/react-router";

import { getRegionsWithPrefectures } from "../../data/prefectures";

const regionsWithPrefectures = getRegionsWithPrefectures();

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav aria-label="都道府県一覧" className="py-8">
          <h2 className="mb-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
            都道府県一覧
          </h2>
          <div className="grid grid-cols-4 gap-x-3 gap-y-4 sm:gap-6">
            {regionsWithPrefectures.map(({ region, prefectures }) => (
              <div key={region}>
                <h3 className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
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
                        className="block py-1 text-xs text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
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

        <div className="flex flex-col items-center gap-4 border-t border-gray-200 py-6 dark:border-gray-700">
          <div className="flex gap-4">
            <Link
              to="/prefecture"
              className="text-xs text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
            >
              都道府県
            </Link>
            <Link
              to="/map"
              className="text-xs text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
            >
              マップ
            </Link>
            <Link
              to="/today"
              className="text-xs text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
            >
              今日の天気
            </Link>
            <Link
              to="/watchlist"
              className="text-xs text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
            >
              マイリスト
            </Link>
            <Link
              to="/about"
              className="text-xs text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
            >
              このサイトについて
            </Link>
          </div>
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>データ出典: 国土数値情報（国土交通省）・Open-Meteo</p>
            <p className="mt-1">© {new Date().getFullYear()} 日本のダム天気</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
