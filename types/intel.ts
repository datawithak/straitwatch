export interface IntelItem {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceShort: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  publishedMs: number;
  severity?: "high" | "medium" | "low";
  lat?: number;
  lng?: number;
}

export interface IntelFeedResult {
  items: IntelItem[];
  fetchedAt: number;
  errors: string[];
}
