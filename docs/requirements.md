# ダム天気アプリ 要件定義書

## 1. プロジェクト概要

- **アプリ名**: ダム天気アプリ（dam-weather-app）
- **概要**: 全国のダム所在地の天気を都道府県ごとに確認できるWebアプリ
- **利用用途**: 個人・非商用
- **ユーザー操作フロー**: トップページ（都道府県選択） → `/{prefecture_slug}` で県内のダム一覧をカード型UIで表示 → 各カードにダムの天気情報を表示

## 2. 技術スタック

すべて最新版を使用する。

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| ツールチェーン | VitePlus (`vp`) | Vite + Vitest + Oxlint + Oxfmt を統合 |
| フレームワーク | React | `vp create` でセットアップ |
| 言語 | TypeScript | 型安全な開発 |
| ルーティング | TanStack Router | 型安全なファイルベースルーティング |
| スタイリング | Tailwind CSS | ユーティリティファーストCSS |
| データフェッチ | TanStack Query | 静的JSONの読み込み管理 |
| テスト | Vitest (VitePlus内蔵) | `vp test` で実行 |
| リント | Oxlint (VitePlus内蔵) | `vp lint` で実行 |
| フォーマット | Oxfmt (VitePlus内蔵) | `vp fmt` で実行 |
| デプロイ | Cloudflare Pages | 静的サイトホスティング |
| CI/CD | GitHub Actions | 天気データ取得 + ビルド + デプロイ |

## 3. データソース

### 3.1 ダムデータ（静的JSON）

- **ソース**: 国土数値情報 ダムデータ（W01）2014年版
- **ライセンス**: 非商用利用
- **データ件数**: 約2,700基（全ダム）
- **フィルタ機能**: UIで「主要ダムのみ」に絞り込み可能
- **主要ダムの定義**: 堤高15m以上、または総貯水量が一定以上のダムをフラグ付け
- **含めるフィールド**:
  - ダム名（damName）
  - 都道府県（prefecture）
  - 都道府県スラッグ（prefectureSlug）← URLパス用（例: fukuoka）
  - 緯度・経度（latitude, longitude）
  - ダム種別（damType）
  - 河川名（riverName）
  - 総貯水量（totalStorageCapacity）
  - 堤高（damHeight）
  - 竣工年（completionYear）
  - 気象庁地域コード（jmaAreaCode）← 事前マッピング済み
  - 主要ダムフラグ（isMajor）

### 3.2 天気データ（GitHub Actions SSG方式）

- **データソース**: 気象庁API
  - 予報: `https://www.jma.go.jp/bosai/forecast/data/forecast/{area_code}.json`
  - 地域定義: `https://www.jma.go.jp/bosai/common/const/area.json`
- **取得方式**: GitHub Actionsで1日2回（6:00, 12:00 JST）取得
- **保存形式**: 都道府県ごとの静的JSONファイル（`public/weather/{prefecture_slug}.json`）
- **フロー**:
  1. GitHub Actions が気象庁APIから全都道府県の天気データを取得
  2. パース・整形して都道府県別JSONとして保存
  3. Viteビルド
  4. Cloudflare Pagesにデプロイ
- **メリット**: ユーザーのブラウザからAPIアクセス不要、CORS問題なし、高速表示

## 4. 機能要件（MVP）

| ID | 機能 | 説明 |
|----|------|------|
| F-01 | 都道府県選択 | トップページで47都道府県から選択。URLは `/{slug}` 形式 |
| F-02 | ダム一覧表示 | 選択した都道府県のダムをカード型UIで一覧表示 |
| F-03 | 主要ダムフィルタ | 全ダム/主要ダムのみの表示切替トグル |
| F-04 | 今日・明日の天気表示 | 天気アイコン + 最高/最低気温 + 降水確率 |
| F-05 | 週間予報表示 | 7日間の天気予報（アイコン + 気温 + 降水確率） |
| F-06 | レスポンシブ対応 | PC・モバイル両方で快適に閲覧可能 |

## 5. 非機能要件

| カテゴリ | 要件 |
|---------|------|
| パフォーマンス | 初期表示 3秒以内（LTE環境） |
| デザイン | Apple風のスタイリッシュなUI（ミニマル、余白、タイポグラフィ重視） |
| UI柔軟性 | テーマ・カラー等をデータ構造で管理し、変更容易にする |
| アクセシビリティ | セマンティックHTML、適切なaria属性 |
| ブラウザ対応 | Chrome, Safari, Firefox 最新版 |
| エラーハンドリング | 天気データ未取得時にフォールバックUI表示 |
| データ鮮度 | 天気データは1日2回更新（GitHub Actionsビルド時） |

## 6. URL設計

| パス | 画面 | 説明 |
|------|------|------|
| `/` | トップ | 都道府県一覧（地方別グループ） |
| `/{prefecture_slug}` | 都道府県ダム一覧 | 例: `/fukuoka`, `/tokyo` |

## 7. 画面構成

### 7.1 トップページ（`/`）

```
┌──────────────────────────────────────────┐
│  ダム天気                                  │
│  全国のダムの天気をチェック                    │
├──────────────────────────────────────────┤
│                                          │
│  北海道・東北                               │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 北海道  │ │ 青森県  │ │ 岩手県  │       │
│  │ 120基   │ │ 25基   │ │ 18基   │       │
│  └────────┘ └────────┘ └────────┘       │
│                                          │
│  関東                                     │
│  ┌────────┐ ┌────────┐ ...              │
│  │ 東京都  │ │ 神奈川  │                   │
│  └────────┘ └────────┘                   │
│  ...                                     │
└──────────────────────────────────────────┘
```

### 7.2 都道府県ページ（`/{prefecture_slug}`）

```
┌──────────────────────────────────────────┐
│  ← 戻る    福岡県のダム天気                  │
├──────────────────────────────────────────┤
│  [□ 主要ダムのみ]          更新: 3/30 12:00 │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐ ┌──────────────┐      │
│  │ 南畑ダム       │ │ 鳴淵ダム      │      │
│  │ 那珂川 | ロックフィル│ │ 鳴淵川 | 重力式  │      │
│  │                │ │              │      │
│  │  今日    明日   │ │  今日    明日  │      │
│  │  ☀ 22℃  ☁ 18℃│ │  ☀ 22℃  ☁ 18℃│      │
│  │  10/15℃  8/13℃│ │  10/15℃  8/13℃│      │
│  │  降水 10% 30%  │ │  降水 10% 30% │      │
│  │                │ │              │      │
│  │  ▼ 週間予報     │ │  ▼ 週間予報    │      │
│  └──────────────┘ └──────────────┘      │
│                                          │
└──────────────────────────────────────────┘
```

**構成要素**:

- **ヘッダー**: 戻るリンク + 都道府県名
- **フィルタバー**: 主要ダムフィルタトグル + 更新日時
- **ダムカードグリッド**: レスポンシブグリッド（PC: 3列、タブレット: 2列、モバイル: 1列）
- **カード内容**: ダム名、河川名 | ダム種別、今日/明日の天気（アイコン+気温+降水確率）、週間予報（展開式アコーディオン）

## 8. データモデル

```typescript
// === テーマ・UI設定（変更容易なデータ構造） ===
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: number;
    bodyWeight: number;
  };
  spacing: {
    cardGap: string;
    sectionGap: string;
    pagePadding: string;
  };
  borderRadius: {
    card: string;
    button: string;
  };
}

// === ダムデータ（静的JSON） ===
interface Dam {
  id: string;
  damName: string;
  prefecture: string;
  prefectureSlug: string;
  prefectureCode: string;
  latitude: number;
  longitude: number;
  damType: string;
  riverName: string;
  totalStorageCapacity: number | null;
  damHeight: number | null;
  completionYear: number | null;
  jmaAreaCode: string;
  jmaForecastCode: string;
  isMajor: boolean;
}

// === 都道府県定義 ===
interface Prefecture {
  code: string;
  name: string;
  slug: string;
  region: string;
  damCount: number;
}

// === 天気データ（SSG済み静的JSON） ===
interface DayForecast {
  date: string;
  weatherCode: string;
  weather: string;
  tempMax: string | null;
  tempMin: string | null;
  precipProbability: string | null;
}

interface WeeklyForecast {
  date: string;
  weatherCode: string;
  tempMax: string;
  tempMin: string;
  reliability: string;
}

interface AreaWeather {
  areaCode: string;
  areaName: string;
  today: DayForecast;
  tomorrow: DayForecast;
  weekly: WeeklyForecast[];
  publishedAt: string;
}

// 都道府県別天気ファイルの構造
interface PrefectureWeather {
  prefectureSlug: string;
  updatedAt: string;
  areas: AreaWeather[];
}
```

## 9. 天気データ連携仕様

| 項目 | 内容 |
|------|------|
| 取得方式 | GitHub Actions SSG（1日2回ビルド） |
| 取得単位 | JMA officeコード単位（都道府県に対応） |
| 保存先 | `public/weather/{prefecture_slug}.json` |
| 天気アイコン | weatherCodeからSVGアイコンにマッピング |
| エラー時 | 前回のJSONを維持（ビルド失敗時はデプロイしない） |

## 10. ダム→天気マッピング方針

- ダムの座標（緯度・経度）から最寄りの気象庁予報地域（class10s）を事前に特定
- マッピング結果をダムJSONの `jmaAreaCode` と `jmaForecastCode` に格納
- ランタイムでの座標計算は不要
- 同一地域のダムは同じ天気データを共有

## 11. GitHub Actions ワークフロー

```yaml
# .github/workflows/update-weather.yml
name: Update Weather Data
on:
  schedule:
    - cron: '0 21 * * *'    # 6:00 JST
    - cron: '0 3 * * *'     # 12:00 JST
  workflow_dispatch:          # 手動実行

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      # 1. 全都道府県の気象庁APIからデータ取得
      # 2. パース・整形して public/weather/{slug}.json に保存
      # 3. vp build
      # 4. Cloudflare Pages にデプロイ
```

## 12. ディレクトリ構成

```
dam-weather-app/
├── .github/
│   └── workflows/
│       └── update-weather.yml
├── scripts/
│   └── fetch-weather.ts
├── public/
│   └── weather/
│       ├── hokkaido.json
│       ├── tokyo.json
│       └── ...
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── dam/
│   │   │   ├── DamCard.tsx
│   │   │   ├── DamCardGrid.tsx
│   │   │   └── FilterToggle.tsx
│   │   ├── weather/
│   │   │   ├── WeatherIcon.tsx
│   │   │   ├── DayWeather.tsx
│   │   │   └── WeeklyForecast.tsx
│   │   └── prefecture/
│   │       ├── PrefectureCard.tsx
│   │       └── PrefectureGrid.tsx
│   ├── config/
│   │   └── theme.ts
│   ├── data/
│   │   ├── dams.json
│   │   └── prefectures.ts
│   ├── hooks/
│   │   ├── useWeather.ts
│   │   └── useDams.ts
│   ├── lib/
│   │   └── weatherCodes.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   └── $prefectureSlug.tsx
│   ├── types/
│   │   ├── dam.ts
│   │   ├── weather.ts
│   │   └── theme.ts
│   └── main.tsx
├── docs/
│   └── requirements.md
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 13. 今後の拡張候補（MVP後）

- ダム名検索機能
- お気に入りダム機能（localStorage）
- 地図表示（Leaflet等）
- PWA対応（オフライン閲覧）
- ダム貯水率データ連携
- ダークモード対応
- ダム詳細ページ（`/{prefecture_slug}/{dam_id}`）
