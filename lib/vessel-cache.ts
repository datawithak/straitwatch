/**
 * Persists vessel snapshots to localStorage so going-dark vessels are visible
 * across browser sessions — not just from the moment you opened the tab.
 *
 * We store the last-seen position + timestamp for each vessel.
 * On next load, any vessel whose lastUpdated is > DARK_THRESHOLD and whose
 * projected position is still inside the corridor will be flagged as going dark
 * by the existing isVesselGoingDark() logic in lib/going-dark.ts.
 */

import { Vessel } from "@/types/index";

const CACHE_KEY = "straitwatch_vessels_v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // discard cache older than 24h
const MAX_VESSELS = 600; // cap to stay well within localStorage limits (~5MB)

// Stored shape — strip heavy/ephemeral fields to keep size down
type CachedVessel = Omit<
  Vessel,
  "trail" | "isPossibleSTS" | "isGoingDark" | "darkSinceMs" | "stsPartnerMMSI" | "stsPartnerName"
>;

interface CachePayload {
  savedAt: number;
  vessels: Record<string, CachedVessel>;
}

export function saveVesselCache(vessels: Vessel[]): void {
  if (typeof window === "undefined") return;
  try {
    // Keep the most-recently-updated vessels when over the cap
    const sorted = [...vessels]
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, MAX_VESSELS);

    const toStore: Record<string, CachedVessel> = {};
    for (const v of sorted) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trail, isPossibleSTS, isGoingDark, darkSinceMs, stsPartnerMMSI, stsPartnerName, ...rest } = v;
      toStore[v.mmsi] = rest;
    }

    const payload: CachePayload = { savedAt: Date.now(), vessels: toStore };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // QuotaExceededError or private browsing — fail silently
  }
}

export function loadVesselCache(): Vessel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];

    const { savedAt, vessels } = JSON.parse(raw) as CachePayload;

    // Don't resurrect vessels from a very old cache
    if (Date.now() - savedAt > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return [];
    }

    // Rehydrate with empty ephemeral fields — going-dark detection will re-evaluate
    return Object.values(vessels).map((v) => ({
      ...v,
      trail: [],
      isPossibleSTS: false,
      isGoingDark: false,
      darkSinceMs: 0,
      stsPartnerMMSI: "",
      stsPartnerName: "",
    }));
  } catch {
    return [];
  }
}
