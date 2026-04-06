# Open-Meteo API レート制限

## 概要

天気データ取得（`scripts/fetch-weather.ts`）で使用している Open-Meteo API のレート制限に関する情報。

公式ドキュメント:
- Terms: https://open-meteo.com/en/terms
- Pricing: https://open-meteo.com/en/pricing

## 制限値（無料プラン）

| 単位 | 上限 |
|------|------|
| 分 | 600 コール/分 |
| 時間 | 5,000 コール/時 |
| 日 | 10,000 コール/日 |
| 月 | 300,000 コール/月 |
| 同時接続 | キュー最大 6 リクエスト/IP |

- 日次制限は UTC 0:00（JST 9:00）にリセット
- 同時接続制限は 2025年3月に導入。1IPあたり同時処理1件、キュー最大6件

## APIコールの重み計算

複数座標を1リクエストにまとめた場合、1コールとはカウントされず重み計算される。

```
weight = nLocations × (nDays / 14) × (nVariables / 10)
```

### 本プロジェクトの場合

- バッチサイズ: 500座標
- 予報日数: 2日
- 変数数: 5（weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum, precipitation_probability_max）

```
500 × (2 / 14) × (5 / 10) ≈ 35.7 コール/バッチ
```

全2,599座標（6バッチ）で約 **214 コール** 消費。

## 429 エラーの種類

| reason | 原因 | 対処 |
|--------|------|------|
| `Minutely API request limit exceeded` | 分制限超過 | 60秒待機後リトライ |
| `Hourly API request limit exceeded` | 時間制限超過 | 待機後リトライ |
| `Daily API request limit exceeded` | 日制限超過 | 翌日（UTC 0:00）まで待つ必要あり |
| `Too many concurrent requests` | 同時接続超過 | 並列リクエスト数を削減 |

- Open-Meteo は `Retry-After` ヘッダーを返さない
- `X-RateLimit-Remaining` 等のヘッダーも提供されていない
- エラー理由はレスポンスボディの JSON で確認: `{"error": true, "reason": "..."}`

## スクリプトでの対策

### リトライ戦略

1. **バッチ内リトライ**: 最大5回、指数バックオフ（15秒 × 2^n）
2. **ラウンドリトライ**: 最大3ラウンド、60秒クールダウン
3. **自動リトライ**: 通常取得後に失敗座標を60秒クールダウン後に再取得
4. **Daily制限検出**: `Daily API request limit exceeded` を検出したら即座にリトライを中断

### `_failed.json`

取得失敗した座標は `public/weather/_failed.json` に保存される。
`--retry` フラグで手動リトライが可能。

```bash
# 通常実行（失敗時は自動リトライ付き）
npx tsx scripts/fetch-weather.ts

# 前回の失敗座標のみ再取得
npx tsx scripts/fetch-weather.ts --retry
```

## 参考: GitHub Issue

- [#438](https://github.com/open-meteo/open-meteo/issues/438) — 重み計算の導入と調整
- [#439](https://github.com/open-meteo/open-meteo/issues/439) — 分制限の詳細
- [#485](https://github.com/open-meteo/open-meteo/issues/485) — 制限値の詳細と方針
- [#1493](https://github.com/open-meteo/open-meteo/issues/1493) — 同時接続制限の導入
