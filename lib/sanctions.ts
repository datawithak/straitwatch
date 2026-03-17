// Sanctioned vessel IMOs — pre-baked from OFAC SDN list at build time.
// Refresh by running: node scripts/fetch-sanctions.mjs
import rawData from "@/data/sanctioned-vessels.json";

const SANCTIONED = new Map<string, { programs: string[]; name: string }>(
  Object.entries(rawData as Record<string, { programs: string[]; name: string }>)
);

export async function getSanctionedVessels(): Promise<
  Map<string, { programs: string[]; name: string }>
> {
  return SANCTIONED;
}

export function enrichWithSanctions(
  vessels: import("@/types/index").Vessel[],
  sanctioned: Map<string, { programs: string[]; name: string }>
): import("@/types/index").Vessel[] {
  return vessels.map((v) => {
    if (!v.imo) return v;
    const entry = sanctioned.get(v.imo);
    if (!entry) return v;
    return {
      ...v,
      isSanctioned: true,
      sanctionPrograms: entry.programs,
      sanctionSource: "OFAC" as const,
    };
  });
}
