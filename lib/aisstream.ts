import WS from "ws";
import { Vessel, TrailPoint } from "@/types/index";
import { getCountryFromMMSI } from "@/constants/countries";
import { isShadowFleetVessel, getShadowFleetEntry } from "./shadow-fleet";
import { AIS_BOUNDING_BOX } from "@/constants/regions";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const MAX_TRAIL = 20;

// ─── AIS message types ────────────────────────────────────────────────────────

interface AISMeta {
  MMSI: number;
  ShipName: string;
  latitude: number;
  longitude: number;
  time_utc: string;
}

interface PositionReport {
  Cog: number;
  NavigationalStatus: number;
  Sog: number;
  TrueHeading: number;
  Latitude: number;
  Longitude: number;
}

interface ShipStaticData {
  CallSign: string;
  Destination: string;
  Draught: number;
  ImoNumber: number;
  Type: number;
  Name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = Record<string, any>;

interface AISMessage {
  MessageType: string;
  MetaData: AISMeta;
  Message: {
    PositionReport?: PositionReport;
    ShipStaticData?: ShipStaticData;
    StandardClassBPositionReport?: PositionReport;
  } & AnyMessage;
}

// ─── In-memory vessel store ───────────────────────────────────────────────────

type PartialVessel = Partial<Omit<Vessel, "trail">> & { trail?: TrailPoint[] };
const vesselStore = new Map<string, PartialVessel>();

function applyPosition(mmsi: string, meta: AISMeta, pos: PositionReport) {
  const existing = vesselStore.get(mmsi) ?? {};
  const lat = pos.Latitude ?? meta.latitude;
  const lng = pos.Longitude ?? meta.longitude;
  const now = Date.now();

  const trail = existing.trail ?? [];
  if (lat != null && lng != null) {
    trail.push({ lat, lng, t: now });
    if (trail.length > MAX_TRAIL) trail.splice(0, trail.length - MAX_TRAIL);
  }

  vesselStore.set(mmsi, {
    ...existing,
    mmsi,
    name: meta.ShipName?.trim() || existing.name || mmsi,
    lat,
    lng,
    sog: pos.Sog ?? 0,
    cog: pos.Cog ?? 0,
    heading: pos.TrueHeading !== 511 ? pos.TrueHeading : (pos.Cog ?? 0),
    navStatus: pos.NavigationalStatus ?? 15,
    lastUpdated: now,
    trail,
  });
}

function applyStatic(mmsi: string, meta: AISMeta, s: ShipStaticData) {
  const existing = vesselStore.get(mmsi) ?? {};
  vesselStore.set(mmsi, {
    ...existing,
    mmsi,
    name: s.Name?.trim() || meta.ShipName?.trim() || existing.name || mmsi,
    callsign: s.CallSign?.trim() || "",
    imo: s.ImoNumber ? String(s.ImoNumber) : (existing.imo ?? ""),
    shipType: s.Type ?? existing.shipType ?? 0,
    destination: s.Destination?.trim() || existing.destination || "",
    draught: s.Draught ?? existing.draught ?? 0,
    lastUpdated: Date.now(),
  });
}

function processMessage(msg: AISMessage) {
  const mmsi = String(msg.MetaData?.MMSI ?? "");
  if (!mmsi) return;

  // Baseline from MetaData
  const metaLat = msg.MetaData?.latitude;
  const metaLng = msg.MetaData?.longitude;
  if (metaLat != null && metaLng != null) {
    const existing = vesselStore.get(mmsi) ?? {};
    const trail = existing.trail ?? [];
    const now = Date.now();
    trail.push({ lat: metaLat, lng: metaLng, t: now });
    if (trail.length > MAX_TRAIL) trail.splice(0, trail.length - MAX_TRAIL);
    vesselStore.set(mmsi, {
      ...existing,
      mmsi,
      name: msg.MetaData.ShipName?.trim() || existing.name || mmsi,
      lat: metaLat,
      lng: metaLng,
      lastUpdated: now,
      trail,
    });
  }

  const pos = msg.Message?.PositionReport ?? msg.Message?.StandardClassBPositionReport;
  if (pos) applyPosition(mmsi, msg.MetaData, pos);

  const s = msg.Message?.ShipStaticData;
  if (s) applyStatic(mmsi, msg.MetaData, s);
}

function finalizeVessels(): Vessel[] {
  const results: Vessel[] = [];

  for (const [mmsi, partial] of Array.from(vesselStore.entries())) {
    if (partial.lat == null || partial.lng == null) continue;

    const imo = partial.imo ?? "";
    const shadowEntry = getShadowFleetEntry(imo);
    const country = getCountryFromMMSI(mmsi);

    results.push({
      mmsi,
      imo,
      name: partial.name ?? mmsi,
      callsign: partial.callsign ?? "",
      shipType: partial.shipType ?? 0,
      lat: partial.lat,
      lng: partial.lng,
      sog: partial.sog ?? 0,
      cog: partial.cog ?? 0,
      heading: partial.heading ?? 0,
      navStatus: partial.navStatus ?? 15,
      destination: partial.destination ?? "",
      draught: partial.draught ?? 0,
      lastUpdated: partial.lastUpdated ?? Date.now(),
      trail: partial.trail ?? [],

      // Enriched — sanctions/shadow fleet filled by API route after fetching sanctions list
      country,
      isSanctioned: false,
      sanctionPrograms: [],
      sanctionSource: null,
      isShadowFleet: isShadowFleetVessel(imo),
      shadowFleetSource: shadowEntry?.source ?? "",
      shadowFleetFormerNames: shadowEntry?.formerNames ?? [],
      isGoingDark: false,
      darkSinceMs: 0,
      isPossibleSTS: false,
      stsPartnerMMSI: "",
      stsPartnerName: "",
      departedTerminal: "",
    });
  }

  return results;
}

// ─── One-shot WebSocket fetch ─────────────────────────────────────────────────

export async function fetchVesselsViaAIS(
  apiKey: string,
  collectMs = 20_000
): Promise<Vessel[]> {
  vesselStore.clear();

  return new Promise((resolve) => {
    let ws: WS;
    try {
      ws = new WS(AISSTREAM_URL);
    } catch {
      resolve([]);
      return;
    }

    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      const vessels = finalizeVessels();
      console.log(`[AIS] done — ${vesselStore.size} raw, ${vessels.length} finalized`);
      try { ws.close(); } catch {}
      resolve(vessels);
    };

    const timer = setTimeout(done, collectMs);

    ws.on("open", () => {
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [AIS_BOUNDING_BOX],
      }));
    });

    ws.on("message", (data: WS.RawData) => {
      try {
        const raw = typeof data === "string" ? data : data.toString("utf8");
        processMessage(JSON.parse(raw) as AISMessage);
      } catch {}
    });

    ws.on("error", done);
    ws.on("close", done);
  });
}
