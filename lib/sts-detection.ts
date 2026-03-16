import { Vessel, STSPair } from "@/types/index";
import { haversineDistance, isInsideBounds } from "./geo";
import { KNOWN_PORTS } from "@/constants/ports";
import { isTanker } from "@/constants/vessel-types";

const STS_DISTANCE_M = 500;     // Max distance between vessels
const STS_MAX_SOG = 1.5;        // Max speed (knots) for both vessels
const PORT_EXCLUSION_KM = 5;    // Exclude vessels within 5km of a known port

// Maritime territorial waters rough check — 12nm from any coast is complex to
// compute exactly, so we use port exclusion as a practical proxy.
function isNearPort(lat: number, lng: number): boolean {
  for (const port of KNOWN_PORTS) {
    const dist = haversineDistance(lat, lng, port.lat, port.lng);
    if (dist <= port.radiusKm * 1000) return true;
  }
  return false;
}

export function detectSTSPairs(vessels: Vessel[]): STSPair[] {
  const tankers = vessels.filter((v) => isTanker(v.shipType));
  const pairs: STSPair[] = [];
  const now = Date.now();

  for (let i = 0; i < tankers.length; i++) {
    for (let j = i + 1; j < tankers.length; j++) {
      const a = tankers[i];
      const b = tankers[j];

      // Both must be slow
      if (a.sog > STS_MAX_SOG || b.sog > STS_MAX_SOG) continue;

      // Both must be close
      const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng);
      if (dist > STS_DISTANCE_M) continue;

      // Neither should be near a known port
      if (isNearPort(a.lat, a.lng) || isNearPort(b.lat, b.lng)) continue;

      pairs.push({ vesselA: a, vesselB: b, distanceM: dist, detectedAt: now });
    }
  }

  return pairs;
}
