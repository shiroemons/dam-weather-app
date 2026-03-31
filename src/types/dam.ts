export interface Dam {
  id: string;
  damName: string;
  prefecture: string;
  prefectureSlug: string;
  prefectureCode: string;
  latitude: number;
  longitude: number;
  damType: string;
  waterSystem: string;
  riverName: string;
  totalStorageCapacity: number | null;
  damHeight: number | null;
  completionYear: number | null;
  address: string;
  municipality: string;
  riverUrl?: string;
  isMajor: boolean;
}
