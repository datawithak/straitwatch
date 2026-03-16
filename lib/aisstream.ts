import WS from "ws";
import { Vessel, TrailPoint } from "@/types/index";
import { getCountryFromMMSI } from "@/constants/countries";
import { isShadowFleetVessel, getShadowFleetEntry } from "./shadow-fleet";
import { AIS_BOUNDING_BOX } from "@/constants/regions";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const MAX_TRAIL = 20;
const STALE_MS = 15 * 60 * 1000; // prune vessels not seen in 15 min

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

// ─── Persistent vessel store ──────────────────────────────────────────────────
// Never cleared between API calls — static data (name, type, IMO) accumulates
// across multiple calls. Stale vessels pruned after 15 minutes.

type PartialVessel = Partial<Omit<Vessel, "trail">> & { trail?: TrailPoint[] };

const vesselStore = new Map<string, PartialVessel>();

function pruneStale() {
  const cutoff = Date.now() - STALE_MS;
  for (const [mmsi, v] of Array.from(vesselStore.entries())) {
    if ((v.lastUpdated ?? 0) < cutoff) vesselStore.delete(mmsi);
  }
}

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
    sog: pos.Sog ?? existing.sog ?? 0,
    cog: pos.Cog ?? existing.cog ?? 0,
    heading: pos.TrueHeading !== 511 ? pos.TrueHeading : (pos.Cog ?? existing.heading ?? 0),
    navStatus: pos.NavigationalStatus ?? existing.navStatus ?? 15,
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
    callsign: s.CallSign?.trim() || existing.callsign || "",
    imo: s.ImoNumber ? String(s.ImoNumber) : (existing.imo ?? ""),
    // Only overwrite shipType if we actually got a non-zero value
    shipType: (s.Type && s.Type !== 0) ? s.Type : (existing.shipType ?? 0),
    destination: s.Destination?.trim() || existing.destination || "",
    draught: s.Draught ?? existing.draught ?? 0,
    lastUpdated: existing.lastUpdated ?? Date.now(),
  });
}

function processMessage(msg: AISMessage) {
  const mmsi = String(msg.MetaData?.MMSI ?? "");
  if (!mmsi) return;

  // Baseline from MetaData — position always available here
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

function buildVessels(): Vessel[] {
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

// ─── One-shot WebSocket fetch — merges into persistent store ──────────────────

export async function fetchVesselsViaAIS(
  apiKey: string,
  collectMs = 30_000
): Promise<Vessel[]> {
  pruneStale(); // remove vessels not seen in 15 min, keep the rest

  return new Promise((resolve) => {
    let ws: WS;
    try {
      ws = new WS(AISSTREAM_URL);
    } catch {
      resolve(buildVessels()); // return what we have
      return;
    }

    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      const vessels = buildVessels();
      console.log(`[AIS] done — store: ${vesselStore.size} vessels, ${vessels.filter(v => v.shipType >= 80 && v.shipType <= 89).length} tankers`);
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

// Export store size for debugging
export function getStoreSize() { return vesselStore.size; }
