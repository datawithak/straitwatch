export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import WS from "ws";
import { getCountryFromMMSI } from "@/constants/countries";
import sanctionedJson from "@/data/sanctioned-vessels.json";

const SANCTIONED_MAP = new Map<string, { programs: string[]; name: string; aliases?: string[] }>(
  Object.entries(sanctionedJson as Record<string, { programs: string[]; name: string; aliases?: string[] }>)
);
const SANCTIONED_BY_NAME = new Map<string, { programs: string[] }>();
for (const data of SANCTIONED_MAP.values()) {
  if (data.name) SANCTIONED_BY_NAME.set(data.name.toUpperCase().trim(), { programs: data.programs });
  for (const alias of (data.aliases ?? [])) {
    SANCTIONED_BY_NAME.set(alias.toUpperCase().trim(), { programs: data.programs });
  }
}

import shadowJson from "@/data/shadow-fleet.json";
import { ShadowFleetEntry } from "@/types/index";
const SHADOW_BY_NAME = new Map<string, ShadowFleetEntry>();
for (const entry of (shadowJson as ShadowFleetEntry[])) {
  if (entry.name) SHADOW_BY_NAME.set(entry.name.toUpperCase().trim(), entry);
  for (const fn of (entry.formerNames ?? [])) {
    SHADOW_BY_NAME.set(fn.toUpperCase().trim(), entry);
  }
}

import { isShadowFleetVessel, getShadowFleetEntry } from "@/lib/shadow-fleet";
import { getTerminalFromPosition } from "@/lib/departure-terminal";
import { AIS_BOUNDING_BOX } from "@/constants/regions";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const MAX_TRAIL = 20;
const STALE_MS = 15 * 60 * 1000;

// ─── Module-level persistent store ───────────────────────────────────────────

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
  departedTerminal: string;
}

const store = new Map<string, Partial<StoredVessel>>();
const encoder = new TextEncoder();

// Active SSE controllers — shared WS broadcasts to all of them
const sseClients = new Set<ReadableStreamDefaultController>();

// Single persistent WS connection shared across all SSE clients
let globalWs: InstanceType<typeof WS> | null = null;
let globalApiKey = "";

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

  const currentLat = lat ?? existing.lat ?? 0;
  const currentLng = lng ?? existing.lng ?? 0;

  const terminalHit = (lat != null && lng != null) ? getTerminalFromPosition(lat, lng) : "";
  const departedTerminal = terminalHit || existing.departedTerminal || "";

  const updated: Partial<StoredVessel> = {
    ...existing,
    mmsi,
    name: s?.Name?.trim() || msg.MetaData?.ShipName?.trim() || existing.name || mmsi,
    lat: currentLat,
    lng: currentLng,
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
    departedTerminal,
  };

  store.set(mmsi, updated);
  return updated;
}

function enrichVessel(v: Partial<StoredVessel>) {
  const mmsi = v.mmsi ?? "";
  const imo = v.imo ?? "";
  const nameKey = (v.name ?? "").toUpperCase().trim();
  const sanctionEntry = SANCTIONED_MAP.get(imo) ?? SANCTIONED_BY_NAME.get(nameKey);
  const shadowEntry = getShadowFleetEntry(imo) ?? SHADOW_BY_NAME.get(nameKey) ?? null;
  return {
    ...v,
    country: getCountryFromMMSI(mmsi),
    isSanctioned: !!sanctionEntry,
    sanctionPrograms: sanctionEntry?.programs ?? [],
    sanctionSource: sanctionEntry ? "OFAC" : null,
    isShadowFleet: !!shadowEntry || isShadowFleetVessel(imo),
    shadowFleetSource: shadowEntry?.source ?? "",
    shadowFleetFormerNames: shadowEntry?.formerNames ?? [],
    departedTerminal: v.departedTerminal ?? "",
  };
}

function broadcastToClients(data: unknown) {
  const encoded = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const ctrl of Array.from(sseClients)) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      sseClients.delete(ctrl);
    }
  }
}

// ─── Persistent module-level WebSocket ───────────────────────────────────────

function ensureWsConnected() {
  if (globalWs && (globalWs.readyState === WS.OPEN || globalWs.readyState === WS.CONNECTING)) {
    return;
  }

  globalWs = new WS(AISSTREAM_URL);

  globalWs.on("open", () => {
    globalWs!.send(JSON.stringify({
      APIKey: globalApiKey,
      BoundingBoxes: [AIS_BOUNDING_BOX],
    }));
  });

  globalWs.on("message", (data: WS.RawData) => {
    try {
      const raw = typeof data === "string" ? data : data.toString("utf8");
      const msg = JSON.parse(raw);
      const vessel = processMsg(msg);
      if (!vessel || vessel.lat == null) return;
      broadcastToClients(enrichVessel(vessel));
    } catch {}
  });

  globalWs.on("error", () => {
    globalWs = null;
    // Reconnect after 5s
    setTimeout(ensureWsConnected, 5000);
  });

  globalWs.on("close", () => {
    globalWs = null;
    // Auto-reconnect as long as there are clients watching
    if (sseClients.size > 0) {
      setTimeout(ensureWsConnected, 5000);
    }
  });
}

// ─── SSE route ────────────────────────────────────────────────────────────────

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY ?? "";

  if (!apiKey) {
    return new Response("No API key configured", { status: 503 });
  }

  globalApiKey = apiKey;
  pruneStale();

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let myController: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      myController = controller;
      sseClients.add(controller);

      // Heartbeat every 30s to prevent Render from closing idle SSE connections
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          sseClients.delete(controller);
        }
      }, 30000);

      // Flush current store immediately so the client sees ships right away
      for (const [, v] of Array.from(store.entries())) {
        if (v.lat == null || v.lng == null) continue;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(enrichVessel(v))}\n\n`));
        } catch {}
      }

      // Start/reuse the shared WS connection
      ensureWsConnected();
    },

    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (myController) sseClients.delete(myController);
      // If no clients left, let the WS idle (it will reconnect when next client arrives)
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
