// ─── Country ──────────────────────────────────────────────────────────────────

export type CountryKey =
  | "russia"
  | "china"
  | "iran"
  | "india"
  | "uae"
  | "usa"
  | "greece"
  | "norway"
  | "japan"
  | "uk"
  | "south-korea"
  | "singapore"
  | "flag-convenience"
  | "shadow-flag"
  | "other";

// ─── Region ───────────────────────────────────────────────────────────────────

export type RegionKey = "hormuz" | "bab" | "red-sea" | "gulf-oman" | "global";

// ─── Vessel ───────────────────────────────────────────────────────────────────

export interface TrailPoint {
  lat: number;
  lng: number;
  t: number;
}

export interface Vessel {
  mmsi: string;
  imo: string;
  name: string;
  callsign: string;
  shipType: number;
  lat: number;
  lng: number;
  sog: number;        // Speed Over Ground knots
  cog: number;        // Course Over Ground degrees
  heading: number;
  navStatus: number;
  destination: string;
  draught: number;
  lastUpdated: number;
  trail: TrailPoint[];

  // Enriched
  country: CountryKey;
  isSanctioned: boolean;
  sanctionPrograms: string[];
  sanctionSource: "OFAC" | "EU" | "BOTH" | null;
  isShadowFleet: boolean;
  shadowFleetSource: string;
  shadowFleetFormerNames: string[];
  isGoingDark: boolean;
  darkSinceMs: number;
  isPossibleSTS: boolean;
  stsPartnerMMSI: string;
  stsPartnerName: string;
  departedTerminal: string;
}

// ─── Shadow fleet ─────────────────────────────────────────────────────────────

export interface ShadowFleetEntry {
  imo: string;
  name: string;
  formerNames: string[];
  flagHistory: string[];
  notes: string;
  source: string;
}

// ─── Sanctions ────────────────────────────────────────────────────────────────

export interface SanctionEntry {
  imo: string;
  name: string;
  programs: string[];
  source: "OFAC" | "EU";
}

// ─── Intel / advisories ───────────────────────────────────────────────────────

export interface Advisory {
  id: string;
  source: "UKMTO" | "MARAD";
  title: string;
  summary: string;
  publishedAt: string;
  publishedMs: number;
  severity: "high" | "medium" | "low";
  lat: number | null;
  lng: number | null;
  url: string;
}

// ─── Story cards ──────────────────────────────────────────────────────────────

export interface StoryHighlight {
  countries?: CountryKey[];
  isSanctioned?: boolean;
  isShadowFleet?: boolean;
  isPossibleSTS?: boolean;
  departedTerminal?: boolean;
  destinationKeywords?: string[]; // highlight vessels whose destination contains any of these
}

export interface StoryCard {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  note?: string;
  answersQuestion: number;
  highlight: StoryHighlight;
  snapToRegion: RegionKey | null;
  emoji: string;
}

// ─── STS pair ─────────────────────────────────────────────────────────────────

export interface STSPair {
  vesselA: Vessel;
  vesselB: Vessel;
  distanceM: number;
  detectedAt: number;
}
