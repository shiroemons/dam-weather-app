# ダム天気アプリ

[![Site](https://img.shields.io/badge/Site-japan--dam--weather.pages.dev-blue)](https://japan-dam-weather.pages.dev/)

全国のダム所在地の天気を都道府県ごとに確認できるWebアプリ

## 概要

全国約2,700基のダム所在地の天気を、都道府県別一覧・地図・個別ダム詳細など多角的に確認できます。天気データはGitHub Actionsで8時間ごとに自動更新されます。

## 主な機能

- 都道府県別のダム天気一覧表示
- 今日のダム天気サマリー（地方別の天気分布）
- ダム詳細ページ（個別ダムの天気情報）
- ダムマップ（Leaflet地図上でダムの位置と天気を確認）
- 今日・明日の天気（アイコン・気温・降水確率・降水量）
- ダム型式・用途フィルター、水系別/市区町村別グループ化
- ダムのソート機能（名前順、水系順、貯水率順など）
- 貯水量データ表示（貯水位・貯水量・貯水率・流入量・放流量）
- ウォッチリスト機能（お気に入りダムリストの作成・管理、インポート/エクスポート、ドラッグ＆ドロップ並び替え）
- 用語集ページ（ダム関連用語の解説）
- レスポンシブ対応（PC・モバイル）
- ダーク/ライトテーマ切り替え
- SEO対応（JSON-LD構造化データ、プリレンダリング、サイトマップ自動生成）

## 技術スタック

| カテゴリ           | 技術                                     |
| ------------------ | ---------------------------------------- |
| ツールチェーン     | [VitePlus](https://viteplus.dev/) (`vp`) |
| フレームワーク     | React                                    |
| 言語               | TypeScript                               |
| ルーティング       | TanStack Router                          |
| スタイリング       | Tailwind CSS                             |
| データフェッチ     | TanStack Query                           |
| 地図               | Leaflet / React Leaflet                  |
| アイコン           | Lucide React / Meteocons                 |
| ドラッグ＆ドロップ | @dnd-kit                                 |
| エラーハンドリング | react-error-boundary                     |
| テスト             | Vitest                                   |
| デプロイ           | Cloudflare Pages                         |
| CI/CD              | GitHub Actions                           |

## データソース

- **ダムデータ**: [国土数値情報 ダムデータ（W01）](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-W01.html)（約2,700基）
- **天気データ**: [Open-Meteo API](https://open-meteo.com/)（各ダムの緯度経度からピンポイント天気を取得、GitHub Actionsで8時間ごとに更新）
- **貯水量データ**: 国土交通省 川の防災情報（ダム諸量データ、GitHub Actionsで8時間ごとに更新）

## セットアップ

### 前提条件

- VitePlus (`vp`) がインストール済み

```bash
curl -fsSL https://vite.plus | bash
```

### インストール

```bash
git clone https://github.com/shiroemons/dam-weather-app.git
cd dam-weather-app
vp install
```

### 開発サーバー起動

```bash
vp dev
```

### ビルド

```bash
vp build
```

### テスト

```bash
vp test
```

### リント & フォーマット

```bash
vp check    # リント + フォーマット + 型チェック
vp lint     # リントのみ
vp fmt      # フォーマットのみ
```

## URL設計

| パス                           | 画面                                                |
| ------------------------------ | --------------------------------------------------- |
| `/`                            | ランディングページ                                  |
| `/today`                       | 今日のダム天気（地方別サマリー）                    |
| `/map`                         | ダムマップ（地図表示）                              |
| `/prefecture`                  | 都道府県一覧                                        |
| `/prefecture/{prefectureSlug}` | 都道府県別ダム天気一覧（例: `/prefecture/fukuoka`） |
| `/dam/{damId}`                 | ダム詳細ページ                                      |
| `/watchlist`                   | ウォッチリスト一覧                                  |
| `/watchlist/{listId}`          | ウォッチリスト詳細（例: `/watchlist/abc123`）       |
| `/glossary`                    | ダム用語集                                          |
| `/about`                       | このサイトについて                                  |

## アーキテクチャ

### データ取得・ビルドフロー

```
GitHub Actions (8時間ごと、1日3回)
  │
  ├─ 全ダムの緯度経度をOpen-Meteo APIにバルクリクエスト
  │   （近接ダムは座標を丸めて重複排除、約2,600地点）
  ├─ 都道府県別JSONに整形して public/weather/{slug}.json に保存
  ├─ 国土交通省 川の防災情報からダム貯水量を取得
  │   → public/storage/{slug}.json に保存
  ├─ サイトマップ生成 + TypeScript型チェック
  ├─ vp build
  ├─ 主要ページをプリレンダリング
  └─ Cloudflare Pages にデプロイ
```

```
Cloudflare Workers Scheduler
  └─ Cron (0 */8 * * *) → GitHub Actions ワークフローをトリガー
```

### ディレクトリ構成

```
dam-weather-app/
├── .github/workflows/     # CI/CD（データ取得 + ビルド + デプロイ）
├── scripts/               # データ取得・サイトマップ生成スクリプト
├── workers/scheduler/     # Cloudflare Workers（スケジューラー）
├── public/
│   ├── data/dams/         # 都道府県別ダムデータ（ビルド時生成）
│   ├── weather/           # 都道府県別天気データ（8時間ごと更新）
│   └── storage/           # 都道府県別貯水量データ（8時間ごと更新）
├── src/
│   ├── components/
│   │   ├── common/        # 共通コンポーネント
│   │   ├── dam/           # ダムカード・フィルター・ソート
│   │   ├── landing/       # ランディングページ
│   │   ├── layout/        # ヘッダー・フッター
│   │   ├── map/           # 地図表示
│   │   ├── prefecture/    # 都道府県カード
│   │   ├── today/         # 今日の天気サマリー
│   │   ├── watchlist/     # ウォッチリスト管理
│   │   └── weather/       # 天気表示
│   ├── config/            # SEO・テーマ設定
│   ├── contexts/          # React Context（テーマ・ウォッチリスト）
│   ├── data/              # ダムデータ（静的JSON）
│   ├── hooks/             # カスタムフック
│   ├── lib/               # ユーティリティ
│   ├── routes/            # ページルーティング
│   └── types/             # 型定義
├── docs/                  # ドキュメント
└── README.md
```

## ドキュメント

- [要件定義書](docs/requirements.md)

## ライセンス

- ダムデータ: 国土数値情報（非商用利用）
- 天気データ: [Open-Meteo](https://open-meteo.com/)（非商用利用、APIキー不要）
- 天気アイコン: [Meteocons](https://github.com/basmilius/weather-icons) by Bas Milius

天気と貯水率は、どちらも日本時間1時・9時・17時の1日3回に更新します。mainへのcron設定変更時は、既存Workerの登録時刻を反映・読み戻し検証してからデータを再取得します。既存tokenの権限不足などで反映できない場合は取得前に停止します。

### 天気更新の失敗・復旧

- API取得は500地点ずつ、バッチ間と再試行前に最低61秒待ちます。各バッチの試行は最大3回です。429の `Retry-After`（秒数・HTTP-date）を尊重し、120秒を超える待機や時間・日・月単位の制限では追加リクエストを止めます
- 通信失敗、短い応答、日付や必須フィールドの欠落は取得失敗です。天気コードの欠落を晴れ（0）に置き換えません
- 取得失敗が残れば `public/weather/_failed.json` に座標を保存し、終了コード1でビルド・デプロイを停止します。成功時も独立した検証ステップで全ダム・全都道府県・日本時間の当日/翌日の予報を確認します
- 待機を含むジョブの上限は25分です。APIが復旧しない場合は失敗で終了し、公開済みサイトは更新しません

同じ作業ディレクトリに当日取得したファイルと `_failed.json` が残っている場合は、制限が解除されてから不足地点だけ再取得できます。

```bash
vp dlx tsx scripts/fetch-weather.ts --retry
vp dlx tsx scripts/validate-weather.ts
```

`--retry` も全データの検証に通るまで失敗扱いです。前日以前のデータやファイルのない新しいチェックアウトでは、通常の全件取得を行ってください。`--limit N` はローカル確認用です。全件未満の出力は、配信前の全件検証を通りません。

```bash
vp dlx tsx scripts/fetch-weather.ts
vp dlx tsx scripts/validate-weather.ts
```

GitHub Actionsの失敗した実行は作業ファイルを次の実行へ引き継ぎません。修正のマージ後、承認した通常更新で全件を再取得してください。復旧のためにデプロイ条件を外したり、不足データで手動デプロイしたりしないでください。APIの無料枠には分・時・日単位の上限があるため、待機だけで日次上限が解消することはありません（[Open-Meteoの上限](https://open-meteo.com/en/pricing)）。
