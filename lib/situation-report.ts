import { Vessel } from "@/types/index";
import { IntelItem } from "@/types/intel";

export interface SituationReport {
  headline: string;
  details: string[];
  stats: {
    total: number;
    tankers: number;
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
  const tankers = vessels.filter((v) => v.shipType >= 80 && v.shipType <= 89);
  const departedTerminal = vessels.filter((v) => v.departedTerminal);

  const stats = {
    total: vessels.length,
    tankers: tankers.length,
    sanctioned: sanctioned.length,
    shadowFleet: shadowFleet.length,
    possibleSTS: Math.floor(possibleSTS.length / 2), // pairs, not individual vessels
    goingDark: goingDark.length,
    departedTerminal: departedTerminal.length,
  };

  const details: string[] = [];
  const headline = buildHeadline(stats, intelItems);

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
      `${stats.goingDark} vessel${stats.goingDark !== 1 ? "s" : ""} went dark — stopped broadcasting AIS`
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
  intelItems: IntelItem[]
): string {
  const parts: string[] = [];

  if (stats.possibleSTS > 0) {
    parts.push(
      `${stats.possibleSTS} possible ship-to-ship transfer${stats.possibleSTS !== 1 ? "s" : ""} in progress`
    );
  }

  if (stats.goingDark > 0) {
    parts.push(`${stats.goingDark} vessel${stats.goingDark !== 1 ? "s" : ""} gone dark`);
  }

  if (stats.sanctioned > 0) {
    parts.push(`${stats.sanctioned} sanctioned vessel${stats.sanctioned !== 1 ? "s" : ""} in corridor`);
  }

  if (stats.shadowFleet > 0) {
    parts.push(`${stats.shadowFleet} shadow fleet vessel${stats.shadowFleet !== 1 ? "s" : ""} active`);
  }

  const recentAlert = intelItems.find(
    (i) =>
      (i.severity === "high" || i.title?.toLowerCase().includes("attack")) &&
      Date.now() - i.publishedMs < 48 * 60 * 60 * 1000
  );
  if (recentAlert) {
    parts.push(`recent incident: ${recentAlert.title.substring(0, 60)}`);
  }

  if (parts.length === 0) {
    return `${stats.tankers} tankers in the corridor. No significant alerts.`;
  }

  return parts.join(" — ");
}
