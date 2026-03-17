"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Polygon,
  Tooltip,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Vessel, RegionKey, StoryHighlight } from "@/types/index";
import { REGIONS } from "@/constants/regions";
import { COUNTRY_COLORS } from "@/constants/countries";
import { IntelItem } from "@/types/intel";

// Fix Leaflet default icon in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Region fly-to controller ─────────────────────────────────────────────────

function RegionController({ region }: { region: RegionKey }) {
  const map = useMap();
  useEffect(() => {
    const r = REGIONS[region];
    map.flyToBounds(
      [[r.bounds.lat_min, r.bounds.lon_min], [r.bounds.lat_max, r.bounds.lon_max]],
      { duration: 0.8, padding: [20, 20] }
    );
  }, [region, map]);
  return null;
}

// ─── FlyTo controller (for intel "View on map") ───────────────────────────────

function FlyToController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  const prevTarget = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    // Only fly if target actually changed (avoid re-flying on unrelated re-renders)
    if (prevTarget.current?.lat === target.lat && prevTarget.current?.lng === target.lng) return;
    prevTarget.current = target;
    map.flyTo([target.lat, target.lng], 8, { duration: 1.2 });
  }, [target, map]);
  return null;
}

// ─── Chokepoint highlight polygons ────────────────────────────────────────────

const CHOKEPOINT_POLYGONS: { name: string; positions: [number, number][] }[] = [
  {
    name: "Strait of Hormuz",
    positions: [
      [26.2, 55.7], [27.1, 55.7], [27.2, 56.4],
      [27.0, 57.3], [26.5, 57.5], [26.0, 57.0], [26.1, 56.2],
    ],
  },
  {
    name: "Bab al-Mandab",
    positions: [
      [12.9, 42.9], [13.0, 43.5], [12.7, 44.0],
      [12.0, 43.9], [11.8, 43.3], [12.3, 42.9],
    ],
  },
];

function ChokepointPolygons() {
  return (
    <>
      {CHOKEPOINT_POLYGONS.map(({ name, positions }) => (
        <Polygon
          key={name}
          positions={positions}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.06,
            weight: 1,
            opacity: 0.25,
            dashArray: "5 5",
          }}
          interactive={false}
        />
      ))}
    </>
  );
}

// ─── Map annotation labels ────────────────────────────────────────────────────

// Chokepoint + zone annotations (bold, with subtitle)
const MAP_ANNOTATIONS = [
  {
    lat: 26.5, lng: 56.5,
    lines: ["STRAIT OF HORMUZ", "21% of world's oil passes here daily"],
  },
  {
    lat: 12.5, lng: 43.5,
    lines: ["BAB AL-MANDAB", "Houthi attack zone, Red Sea entry"],
  },
  {
    lat: 23.5, lng: 59.5,
    lines: ["GULF OF OMAN", "Shadow fleet STS transfer zone"],
  },
  {
    lat: 25.1, lng: 56.4,
    lines: ["FUJAIRAH", "World's largest bunkering hub"],
  },
];

// Country labels — orient the non-expert user
const COUNTRY_LABELS_MAP = [
  // Persian Gulf countries
  { lat: 28.5,  lng: 54.0,  name: "IRAN" },
  { lat: 26.0,  lng: 55.8,  name: "UAE" },
  { lat: 22.5,  lng: 58.5,  name: "OMAN" },
  { lat: 24.5,  lng: 50.5,  name: "SAUDI ARABIA" },
  { lat: 29.0,  lng: 47.8,  name: "KUWAIT" },
  { lat: 25.3,  lng: 51.2,  name: "QATAR" },
  { lat: 31.0,  lng: 47.5,  name: "IRAQ" },
  // Red Sea / Bab al-Mandab
  { lat: 15.5,  lng: 44.5,  name: "YEMEN" },
  { lat: 11.8,  lng: 42.8,  name: "DJIBOUTI" },
  { lat: 20.0,  lng: 37.5,  name: "SAUDI ARABIA" },
  { lat: 25.5,  lng: 34.0,  name: "EGYPT" },
  { lat: 14.2,  lng: 44.5,  name: "↑ Houthi-controlled" },
];

function MapAnnotations() {
  const map = useMap();
  useEffect(() => {
    const markers: L.Marker[] = [];

    // Chokepoint annotations — bold with subtitle
    for (const ann of MAP_ANNOTATIONS) {
      const icon = L.divIcon({
        className: "map-annotation",
        html: ann.lines
          .map((line, i) =>
            i === 0
              ? `<div style="font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.9);letter-spacing:0.08em;">${line}</div>`
              : `<div style="font-size:9px;font-weight:500;color:#e2e8f0;text-shadow:0 1px 3px rgba(0,0,0,0.9);margin-top:1px;">${line}</div>`
          )
          .join(""),
        iconAnchor: [60, 10],
        iconSize: [120, 30],
      });
      const m = L.marker([ann.lat, ann.lng], { icon, interactive: false, zIndexOffset: -1000 });
      m.addTo(map);
      markers.push(m);
    }

    // Country labels — smaller, colored by geopolitical importance
    for (const cl of COUNTRY_LABELS_MAP) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="font-size:9px;font-weight:700;color:#111;text-shadow:0 0 3px #fff,0 0 3px #fff;letter-spacing:0.1em;white-space:nowrap;pointer-events:none;">${cl.name}</div>`,
        iconAnchor: [30, 6],
        iconSize: [80, 12],
      });
      const m = L.marker([cl.lat, cl.lng], { icon, interactive: false, zIndexOffset: -2000 });
      m.addTo(map);
      markers.push(m);
    }

    return () => { markers.forEach((m) => m.removeFrom(map)); };
  }, [map]);
  return null;
}

// ─── Incident markers (intel items with coordinates) ─────────────────────────

function IncidentMarkers({ items }: { items: IntelItem[] }) {
  const withCoords = items.filter((i) => i.lat != null && i.lng != null);
  if (withCoords.length === 0) return null;

  return (
    <>
      {withCoords.map((item) => {
        const color =
          item.severity === "high" ? "#ef4444" :
          item.severity === "medium" ? "#eab308" : "#6b7280";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:20px;height:20px;background:${color}22;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${color};line-height:1;">!</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        return (
          <Marker
            key={item.id}
            position={[item.lat!, item.lng!]}
            icon={icon}
            zIndexOffset={-500}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700, color, marginBottom: 2 }}>
                  {item.sourceShort} ADVISORY
                </div>
                <div style={{ maxWidth: 220 }}>{item.title}</div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

// ─── Vessel marker ────────────────────────────────────────────────────────────

const CHINA_PORTS = ["NINGBO","ZHOUSHAN","QINGDAO","TIANJIN","DALIAN","SHANGHAI","GUANGZHOU","SHENZHEN","YANGSHAN","HONG KONG","HUIZHOU","RIZHAO"];
const INDIA_PORTS = ["MUNDRA","SIKKA","PARADIP","HALDIA","CHENNAI","COCHIN","VADINAR","JAMNAGAR","VIZAG","KANDLA","MANGALORE"];

function getDestinationDot(destination: string): { color: string; title: string } | null {
  const d = destination.toUpperCase();
  if (CHINA_PORTS.some((p) => d.includes(p))) return { color: "#FF4444", title: "→ China" };
  if (INDIA_PORTS.some((p) => d.includes(p))) return { color: "#FF9933", title: "→ India" };
  return null;
}

function makeVesselIcon(vessel: Vessel): L.DivIcon {
  const color = COUNTRY_COLORS[vessel.country];
  const size = vessel.draught > 12 ? 14 : vessel.draught > 8 ? 12 : 10;
  const rotation = vessel.heading || vessel.cog || 0;

  let ringStyle = "";
  if (vessel.isSanctioned) {
    ringStyle = `animation:pulse-red 1.4s infinite;box-shadow:0 0 0 0 rgba(204,41,41,0.7);`;
  } else if (vessel.isPossibleSTS) {
    ringStyle = `animation:pulse-yellow 1.4s infinite;box-shadow:0 0 0 0 rgba(234,179,8,0.7);`;
  } else if (vessel.isShadowFleet) {
    ringStyle = `animation:pulse-purple 2.5s infinite;box-shadow:0 0 0 0 rgba(139,92,246,0.6);`;
  }

  const opacity = vessel.isGoingDark ? "0.45" : "1";
  const border = vessel.isGoingDark ? "2px dashed #9ca3af" : `2px solid ${color}`;

  const destDot = vessel.destination ? getDestinationDot(vessel.destination) : null;

  const html = `
    <div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border};
      border-radius:2px;
      transform:rotate(${rotation}deg);
      opacity:${opacity};
      ${ringStyle}
      position:relative;
    ">
      ${vessel.departedTerminal ? `<div style="position:absolute;top:-4px;right:-4px;width:6px;height:6px;background:#f97316;border-radius:50%;border:1px solid white;"></div>` : ""}
      ${destDot ? `<div style="position:absolute;bottom:-4px;left:-4px;width:6px;height:6px;background:${destDot.color};border-radius:50%;border:1px solid white;"></div>` : ""}
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─── Main map component ───────────────────────────────────────────────────────

interface Props {
  vessels: Vessel[];
  selectedMMSI: string | null;
  region: RegionKey;
  highlight: StoryHighlight | null;
  intelItems: IntelItem[];
  flyToTarget: { lat: number; lng: number } | null;
  onSelectVessel: (v: Vessel) => void;
}

function shouldHighlight(v: Vessel, highlight: StoryHighlight | null): boolean {
  if (!highlight) return true;
  if (Object.keys(highlight).length === 0) return true;

  // Destination-keyword check — a vessel passes if its destination matches any keyword
  const destMatch = highlight.destinationKeywords?.length
    ? highlight.destinationKeywords.some((kw) =>
        v.destination?.toUpperCase().includes(kw)
      )
    : false;

  // Country check — passes if flag country matches OR destination matches
  if (highlight.countries) {
    const countryMatch = highlight.countries.includes(v.country);
    if (!countryMatch && !destMatch) return false;
  } else if (highlight.destinationKeywords?.length && !destMatch) {
    return false;
  }

  if (highlight.isSanctioned && !v.isSanctioned) return false;
  // Shadow fleet: match if in DB OR flies a known shadow flag (Palau/Gabon/Cook Islands etc.)
  if (highlight.isShadowFleet && !v.isShadowFleet && v.country !== "shadow-flag") return false;
  if (highlight.isPossibleSTS && !v.isPossibleSTS) return false;
  if (highlight.departedTerminal && !v.departedTerminal) return false;
  return true;
}

export default function StraitMap({
  vessels, selectedMMSI, region, highlight, intelItems, flyToTarget, onSelectVessel,
}: Props) {
  const initialRegion = REGIONS.global;

  return (
    <MapContainer
      center={[initialRegion.center[0], initialRegion.center[1]]}
      zoom={initialRegion.zoom}
      maxZoom={10}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      {/* ESRI Ocean basemap — green/blue/brown, free, no key */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri | AIS: aisstream.io | OFAC: US Treasury"
        maxZoom={10}
      />

      <RegionController region={region} />
      <FlyToController target={flyToTarget} />
      <MapAnnotations />
      <ChokepointPolygons />
      <IncidentMarkers items={intelItems} />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        disableClusteringAtZoom={8}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
      >
        {vessels.map((v) => {
          const dimmed = highlight !== null && !shouldHighlight(v, highlight);
          const icon = makeVesselIcon(v);

          return (
            <Marker
              key={v.mmsi}
              position={[v.lat, v.lng]}
              icon={icon}
              opacity={dimmed ? 0.15 : 1}
              eventHandlers={{ click: () => onSelectVessel(v) }}
              zIndexOffset={v.isSanctioned ? 500 : v.isPossibleSTS ? 400 : v.isShadowFleet ? 300 : 0}
            >
              {/* Trail polyline */}
              {v.trail.length > 1 && !dimmed && (
                <Polyline
                  positions={v.trail.map((p) => [p.lat, p.lng] as [number, number])}
                  color={COUNTRY_COLORS[v.country]}
                  weight={1.5}
                  opacity={0.4}
                />
              )}
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 700 }}>{v.name || v.mmsi}</div>
                  {v.isSanctioned && (
                    <div style={{ color: "#f87171", fontSize: 10 }}>⚠ OFAC SANCTIONED</div>
                  )}
                  {v.isPossibleSTS && (
                    <div style={{ color: "#fbbf24", fontSize: 10 }}>⚡ POSSIBLE STS TRANSFER</div>
                  )}
                  {v.isShadowFleet && (
                    <div style={{ color: "#a78bfa", fontSize: 10 }}>🟣 SHADOW FLEET</div>
                  )}
                  {v.isGoingDark && (
                    <div style={{ color: "#9ca3af", fontSize: 10 }}>◯ GOING DARK</div>
                  )}
                  {v.departedTerminal && (
                    <div style={{ color: "#fb923c", fontSize: 10 }}>📍 Departed: {v.departedTerminal}</div>
                  )}
                  {v.destination && getDestinationDot(v.destination) && (
                    <div style={{ color: getDestinationDot(v.destination)!.color, fontSize: 10 }}>
                      ● Dest: {v.destination}
                    </div>
                  )}
                  <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 2 }}>
                    {v.sog.toFixed(1)} kn · Click for details
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
