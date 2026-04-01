# ダム天気アプリ

[![Site](https://img.shields.io/badge/Site-japan--dam--weather.pages.dev-blue)](https://japan-dam-weather.pages.dev/)

全国のダム所在地の天気を都道府県ごとに確認できるWebアプリ

## 概要

都道府県を選択すると、その県内のダム一覧がカード型UIで表示され、各ダムの天気情報（今日・明日の天気・気温・降水確率・降水量）を確認できます。

## 主な機能

- 都道府県別のダム天気一覧表示
- 今日・明日の天気（アイコン・気温・降水確率・降水量）
- 主要ダム/全ダムの表示切替フィルタ
- レスポンシブ対応（PC・モバイル）

## 技術スタック

| カテゴリ       | 技術                                     |
| -------------- | ---------------------------------------- |
| ツールチェーン | [VitePlus](https://viteplus.dev/) (`vp`) |
| フレームワーク | React                                    |
| 言語           | TypeScript                               |
| ルーティング   | TanStack Router                          |
| スタイリング   | Tailwind CSS                             |
| データフェッチ | TanStack Query                           |
| テスト         | Vitest                                   |
| デプロイ       | Cloudflare Pages                         |
| CI/CD          | GitHub Actions                           |

## データソース

- **ダムデータ**: [国土数値情報 ダムデータ（W01）](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-W01.html)（約2,700基）
- **天気データ**: [Open-Meteo API](https://open-meteo.com/)（各ダムの緯度経度からピンポイント天気を取得、GitHub Actionsで1日2回更新）

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

| パス                       | 画面                                                 |
| -------------------------- | ---------------------------------------------------- |
| `/`                        | 都道府県一覧（トップ、`/prefecture` にリダイレクト） |
| `/prefecture`              | 都道府県一覧                                         |
| `/prefecture/{prefecture}` | 都道府県別ダム天気一覧（例: `/prefecture/fukuoka`）  |

## アーキテクチャ

### 天気データ取得フロー

```
GitHub Actions (1日2回: 6:00, 12:00 JST)
  │
  ├─ 全ダムの緯度経度をOpen-Meteo APIにバルクリクエスト
  │   （近接ダムは座標を丸めて重複排除、約2,600地点）
  ├─ 都道府県別JSONに整形して public/weather/{slug}.json に保存
  ├─ vp build
  └─ Cloudflare Pages にデプロイ
```

### ディレクトリ構成

```
dam-weather-app/
├── .github/workflows/     # CI/CD（天気データ取得 + ビルド + デプロイ）
├── scripts/               # Open-Meteo天気データ取得スクリプト
├── public/weather/        # SSG天気データ（ビルド時生成）
├── src/
│   ├── components/        # UIコンポーネント
│   ├── config/            # テーマ設定
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
