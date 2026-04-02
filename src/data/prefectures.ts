import type { Prefecture, Region } from "../types/prefecture";

export const REGIONS: Region[] = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州・沖縄",
];

export const REGION_SLUG_MAP: Record<Region, string> = {
  北海道: "hokkaido",
  東北: "tohoku",
  関東: "kanto",
  中部: "chubu",
  近畿: "kinki",
  中国: "chugoku",
  四国: "shikoku",
  "九州・沖縄": "kyushu-okinawa",
};

export const PREFECTURES: Prefecture[] = [
  { code: "01", name: "北海道", slug: "hokkaido", region: "北海道", damCount: 190, obsCount: 72 },
  { code: "02", name: "青森県", slug: "aomori", region: "東北", damCount: 34, obsCount: 16 },
  { code: "03", name: "岩手県", slug: "iwate", region: "東北", damCount: 53, obsCount: 23 },
  { code: "04", name: "宮城県", slug: "miyagi", region: "東北", damCount: 39, obsCount: 20 },
  { code: "05", name: "秋田県", slug: "akita", region: "東北", damCount: 66, obsCount: 17 },
  { code: "06", name: "山形県", slug: "yamagata", region: "東北", damCount: 59, obsCount: 19 },
  { code: "07", name: "福島県", slug: "fukushima", region: "東北", damCount: 89, obsCount: 32 },
  { code: "08", name: "茨城県", slug: "ibaraki", region: "関東", damCount: 16, obsCount: 8 },
  { code: "09", name: "栃木県", slug: "tochigi", region: "関東", damCount: 36, obsCount: 12 },
  { code: "10", name: "群馬県", slug: "gunma", region: "関東", damCount: 50, obsCount: 17 },
  { code: "11", name: "埼玉県", slug: "saitama", region: "関東", damCount: 15, obsCount: 5 },
  { code: "12", name: "千葉県", slug: "chiba", region: "関東", damCount: 50, obsCount: 6 },
  { code: "13", name: "東京都", slug: "tokyo", region: "関東", damCount: 8, obsCount: 1 },
  { code: "14", name: "神奈川県", slug: "kanagawa", region: "関東", damCount: 13, obsCount: 6 },
  { code: "15", name: "新潟県", slug: "niigata", region: "中部", damCount: 114, obsCount: 32 },
  { code: "16", name: "富山県", slug: "toyama", region: "中部", damCount: 76, obsCount: 20 },
  { code: "17", name: "石川県", slug: "ishikawa", region: "中部", damCount: 55, obsCount: 12 },
  { code: "18", name: "福井県", slug: "fukui", region: "中部", damCount: 26, obsCount: 12 },
  { code: "19", name: "山梨県", slug: "yamanashi", region: "中部", damCount: 20, obsCount: 6 },
  { code: "20", name: "長野県", slug: "nagano", region: "中部", damCount: 65, obsCount: 24 },
  { code: "21", name: "岐阜県", slug: "gifu", region: "中部", damCount: 95, obsCount: 23 },
  { code: "22", name: "静岡県", slug: "shizuoka", region: "中部", damCount: 45, obsCount: 9 },
  { code: "23", name: "愛知県", slug: "aichi", region: "中部", damCount: 48, obsCount: 7 },
  { code: "24", name: "三重県", slug: "mie", region: "近畿", damCount: 86, obsCount: 13 },
  { code: "25", name: "滋賀県", slug: "shiga", region: "近畿", damCount: 25, obsCount: 8 },
  { code: "26", name: "京都府", slug: "kyoto", region: "近畿", damCount: 28, obsCount: 5 },
  { code: "27", name: "大阪府", slug: "osaka", region: "近畿", damCount: 32, obsCount: 4 },
  { code: "28", name: "兵庫県", slug: "hyogo", region: "近畿", damCount: 104, obsCount: 30 },
  { code: "29", name: "奈良県", slug: "nara", region: "近畿", damCount: 33, obsCount: 19 },
  { code: "30", name: "和歌山県", slug: "wakayama", region: "近畿", damCount: 28, obsCount: 9 },
  { code: "31", name: "鳥取県", slug: "tottori", region: "中国", damCount: 32, obsCount: 14 },
  { code: "32", name: "島根県", slug: "shimane", region: "中国", damCount: 49, obsCount: 26 },
  { code: "33", name: "岡山県", slug: "okayama", region: "中国", damCount: 166, obsCount: 28 },
  { code: "34", name: "広島県", slug: "hiroshima", region: "中国", damCount: 100, obsCount: 33 },
  { code: "35", name: "山口県", slug: "yamaguchi", region: "中国", damCount: 86, obsCount: 24 },
  { code: "36", name: "徳島県", slug: "tokushima", region: "四国", damCount: 22, obsCount: 8 },
  { code: "37", name: "香川県", slug: "kagawa", region: "四国", damCount: 65, obsCount: 16 },
  { code: "38", name: "愛媛県", slug: "ehime", region: "四国", damCount: 71, obsCount: 18 },
  { code: "39", name: "高知県", slug: "kochi", region: "四国", damCount: 51, obsCount: 18 },
  { code: "40", name: "福岡県", slug: "fukuoka", region: "九州・沖縄", damCount: 96, obsCount: 26 },
  { code: "41", name: "佐賀県", slug: "saga", region: "九州・沖縄", damCount: 57, obsCount: 29 },
  {
    code: "42",
    name: "長崎県",
    slug: "nagasaki",
    region: "九州・沖縄",
    damCount: 97,
    obsCount: 35,
  },
  {
    code: "43",
    name: "熊本県",
    slug: "kumamoto",
    region: "九州・沖縄",
    damCount: 36,
    obsCount: 18,
  },
  { code: "44", name: "大分県", slug: "oita", region: "九州・沖縄", damCount: 84, obsCount: 23 },
  {
    code: "45",
    name: "宮崎県",
    slug: "miyazaki",
    region: "九州・沖縄",
    damCount: 51,
    obsCount: 39,
  },
  {
    code: "46",
    name: "鹿児島県",
    slug: "kagoshima",
    region: "九州・沖縄",
    damCount: 42,
    obsCount: 12,
  },
  { code: "47", name: "沖縄県", slug: "okinawa", region: "九州・沖縄", damCount: 46, obsCount: 14 },
];

export function getPrefectureBySlug(slug: string): Prefecture | undefined {
  return PREFECTURES.find((p) => p.slug === slug);
}

export function getPrefecturesByRegion(region: Region): Prefecture[] {
  return PREFECTURES.filter((p) => p.region === region);
}

export function getRegionsWithPrefectures(): { region: Region; prefectures: Prefecture[] }[] {
  return REGIONS.map((region) => ({
    region,
    prefectures: getPrefecturesByRegion(region),
  }));
}
