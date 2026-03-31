export interface Dam {
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
  isMajor: boolean;
}
