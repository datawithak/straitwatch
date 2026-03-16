// Known ports and anchorages in the corridor.
// Used to exclude vessels near ports from STS detection
// (legitimate anchorage vs. suspicious offshore transfer).

export interface Port {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export const KNOWN_PORTS: Port[] = [
  { name: "Fujairah Anchorage", lat: 25.12, lng: 56.35, radiusKm: 15 },
  { name: "Jebel Ali (Dubai)", lat: 24.99, lng: 55.06, radiusKm: 12 },
  { name: "Abu Dhabi", lat: 24.47, lng: 54.37, radiusKm: 15 },
  { name: "Bandar Abbas", lat: 27.18, lng: 56.27, radiusKm: 15 },
  { name: "Sohar", lat: 24.35, lng: 56.74, radiusKm: 12 },
  { name: "Muscat", lat: 23.61, lng: 58.59, radiusKm: 10 },
  { name: "Salalah", lat: 16.94, lng: 54.00, radiusKm: 12 },
  { name: "Aden", lat: 12.78, lng: 44.98, radiusKm: 12 },
  { name: "Djibouti", lat: 11.59, lng: 43.14, radiusKm: 10 },
  { name: "Jeddah", lat: 21.48, lng: 39.17, radiusKm: 12 },
  { name: "Yanbu", lat: 24.09, lng: 38.05, radiusKm: 10 },
  { name: "Suez", lat: 29.96, lng: 32.55, radiusKm: 12 },
  { name: "Kharg Island Terminal", lat: 29.25, lng: 50.32, radiusKm: 20 },
  { name: "Ras Tanura", lat: 26.64, lng: 50.16, radiusKm: 15 },
  { name: "Kuwait City", lat: 29.37, lng: 47.98, radiusKm: 15 },
  { name: "Basra Oil Terminal", lat: 29.68, lng: 48.81, radiusKm: 20 },
];
