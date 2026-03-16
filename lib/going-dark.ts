import { Vessel } from "@/types/index";
import { projectPosition, isInsideBounds } from "./geo";
import { AIS_BOUNDING_BOX } from "@/constants/regions";

const DARK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

const CORRIDOR_BOUNDS = {
  lat_min: AIS_BOUNDING_BOX[0][0],
  lon_min: AIS_BOUNDING_BOX[0][1],
  lat_max: AIS_BOUNDING_BOX[1][0],
  lon_max: AIS_BOUNDING_BOX[1][1],
};

// A vessel is "going dark" if:
// 1. It hasn't updated in 30+ minutes
// 2. Based on its last speed/heading, it should still be inside our bounding box
export function isVesselGoingDark(vessel: Vessel): boolean {
  const elapsed = Date.now() - vessel.lastUpdated;
  if (elapsed < DARK_THRESHOLD_MS) return false;

  // Project where the vessel should be now
  const projected = projectPosition(
    vessel.lat,
    vessel.lng,
    vessel.sog,
    vessel.cog,
    elapsed
  );

  // If the projected position is still inside our corridor, it likely went dark
  return isInsideBounds(projected.lat, projected.lng, CORRIDOR_BOUNDS);
}

export function getDarkDurationMs(vessel: Vessel): number {
  return Date.now() - vessel.lastUpdated;
}

export function formatDarkDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}
