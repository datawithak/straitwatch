"use client";

import { Vessel } from "@/types/index";
import { COUNTRY_LABELS, COUNTRY_COLORS, COUNTRY_DESCRIPTIONS } from "@/constants/countries";
import { getVesselTypeLabel, getNavStatusSimple } from "@/constants/vessel-types";
import { formatDarkDuration } from "@/lib/going-dark";
import { getTerminalInfo } from "@/lib/departure-terminal";

const CHINA_PORTS = ["NINGBO","ZHOUSHAN","QINGDAO","TIANJIN","DALIAN","SHANGHAI","GUANGZHOU","SHENZHEN","YANGSHAN","HONG KONG","HUIZHOU","RIZHAO"];
const INDIA_PORTS = ["MUNDRA","SIKKA","PARADIP","HALDIA","CHENNAI","COCHIN","VADINAR","JAMNAGAR","VIZAG","KANDLA","MANGALORE"];

function getDestinationInsight(destination: string): { label: string; text: string } | null {
  const d = destination.toUpperCase();
  if (CHINA_PORTS.some((p) => d.includes(p)))
    return { label: "→ Bound for China", text: "China is the world's largest buyer of Gulf crude, including sanctioned Iranian and Russian oil purchased at steep discounts. This vessel's destination suggests it is part of that supply chain." };
  if (INDIA_PORTS.some((p) => d.includes(p)))
    return { label: "→ Bound for India", text: "India has dramatically increased its purchases of discounted Russian and Iranian crude since 2022 sanctions. If this vessel is carrying sanctioned cargo, India is a primary destination." };
  return null;
}

interface Props {
  vessel: Vessel;
  onClose: () => void;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block text-xs font-bold px-2 py-0.5 rounded"
      style={{ background: color + "22", color, border: `1px solid ${color}55` }}
    >
      {label}
    </span>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-white/5">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-xs text-slate-400 shrink-0">{label}</span>
        <span className="text-xs text-white text-right font-medium">{value || "—"}</span>
      </div>
      {sub && <p className="text-xs text-slate-500 leading-snug">{sub}</p>}
    </div>
  );
}

export default function VesselDetail({ vessel, onClose }: Props) {
  const color = COUNTRY_COLORS[vessel.country];
  const typeLabel = getVesselTypeLabel(vessel.shipType);
  const statusLabel = getNavStatusSimple(vessel.navStatus);
  const terminalInfo = vessel.departedTerminal ? getTerminalInfo(vessel.departedTerminal) : null;

  // Plain English speed/status description
  const motionDesc = vessel.sog < 0.5
    ? "Nearly stopped — anchored or drifting"
    : vessel.sog < 3
    ? "Moving very slowly — possibly transferring cargo"
    : vessel.sog < 8
    ? `Moving slowly at ${vessel.sog.toFixed(1)} knots`
    : `Underway at ${vessel.sog.toFixed(1)} knots`;

  const draughtDesc = vessel.draught > 0
    ? vessel.draught > 12
      ? `${vessel.draught}m — fully loaded`
      : vessel.draught > 6
      ? `${vessel.draught}m — partially loaded`
      : `${vessel.draught}m — likely in ballast (empty)`
    : "";

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="font-bold text-base leading-tight">{vessel.name || vessel.mmsi}</h2>
          <p className="text-xs mt-0.5" style={{ color }}>{typeLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-lg leading-none ml-2 shrink-0"
        >×</button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2">
        {vessel.isSanctioned && <Badge label="⚠ OFAC SANCTIONED" color="#ef4444" />}
        {vessel.sanctionSource === "EU" && <Badge label="EU SANCTIONED" color="#f97316" />}
        {vessel.isShadowFleet && <Badge label="🟣 SHADOW FLEET" color="#8b5cf6" />}
        {vessel.isPossibleSTS && <Badge label="⚡ POSSIBLE STS" color="#eab308" />}
        {vessel.isGoingDark && <Badge label="◯ GOING DARK" color="#9ca3af" />}
        {vessel.departedTerminal && <Badge label={`📍 ${vessel.departedTerminal}`} color="#f97316" />}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* Plain English what's happening */}
        {(vessel.isSanctioned || vessel.isShadowFleet || vessel.isPossibleSTS || vessel.isGoingDark) && (
          <div className="bg-white/5 rounded-lg p-3 mt-2">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">What this means</p>
            {vessel.isPossibleSTS && (
              <p className="text-xs text-slate-200 leading-relaxed mb-2">
                This tanker has been stopped alongside another vessel offshore. Ship-to-ship transfers are how sanctioned oil changes hands without creating a port record — the cargo effectively disappears from the paper trail.
              </p>
            )}
            {vessel.isGoingDark && (
              <p className="text-xs text-slate-200 leading-relaxed mb-2">
                This vessel stopped broadcasting its AIS location {formatDarkDuration(vessel.darkSinceMs)} ago. Ships go dark to hide their position — usually during sanctioned cargo transfers or to avoid enforcement.
              </p>
            )}
            {vessel.isShadowFleet && !vessel.isPossibleSTS && (
              <p className="text-xs text-slate-200 leading-relaxed mb-2">
                {vessel.country === "russia"
                  ? "Russia assembled ~600 old tankers under obscure flags to move sanctioned crude to India and China while avoiding Western tracking."
                  : "This vessel appears on public shadow fleet tracking lists. It likely operates to move sanctioned cargo while obscuring the real owner."}
              </p>
            )}
            {vessel.isSanctioned && !vessel.isShadowFleet && (
              <p className="text-xs text-slate-200 leading-relaxed">
                This vessel is on the OFAC sanctions list. Western companies are legally prohibited from providing any services to it — including insurance, port access, fuel, and repairs.
              </p>
            )}
            {vessel.departedTerminal && terminalInfo && (
              <p className="text-xs text-slate-200 leading-relaxed mt-1">
                Recently departed {terminalInfo.name} — {terminalInfo.description}
              </p>
            )}
          </div>
        )}

        {/* Destination insight */}
        {vessel.destination && (() => {
          const insight = getDestinationInsight(vessel.destination);
          if (!insight) return null;
          return (
            <div className="bg-white/5 rounded-lg p-3 mt-2">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">{insight.label}</p>
              <p className="text-xs text-slate-200 leading-relaxed">{insight.text}</p>
            </div>
          );
        })()}

        {/* Country context */}
        <div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Flag state</p>
          <p className="text-xs font-semibold" style={{ color }}>
            {COUNTRY_LABELS[vessel.country]}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            {COUNTRY_DESCRIPTIONS[vessel.country]}
          </p>
        </div>

        {/* Vessel data in plain English */}
        <div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Vessel data</p>
          <Row label="Type" value={typeLabel} />
          <Row label="Moving" value={motionDesc} />
          <Row label="Status" value={statusLabel} />
          {draughtDesc && <Row label="Cargo signal" value={draughtDesc} />}
          {vessel.destination && (
            <Row
              label="Reported destination"
              value={vessel.destination}
              sub="Self-reported — vessels often leave this blank or inaccurate."
            />
          )}
          {vessel.shadowFleetFormerNames.length > 0 && (
            <Row
              label="Former names"
              value={vessel.shadowFleetFormerNames.join(", ")}
              sub="Sanctioned ships frequently change names to avoid detection."
            />
          )}
        </div>

        {/* Technical IDs */}
        <div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Identifiers</p>
          <Row label="MMSI" value={vessel.mmsi} sub="Maritime Mobile Service Identity" />
          {vessel.imo && (
            <Row
              label="IMO"
              value={vessel.imo}
              sub="International Maritime Organization — permanent vessel ID."
            />
          )}
          {vessel.callsign && <Row label="Call sign" value={vessel.callsign} />}
        </div>

        {/* Sanctions detail */}
        {vessel.isSanctioned && (
          <div className="bg-red-950/40 border border-red-800/30 rounded-lg p-3">
            <p className="text-xs font-bold text-red-400 mb-1">⚠ US Treasury Sanctioned</p>
            {vessel.sanctionPrograms.length > 0 && (
              <p className="text-xs text-red-200">
                Programs: {vessel.sanctionPrograms.join(", ")}
              </p>
            )}
            <p className="text-xs text-red-300 mt-1 leading-relaxed">
              Western P&I insurance clubs (Lloyd&apos;s, Gard, Skuld) cannot legally cover this vessel. It is likely operating without internationally recognized insurance.
            </p>
          </div>
        )}

        {/* STS partner */}
        {vessel.isPossibleSTS && vessel.stsPartnerName && (
          <div className="bg-yellow-950/40 border border-yellow-800/30 rounded-lg p-3">
            <p className="text-xs font-bold text-yellow-400 mb-1">⚡ STS Transfer Partner</p>
            <p className="text-xs text-yellow-200">{vessel.stsPartnerName}</p>
            <p className="text-xs text-yellow-300 mt-1">MMSI: {vessel.stsPartnerMMSI}</p>
          </div>
        )}

        {/* Verify externally */}
        {vessel.imo && (
          <a
            href={`https://www.marinetraffic.com/en/ais/details/ships/imo:${vessel.imo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded py-2 transition-colors"
          >
            Verify on MarineTraffic ↗
          </a>
        )}
      </div>
    </div>
  );
}
