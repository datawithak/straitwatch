import { EXPORT_TERMINALS, Terminal } from "@/constants/terminals";
import { haversineDistance } from "./geo";

// Check if a single lat/lng is inside any terminal's radius.
// Used for real-time position checks (not just trail history).
export function getTerminalFromPosition(lat: number, lng: number): string {
  for (const terminal of EXPORT_TERMINALS) {
    const dist = haversineDistance(lat, lng, terminal.lat, terminal.lng);
    if (dist <= terminal.radiusKm * 1000) {
      return terminal.name;
    }
  }
  return "";
}

// Check if a vessel is near or recently departed from an export terminal.
// Checks current position first (most reliable), then falls back to trail history.
export function getDepartedTerminal(
  trail: Array<{ lat: number; lng: number; t: number }>,
  currentLat?: number,
  currentLng?: number,
): string {
  // Current position check — catches vessels still in terminal waters
  if (currentLat != null && currentLng != null) {
    const hit = getTerminalFromPosition(currentLat, currentLng);
    if (hit) return hit;
  }

  if (!trail || trail.length < 2) return "";

  // Trail history — catches vessels that departed during this session
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
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
