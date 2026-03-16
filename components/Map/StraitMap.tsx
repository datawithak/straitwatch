"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
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

// ─── Map annotation labels ────────────────────────────────────────────────────

const MAP_ANNOTATIONS = [
  {
    lat: 26.5, lng: 56.5,
    lines: ["STRAIT OF HORMUZ", "21% of world's oil passes here daily"],
  },
  {
    lat: 12.5, lng: 43.5,
    lines: ["BAB AL-MANDAB", "Houthi attack zone — Red Sea entry"],
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

function MapAnnotations() {
  const map = useMap();
  useEffect(() => {
    const labels: L.Marker[] = [];
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
      const marker = L.marker([ann.lat, ann.lng], { icon, interactive: false, zIndexOffset: -1000 });
      marker.addTo(map);
      labels.push(marker);
    }
    return () => { labels.forEach((l) => l.removeFrom(map)); };
  }, [map]);
  return null;
}

// ─── Vessel marker ────────────────────────────────────────────────────────────

function makeVesselIcon(vessel: Vessel): L.DivIcon {
  const color = COUNTRY_COLORS[vessel.country];
  const size = vessel.draught > 12 ? 14 : vessel.draught > 8 ? 12 : 10;
  const rotation = vessel.heading || vessel.cog || 0;

  let ringClass = "";
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
  onSelectVessel: (v: Vessel) => void;
}

function shouldHighlight(v: Vessel, highlight: StoryHighlight | null): boolean {
  if (!highlight) return true;
  if (Object.keys(highlight).length === 0) return true;
  if (highlight.countries && !highlight.countries.includes(v.country)) return false;
  if (highlight.isSanctioned && !v.isSanctioned) return false;
  if (highlight.isShadowFleet && !v.isShadowFleet) return false;
  if (highlight.isPossibleSTS && !v.isPossibleSTS) return false;
  if (highlight.departedTerminal && !v.departedTerminal) return false;
  return true;
}

export default function StraitMap({
  vessels, selectedMMSI, region, highlight, onSelectVessel,
}: Props) {
  const initialRegion = REGIONS.global;

  return (
    <MapContainer
      center={[initialRegion.center[0], initialRegion.center[1]]}
      zoom={initialRegion.zoom}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      {/* ESRI Ocean basemap — green/blue/brown, free, no key */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri | AIS: aisstream.io | OFAC: US Treasury"
        maxZoom={12}
      />

      <RegionController region={region} />
      <MapAnnotations />

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
                <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 2 }}>
                  {v.sog.toFixed(1)} kn · Click for details
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
