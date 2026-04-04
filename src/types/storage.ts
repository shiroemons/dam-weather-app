export interface DamStorage {
  damId: string;
  obsTime: string;
  storageLevel: number;
  storageCapacity: number;
  storageRate: number | null;
  inflow: number;
  outflow: number;
}

export interface PrefectureStorage {
  prefectureSlug: string;
  updatedAt: string;
  dams: DamStorage[];
}
