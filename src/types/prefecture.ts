export type Region =
  | "北海道"
  | "東北"
  | "関東"
  | "中部"
  | "近畿"
  | "中国"
  | "四国"
  | "九州・沖縄";

export interface Prefecture {
  code: string;
  name: string;
  slug: string;
  region: Region;
  damCount: number;
  jmaOfficeCode: string;
}
