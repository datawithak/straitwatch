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
  // Norway
  "257": "norway",
  "258": "norway",
  "259": "norway",
  // Japan
  "431": "japan",
  "432": "japan",
  // UK
  "232": "uk",
  "233": "uk",
  "234": "uk",
  "235": "uk",
  // South Korea
  "440": "south-korea",
  "441": "south-korea",
  // Singapore
  "563": "singapore",
  "564": "singapore",
  "565": "singapore",
  // Flags of convenience (high-volume commercial registries)
  "351": "flag-convenience", // Panama
  "352": "flag-convenience",
  "353": "flag-convenience",
  "354": "flag-convenience",
  "355": "flag-convenience",
  "356": "flag-convenience",
  "357": "flag-convenience",
  "538": "flag-convenience", // Marshall Islands
  "636": "flag-convenience", // Liberia
  "308": "flag-convenience", // Bahamas
  "309": "flag-convenience",
  "319": "flag-convenience", // Cayman Islands
  "248": "flag-convenience", // Malta
  "249": "flag-convenience",
  "209": "flag-convenience", // Cyprus
  "210": "flag-convenience",
  "271": "flag-convenience", // Turkey
  "255": "flag-convenience", // Portugal / Madeira
  "247": "flag-convenience", // Italy
  "244": "flag-convenience", // Netherlands
  "245": "flag-convenience",
  "246": "flag-convenience",
  "211": "flag-convenience", // Germany
  "219": "flag-convenience", // Denmark
  "220": "flag-convenience",
  "548": "flag-convenience", // Philippines
  "503": "flag-convenience", // Australia
  "416": "flag-convenience", // Taiwan
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
  norway: "Norway",
  japan: "Japan",
  uk: "United Kingdom",
  "south-korea": "South Korea",
  singapore: "Singapore",
  "flag-convenience": "Flag of Convenience",
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
  norway: "#0ea5e9",
  japan: "#be185d",
  uk: "#6366f1",
  "south-korea": "#059669",
  singapore: "#d97706",
  "flag-convenience": "#94a3b8",
  "shadow-flag": "#8B5CF6",
  other: "#475569",
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
  norway: "Major maritime nation. Norwegian-flagged vessels are typically commercial tankers operating under Western insurance.",
  japan: "Japan is a major oil importer and tanker operator. Japanese vessels comply with Western sanctions.",
  uk: "UK-flagged vessels. UKMTO (United Kingdom Maritime Trade Operations) issues advisories for the region.",
  "south-korea": "South Korea is a major shipbuilder and tanker operator. Compliant with Western sanctions.",
  singapore: "Singapore is Asia's largest bunkering hub and a major maritime registry. Key transshipment point.",
  "flag-convenience": "Registered in Panama, Marshall Islands, Liberia, Bahamas, or similar open registries. Flag tells you little about the real owner — look at the destination dot for clues.",
  "shadow-flag":
    "Countries like Gabon, Palau, and Cook Islands are used as flags of convenience to hide the real vessel owner — usually Russian or Iranian interests.",
  other: "Flag state not identified.",
};

export function getCountryFromMMSI(mmsi: string): CountryKey {
  if (!mmsi || mmsi.length < 3) return "other";
  const mid = mmsi.slice(0, 3);
  return MID_TO_COUNTRY[mid] ?? "other";
}
