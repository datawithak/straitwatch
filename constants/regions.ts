import { RegionKey } from "@/types/index";

export interface RegionBounds {
  lat_min: number;
  lon_min: number;
  lat_max: number;
  lon_max: number;
}

export interface Region {
  label: string;
  description: string;
  bounds: RegionBounds;
  center: [number, number];
  zoom: number;
}

export const REGIONS: Record<RegionKey, Region> = {
  global: {
    label: "Full Corridor",
    description: "Persian Gulf to Red Sea",
    bounds: { lat_min: 8, lon_min: 30, lat_max: 32, lon_max: 67 },
    center: [22, 52],
    zoom: 5,
  },
  hormuz: {
    label: "Strait of Hormuz",
    description: "21% of world's oil passes here",
    bounds: { lat_min: 22, lon_min: 54, lat_max: 27, lon_max: 60 },
    center: [26.5, 56.5],
    zoom: 7,
  },
  "gulf-oman": {
    label: "Gulf of Oman",
    description: "Shadow fleet STS transfer zone",
    bounds: { lat_min: 20, lon_min: 56, lat_max: 26, lon_max: 63 },
    center: [23, 59],
    zoom: 6,
  },
  bab: {
    label: "Bab al-Mandab",
    description: "Houthi attack zone — Red Sea entry",
    bounds: { lat_min: 11, lon_min: 41, lat_max: 15, lon_max: 47 },
    center: [12.5, 43.5],
    zoom: 7,
  },
  "red-sea": {
    label: "Red Sea",
    description: "Suez Canal corridor",
    bounds: { lat_min: 11, lon_min: 31, lat_max: 30, lon_max: 44 },
    center: [20, 38],
    zoom: 5,
  },
};

// AIS subscription bounding box — full corridor: Red Sea (lon 30E) to Arabian Sea (lon 75E)
export const AIS_BOUNDING_BOX = [[8.0, 30.0], [32.0, 75.0]];
