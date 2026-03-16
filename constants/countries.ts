import { CountryKey } from "@/types/index";

// Maritime Identification Digits (MID) — first 3 digits of MMSI = flag state
export const MID_TO_COUNTRY: Record<string, CountryKey> = {
  // Russia
  "273": "russia",
  // China (incl. Hong Kong — HK vessels are Chinese jurisdiction)
  "412": "china",
  "413": "china",
  "414": "china",
  "477": "china", // Hong Kong
  // Iran
  "422": "iran",
  // India
  "419": "india",
  // UAE
  "470": "uae",
  // USA
  "338": "usa",
  "366": "usa",
  "367": "usa",
  "368": "usa",
  "369": "usa",
  // Greece
  "239": "greece",
  "240": "greece",
  "241": "greece",
  // Shadow fleet flags of convenience
  "511": "shadow-flag", // Palau
  "626": "shadow-flag", // Gabon
  "518": "shadow-flag", // Cook Islands
  "475": "shadow-flag", // Cameroon
  "667": "shadow-flag", // Sierra Leone
  "321": "shadow-flag", // Antigua and Barbuda
};

export const COUNTRY_LABELS: Record<CountryKey, string> = {
  russia: "Russia",
  china: "China",
  iran: "Iran",
  india: "India",
  uae: "UAE",
  usa: "United States",
  greece: "Greece",
  "shadow-flag": "Shadow fleet flag",
  other: "Other",
};

export const COUNTRY_COLORS: Record<CountryKey, string> = {
  russia: "#CC2929",
  china: "#FF4444",
  iran: "#E8650A",
  india: "#FF9933",
  uae: "#D4AF37",
  usa: "#3B82F6",
  greece: "#1D4ED8",
  "shadow-flag": "#8B5CF6",
  other: "#6B7280",
};

export const COUNTRY_DESCRIPTIONS: Record<CountryKey, string> = {
  russia:
    "Russia operates a ~600-ship shadow fleet to move sanctioned Urals crude to India and China, bypassing Western sanctions.",
  china:
    "China is the world's largest buyer of Persian Gulf oil — including sanctioned Iranian and Russian crude.",
  iran:
    "Iran has been under US sanctions since 1979. Its ghost fleet moves crude through ship-to-ship transfers to hide origin.",
  india:
    "India now buys discounted Russian crude at scale. Indian tankers transit Hormuz regularly.",
  uae:
    "UAE's Fujairah port, just outside Hormuz, is the world's largest bunkering hub and a major transshipment point.",
  usa:
    "US 5th Fleet is based in Bahrain and patrols the Persian Gulf. US Navy escorts some commercial traffic.",
  greece:
    "Greece operates the world's largest tanker fleet. Many Greek-owned vessels are registered under flags of convenience.",
  "shadow-flag":
    "Countries like Gabon, Palau, and Cook Islands are used as flags of convenience to hide the real vessel owner — usually Russian or Iranian interests.",
  other: "Other flag state.",
};

export function getCountryFromMMSI(mmsi: string): CountryKey {
  if (!mmsi || mmsi.length < 3) return "other";
  const mid = mmsi.slice(0, 3);
  return MID_TO_COUNTRY[mid] ?? "other";
}
