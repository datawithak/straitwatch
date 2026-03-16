import { NextResponse } from "next/server";
import { fetchVesselsViaAIS } from "@/lib/aisstream";
import { getSanctionedVessels, enrichWithSanctions } from "@/lib/sanctions";
import { isVesselGoingDark, getDarkDurationMs } from "@/lib/going-dark";
import { getDepartedTerminal } from "@/lib/departure-terminal";
import { Vessel } from "@/types/index";

// Demo vessels — shown when AIS key is missing or stream returns nothing
const DEMO_VESSELS: Vessel[] = [
  {
    mmsi: "273456789", imo: "9293614", name: "SHADOW PIONEER", callsign: "UBRX",
    shipType: 81, lat: 24.5, lng: 57.8, sog: 0.4, cog: 180, heading: 180,
    navStatus: 1, destination: "ZHOUSHAN", draught: 14.2,
    lastUpdated: Date.now() - 25 * 60 * 1000,
    trail: [
      { lat: 24.6, lng: 57.7, t: Date.now() - 40 * 60 * 1000 },
      { lat: 24.55, lng: 57.75, t: Date.now() - 30 * 60 * 1000 },
      { lat: 24.5, lng: 57.8, t: Date.now() - 20 * 60 * 1000 },
    ],
    country: "russia", isSanctioned: true, sanctionPrograms: ["RUSSIA"],
    sanctionSource: "OFAC", isShadowFleet: true,
    shadowFleetSource: "KSE 2024", shadowFleetFormerNames: ["ARCTIC VOYAGER"],
    isGoingDark: false, darkSinceMs: 0,
    isPossibleSTS: false, stsPartnerMMSI: "", stsPartnerName: "",
    departedTerminal: "Novorossiysk",
  },
  {
    mmsi: "412345678", imo: "9183906", name: "GOLDEN DRAGON", callsign: "BCZX",
    shipType: 81, lat: 26.2, lng: 56.3, sog: 12.1, cog: 95, heading: 95,
    navStatus: 0, destination: "NINGBO", draught: 16.8,
    lastUpdated: Date.now() - 2 * 60 * 1000,
    trail: [
      { lat: 26.2, lng: 55.8, t: Date.now() - 20 * 60 * 1000 },
      { lat: 26.2, lng: 56.0, t: Date.now() - 10 * 60 * 1000 },
      { lat: 26.2, lng: 56.3, t: Date.now() - 2 * 60 * 1000 },
    ],
    country: "china", isSanctioned: false, sanctionPrograms: [],
    sanctionSource: null, isShadowFleet: false, shadowFleetSource: "",
    shadowFleetFormerNames: [], isGoingDark: false, darkSinceMs: 0,
    isPossibleSTS: false, stsPartnerMMSI: "", stsPartnerName: "",
    departedTerminal: "",
  },
  {
    mmsi: "422111222", imo: "9069545", name: "TURBA", callsign: "EPBC",
    shipType: 81, lat: 24.48, lng: 57.82, sog: 0.3, cog: 90, heading: 90,
    navStatus: 1, destination: "", draught: 13.5,
    lastUpdated: Date.now() - 5 * 60 * 1000,
    trail: [
      { lat: 24.49, lng: 57.80, t: Date.now() - 15 * 60 * 1000 },
      { lat: 24.48, lng: 57.81, t: Date.now() - 10 * 60 * 1000 },
      { lat: 24.48, lng: 57.82, t: Date.now() - 5 * 60 * 1000 },
    ],
    country: "iran", isSanctioned: true, sanctionPrograms: ["IRAN"],
    sanctionSource: "OFAC", isShadowFleet: true,
    shadowFleetSource: "OFAC 2022", shadowFleetFormerNames: ["HELEN"],
    isGoingDark: false, darkSinceMs: 0,
    isPossibleSTS: true, stsPartnerMMSI: "273456789", stsPartnerName: "SHADOW PIONEER",
    departedTerminal: "Kharg Island",
  },
  {
    mmsi: "419123456", imo: "9340704", name: "INDIA SPIRIT", callsign: "ATBX",
    shipType: 81, lat: 23.5, lng: 60.2, sog: 14.3, cog: 260, heading: 260,
    navStatus: 0, destination: "MUNDRA", draught: 15.1,
    lastUpdated: Date.now() - 3 * 60 * 1000,
    trail: [
      { lat: 23.5, lng: 61.0, t: Date.now() - 30 * 60 * 1000 },
      { lat: 23.5, lng: 60.6, t: Date.now() - 15 * 60 * 1000 },
      { lat: 23.5, lng: 60.2, t: Date.now() - 3 * 60 * 1000 },
    ],
    country: "india", isSanctioned: false, sanctionPrograms: [],
    sanctionSource: null, isShadowFleet: false, shadowFleetSource: "",
    shadowFleetFormerNames: [], isGoingDark: false, darkSinceMs: 0,
    isPossibleSTS: false, stsPartnerMMSI: "", stsPartnerName: "",
    departedTerminal: "",
  },
  {
    mmsi: "511987654", imo: "9167849", name: "OCEAN PRIDE", callsign: "TXGB",
    shipType: 81, lat: 25.1, lng: 58.5, sog: 0.0, cog: 0, heading: 0,
    navStatus: 1, destination: "", draught: 11.2,
    lastUpdated: Date.now() - 45 * 60 * 1000,
    trail: [
      { lat: 25.1, lng: 58.5, t: Date.now() - 60 * 60 * 1000 },
    ],
    country: "shadow-flag", isSanctioned: false, sanctionPrograms: [],
    sanctionSource: null, isShadowFleet: true,
    shadowFleetSource: "Reuters 2023", shadowFleetFormerNames: ["ARZAMAS"],
    isGoingDark: true, darkSinceMs: 45 * 60 * 1000,
    isPossibleSTS: false, stsPartnerMMSI: "", stsPartnerName: "",
    departedTerminal: "Novorossiysk",
  },
  {
    mmsi: "470234567", imo: "", name: "AL ITTIHAD", callsign: "A6UA",
    shipType: 81, lat: 25.12, lng: 56.35, sog: 0.1, cog: 0, heading: 0,
    navStatus: 5, destination: "FUJAIRAH", draught: 8.3,
    lastUpdated: Date.now() - 1 * 60 * 1000,
    trail: [], country: "uae", isSanctioned: false, sanctionPrograms: [],
    sanctionSource: null, isShadowFleet: false, shadowFleetSource: "",
    shadowFleetFormerNames: [], isGoingDark: false, darkSinceMs: 0,
    isPossibleSTS: false, stsPartnerMMSI: "", stsPartnerName: "",
    departedTerminal: "",
  },
];

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY ?? "";

  if (!apiKey) {
    return NextResponse.json({ vessels: DEMO_VESSELS, isDemo: true });
  }

  try {
    const [rawVessels, sanctioned] = await Promise.all([
      fetchVesselsViaAIS(apiKey, 30_000),
      getSanctionedVessels(),
    ]);

    let vessels = enrichWithSanctions(rawVessels, sanctioned);

    // Apply going dark detection
    vessels = vessels.map((v) => ({
      ...v,
      isGoingDark: isVesselGoingDark(v),
      darkSinceMs: isVesselGoingDark(v) ? getDarkDurationMs(v) : 0,
      departedTerminal: getDepartedTerminal(v.trail),
    }));

    if (vessels.length === 0) {
      return NextResponse.json({ vessels: DEMO_VESSELS, isDemo: true });
    }

    return NextResponse.json({ vessels, isDemo: false });
  } catch (err) {
    console.error("[vessels] error:", err);
    return NextResponse.json({ vessels: DEMO_VESSELS, isDemo: true, error: String(err) });
  }
}
