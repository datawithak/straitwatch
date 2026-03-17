import { Vessel } from "@/types/index";
import { IntelItem } from "@/types/intel";

export interface SituationReport {
  headline: string;
  details: string[];
  stats: {
    total: number;
    tankers: number;
    unknownType: number;
    sanctioned: number;
    shadowFleet: number;
    possibleSTS: number;
    goingDark: number;
    departedTerminal: number;
  };
  generatedAt: number;
}

export function generateSituationReport(
  vessels: Vessel[],
  intelItems: IntelItem[]
): SituationReport {
  const sanctioned = vessels.filter((v) => v.isSanctioned);
  const shadowFleet = vessels.filter((v) => v.isShadowFleet);
  const possibleSTS = vessels.filter((v) => v.isPossibleSTS);
  const goingDark = vessels.filter((v) => v.isGoingDark);
  // Count tankers — include type 0 (unknown) since static data arrives slowly
  const tankers = vessels.filter((v) => v.shipType >= 80 && v.shipType <= 89);
  const unknownType = vessels.filter((v) => v.shipType === 0);
  const departedTerminal = vessels.filter((v) => v.departedTerminal);

  const stats = {
    total: vessels.length,
    tankers: tankers.length,
    unknownType: unknownType.length, // type data not yet received
    sanctioned: sanctioned.length,
    shadowFleet: shadowFleet.length,
    possibleSTS: Math.floor(possibleSTS.length / 2),
    goingDark: goingDark.length,
    departedTerminal: departedTerminal.length,
  };

  const details: string[] = [];
  const headline = buildHeadline(stats, intelItems, vessels);

  if (stats.sanctioned > 0) {
    const programs = [...new Set(sanctioned.flatMap((v) => v.sanctionPrograms))];
    details.push(
      `${stats.sanctioned} OFAC-sanctioned vessel${stats.sanctioned !== 1 ? "s" : ""} in the corridor` +
        (programs.length > 0 ? ` (programs: ${programs.join(", ")})` : "")
    );
  }

  if (stats.possibleSTS > 0) {
    details.push(
      `${stats.possibleSTS} possible ship-to-ship transfer${stats.possibleSTS !== 1 ? "s" : ""} detected offshore`
    );
  }

  if (stats.goingDark > 0) {
    details.push(
      `${stats.goingDark} vessel${stats.goingDark !== 1 ? "s" : ""} went dark, stopped broadcasting AIS`
    );
  }

  if (stats.shadowFleet > 0) {
    details.push(
      `${stats.shadowFleet} known shadow fleet vessel${stats.shadowFleet !== 1 ? "s" : ""} in the corridor`
    );
  }

  if (stats.departedTerminal > 0) {
    details.push(
      `${stats.departedTerminal} vessel${stats.departedTerminal !== 1 ? "s" : ""} recently departed sanctioned export terminals`
    );
  }

  const recentIntel = intelItems.filter(
    (i) => Date.now() - i.publishedMs < 24 * 60 * 60 * 1000
  );
  if (recentIntel.length > 0) {
    details.push(`${recentIntel.length} new advisory${recentIntel.length !== 1 ? "s" : ""} from UKMTO/MARAD in the last 24 hours`);
  }

  return { headline, details, stats, generatedAt: Date.now() };
}

function buildHeadline(
  stats: SituationReport["stats"],
  intelItems: IntelItem[],
  vessels: Vessel[]
): string {
  // Lead with the most dramatic active signal
  if (stats.possibleSTS > 0) {
    const stsVessels = vessels.filter((v) => v.isPossibleSTS).slice(0, 2).map((v) => v.name).join(" & ");
    return `⚡ Ship-to-ship transfer in progress: ${stsVessels} stopped offshore. Sanctioned cargo likely changing hands.`;
  }

  if (stats.goingDark > 0 && stats.sanctioned > 0) {
    const dark = vessels.find((v) => v.isGoingDark && v.isSanctioned);
    return `◯ Sanctioned vessel ${dark?.name ?? "unknown"} has gone dark. Stopped broadcasting location. Possible evasion manoeuvre.`;
  }

  if (stats.sanctioned > 0) {
    const s = vessels.find((v) => v.isSanctioned);
    return `⚠ ${s?.name ?? "Sanctioned vessel"} is in the corridor. OFAC listed, operating without Western insurance.`;
  }

  if (stats.shadowFleet > 0) {
    return `🟣 ${stats.shadowFleet} shadow fleet vessel${stats.shadowFleet !== 1 ? "s" : ""} active in the corridor. Russia's covert oil network moving sanctioned crude.`;
  }

  if (stats.departedTerminal > 0) {
    const v = vessels.find((v) => v.departedTerminal);
    return `📍 ${v?.name ?? "A vessel"} recently departed ${v?.departedTerminal ?? "a sanctioned terminal"}, likely carrying sanctioned crude.`;
  }

  const recentAlert = intelItems.find(
    (i) => i.severity === "high" && Date.now() - i.publishedMs < 48 * 60 * 60 * 1000
  );
  if (recentAlert) {
    return `🚨 ${recentAlert.title.substring(0, 90)}`;
  }

  // Fallback — still informative, not "no alerts"
  const shadowCount = vessels.filter((v) => v.country === "shadow-flag").length;
  if (shadowCount > 0) {
    return `${stats.total} vessels tracked. ${shadowCount} flying shadow fleet flags. Click "Russia's Shadow Fleet" to see them.`;
  }

  return `${stats.total} vessels tracked across the corridor. Click a story on the left to explore what's happening.`;
}
