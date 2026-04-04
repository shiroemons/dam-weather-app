export interface WatchList {
  id: string; // crypto.randomUUID()
  name: string;
  damIds: string[]; // ordered array
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface WatchlistData {
  version: 1;
  lists: WatchList[];
}
