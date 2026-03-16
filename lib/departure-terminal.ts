import { EXPORT_TERMINALS, Terminal } from "@/constants/terminals";
import { haversineDistance } from "./geo";

// Check if a vessel's last known position was near an export terminal.
// We use the trail (last 20 positions) to detect recent departure.
export function getDepartedTerminal(
  trail: Array<{ lat: number; lng: number; t: number }>
): string {
  if (!trail || trail.length < 2) return "";

  // Look at positions from the past 48 hours only
  const now = Date.now();
  const cutoff = now - 48 * 60 * 60 * 1000;
  const recentTrail = trail.filter((p) => p.t > cutoff);

  for (const point of recentTrail) {
    for (const terminal of EXPORT_TERMINALS) {
      const dist = haversineDistance(point.lat, point.lng, terminal.lat, terminal.lng);
      if (dist <= terminal.radiusKm * 1000) {
        return terminal.name;
      }
    }
  }
  return "";
}

export function getTerminalInfo(name: string): Terminal | null {
  return EXPORT_TERMINALS.find((t) => t.name === name) ?? null;
}
