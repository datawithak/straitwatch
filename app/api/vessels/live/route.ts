export const runtime = "nodejs";

import WS from "ws";
import { getCountryFromMMSI } from "@/constants/countries";
import { isShadowFleetVessel, getShadowFleetEntry } from "@/lib/shadow-fleet";
import { getSanctionedVessels } from "@/lib/sanctions";
import { AIS_BOUNDING_BOX } from "@/constants/regions";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const MAX_TRAIL = 20;
const STALE_MS = 15 * 60 * 1000;

// Pre-warm sanctions in the background so it's ready before anyone connects
// (avoids blocking the SSE stream open on a ~50MB download)
let sanctionedCache: Map<string, { programs: string[]; name: string }> = new Map();
getSanctionedVessels().then((s) => { sanctionedCache = s; }).catch(() => {});

// ─── Module-level persistent store (shared across SSE connections) ────────────

interface StoredVessel {
  mmsi: string;
  imo: string;
  name: string;
  callsign: string;
  shipType: number;
  lat: number;
  lng: number;
  sog: number;
  cog: number;
  heading: number;
  navStatus: number;
  destination: string;
  draught: number;
  lastUpdated: number;
  trail: Array<{ lat: number; lng: number; t: number }>;
}

const store = new Map<string, Partial<StoredVessel>>();

function pruneStale() {
  const cutoff = Date.now() - STALE_MS;
  for (const [mmsi, v] of Array.from(store.entries())) {
    if ((v.lastUpdated ?? 0) < cutoff) store.delete(mmsi);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processMsg(msg: Record<string, any>): Partial<StoredVessel> | null {
  const mmsi = String(msg.MetaData?.MMSI ?? "");
  if (!mmsi) return null;

  const metaLat = msg.MetaData?.latitude;
  const metaLng = msg.MetaData?.longitude;
  const now = Date.now();

  const existing = store.get(mmsi) ?? {};
  const trail = existing.trail ?? [];

  const pos =
    msg.Message?.PositionReport ?? msg.Message?.StandardClassBPositionReport;
  const s = msg.Message?.ShipStaticData;

  const lat = pos?.Latitude ?? metaLat ?? existing.lat;
  const lng = pos?.Longitude ?? metaLng ?? existing.lng;

  if (lat != null && lng != null) {
    trail.push({ lat, lng, t: now });
    if (trail.length > MAX_TRAIL) trail.splice(0, trail.length - MAX_TRAIL);
  }

  const updated: Partial<StoredVessel> = {
    ...existing,
    mmsi,
    name: s?.Name?.trim() || msg.MetaData?.ShipName?.trim() || existing.name || mmsi,
    lat: lat ?? existing.lat ?? 0,
    lng: lng ?? existing.lng ?? 0,
    sog: pos?.Sog ?? existing.sog ?? 0,
    cog: pos?.Cog ?? existing.cog ?? 0,
    heading: pos?.TrueHeading !== 511 ? (pos?.TrueHeading ?? existing.heading ?? 0) : (existing.heading ?? 0),
    navStatus: pos?.NavigationalStatus ?? existing.navStatus ?? 15,
    destination: s?.Destination?.trim() || existing.destination || "",
    draught: s?.Draught ?? existing.draught ?? 0,
    imo: s?.ImoNumber ? String(s.ImoNumber) : (existing.imo ?? ""),
    callsign: s?.CallSign?.trim() || existing.callsign || "",
    shipType: (s?.Type && s.Type !== 0) ? s.Type : (existing.shipType ?? 0),
    lastUpdated: now,
    trail,
  };

  store.set(mmsi, updated);
  return updated;
}

// ─── SSE route ────────────────────────────────────────────────────────────────

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY ?? "";

  if (!apiKey) {
    return new Response("No API key configured", { status: 503 });
  }

  const encoder = new TextEncoder();
  pruneStale();

  // Use whatever sanctions data is already in cache — don't block SSE on OFAC download
  const sanctioned = sanctionedCache;

  let ws: InstanceType<typeof WS> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {}
      };

      // Send all currently stored vessels immediately so client gets instant state
      for (const [, v] of Array.from(store.entries())) {
        if (v.lat == null || v.lng == null) continue;
        const mmsi = v.mmsi ?? "";
        const imo = v.imo ?? "";
        const sanctionEntry = sanctioned.get(imo);
        const shadowEntry = getShadowFleetEntry(imo);
        send({
          ...v,
          country: getCountryFromMMSI(mmsi),
          isSanctioned: !!sanctionEntry,
          sanctionPrograms: sanctionEntry?.programs ?? [],
          sanctionSource: sanctionEntry ? "OFAC" : null,
          isShadowFleet: isShadowFleetVessel(imo),
          shadowFleetSource: shadowEntry?.source ?? "",
          shadowFleetFormerNames: shadowEntry?.formerNames ?? [],
        });
      }

      ws = new WS(AISSTREAM_URL);

      ws.on("open", () => {
        ws!.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [AIS_BOUNDING_BOX],
        }));
      });

      ws.on("message", (data: WS.RawData) => {
        try {
          const raw = typeof data === "string" ? data : data.toString("utf8");
          const msg = JSON.parse(raw);
          const vessel = processMsg(msg);
          if (!vessel || vessel.lat == null) return;

          const mmsi = vessel.mmsi ?? "";
          const imo = vessel.imo ?? "";
          const sanctionEntry = sanctioned.get(imo);
          const shadowEntry = getShadowFleetEntry(imo);

          send({
            ...vessel,
            country: getCountryFromMMSI(mmsi),
            isSanctioned: !!sanctionEntry,
            sanctionPrograms: sanctionEntry?.programs ?? [],
            sanctionSource: sanctionEntry ? "OFAC" : null,
            isShadowFleet: isShadowFleetVessel(imo),
            shadowFleetSource: shadowEntry?.source ?? "",
            shadowFleetFormerNames: shadowEntry?.formerNames ?? [],
          });
        } catch {}
      });

      ws.on("error", () => {
        try { controller.close(); } catch {}
      });

      ws.on("close", () => {
        try { controller.close(); } catch {}
      });
    },

    cancel() {
      // Client disconnected — close the upstream WebSocket
      try { ws?.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
