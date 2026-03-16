import { ShadowFleetEntry } from "@/types/index";
import rawData from "@/data/shadow-fleet.json";

const SHADOW_FLEET: ShadowFleetEntry[] = rawData as ShadowFleetEntry[];

// Build a lookup map: IMO → entry
const byIMO = new Map<string, ShadowFleetEntry>();
for (const entry of SHADOW_FLEET) {
  byIMO.set(entry.imo.trim(), entry);
}

export function isShadowFleetVessel(imo: string): boolean {
  if (!imo) return false;
  return byIMO.has(imo.trim());
}

export function getShadowFleetEntry(imo: string): ShadowFleetEntry | null {
  if (!imo) return null;
  return byIMO.get(imo.trim()) ?? null;
}
