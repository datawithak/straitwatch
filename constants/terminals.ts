// Known Iranian and Russian crude oil export terminals.
// Vessels that recently departed from these locations are likely carrying
// sanctioned crude oil.

export interface Terminal {
  name: string;
  country: "iran" | "russia";
  lat: number;
  lng: number;
  radiusKm: number; // Detection radius in km
  description: string;
}

export const EXPORT_TERMINALS: Terminal[] = [
  // Iranian terminals
  {
    name: "Kharg Island",
    country: "iran",
    lat: 29.25,
    lng: 50.32,
    radiusKm: 30,
    description: "Iran's main crude oil export terminal. Handles ~90% of Iranian oil exports.",
  },
  {
    name: "Bandar Abbas",
    country: "iran",
    lat: 27.18,
    lng: 56.27,
    radiusKm: 20,
    description: "Major Iranian port at the Strait of Hormuz.",
  },
  {
    name: "Assaluyeh",
    country: "iran",
    lat: 27.48,
    lng: 52.61,
    radiusKm: 20,
    description: "Iran's South Pars LNG and condensate export terminal.",
  },
  // Russian terminals
  {
    name: "Novorossiysk",
    country: "russia",
    lat: 44.72,
    lng: 37.78,
    radiusKm: 30,
    description: "Russia's main Black Sea crude export terminal. Primary outlet for Urals blend.",
  },
  {
    name: "Ust-Luga",
    country: "russia",
    lat: 59.68,
    lng: 28.38,
    radiusKm: 25,
    description: "Major Russian Baltic export terminal for crude and petroleum products.",
  },
  {
    name: "Primorsk",
    country: "russia",
    lat: 60.37,
    lng: 28.65,
    radiusKm: 20,
    description: "Russian Baltic crude export terminal.",
  },
];
