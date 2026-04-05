import { Tag } from "lucide-react";

import GlossarySection from "./GlossarySection";

export default function DamSuffixesSection() {
  return (
    <GlossarySection
      id="suffixes"
      icon={<Tag className="h-5 w-5 text-purple-500" />}
      title="ダム名のサフィックス"
      description="アプリ内のダムデータには以下のサフィックスが付いているものがあります。"
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">（元）・（再）</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          ダムの再開発事業に関連する区分です。再開発とは、既存ダムの堤体嵩上げ・放流設備の増設・貯水池の掘削などにより、ダムの機能を向上させる事業のことです。
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  サフィックス
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  意味
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  説明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">（再）</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">再開発後のダム</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">現在運用中の施設</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">（元）</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">再開発前のダム</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  再開発前の旧施設データ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <p>例: 鶴田ダム</p>
          <p>・鶴田（元） — 竣工1965年。再開発前の旧ダムデータ</p>
          <p>・鶴田（再） — 竣工2015年。再開発後の現行ダム</p>
          <p>
            同じ場所にある同じダムですが、国交省のデータベース上では事業として区別されています。
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">付帯施設</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          メインダムに付随する施設です。
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  名称
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  説明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">副ダム</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  本ダムの下流に設置される小規模なダム。減勢（水の勢いを弱める）が目的
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">脇ダム</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  ダム湖の周囲の低い尾根部分を塞ぐために設けられるダム
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">鞍部ダム</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  脇ダムと同様、ダム湖周囲の鞍部（尾根の低い部分）を塞ぐダム
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">調整池</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  ダムから供給された水を一時的に貯留し、配水量を調整する施設
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </GlossarySection>
  );
}
