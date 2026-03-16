"use client";

import { COUNTRY_COLORS, COUNTRY_LABELS, COUNTRY_DESCRIPTIONS } from "@/constants/countries";
import { CountryKey } from "@/types/index";

const COUNTRIES: CountryKey[] = [
  "russia", "china", "iran", "india",
  "uae", "usa", "greece",
  "norway", "japan", "uk", "south-korea", "singapore",
  "flag-convenience", "shadow-flag", "other",
];

const RINGS = [
  { color: "#ef4444", label: "Pulsing red ring", desc: "OFAC or EU sanctioned vessel. Western companies cannot legally provide any services to this ship." },
  { color: "#eab308", label: "Pulsing yellow ring", desc: "Possible ship-to-ship transfer in progress. Two tankers stopped close together offshore — this is how sanctioned cargo changes hands without a port record." },
  { color: "#8b5cf6", label: "Purple ring", desc: "Known shadow fleet vessel. Identified by UN Panel of Experts, US Treasury, or investigative journalists." },
  { color: "#9ca3af", label: "Faded / dashed marker", desc: "Vessel went dark — stopped broadcasting its AIS location. Ships do this to hide their position during sanctions-evading transfers." },
  { color: "#f97316", label: "Orange dot (top-right)", desc: "Recently departed a sanctioned export terminal (Kharg Island, Bandar Abbas, Novorossiysk). Likely carrying sanctioned crude oil." },
  { color: "#FF4444", label: "Red dot (bottom-left)", desc: "Vessel is heading to a Chinese port. China is the world's largest buyer of Gulf crude, including sanctioned Iranian and Russian oil." },
  { color: "#FF9933", label: "Orange dot (bottom-left)", desc: "Vessel is heading to an Indian port. India dramatically increased purchases of discounted Russian and Iranian crude after 2022 sanctions." },
];

export default function Legend() {
  return (
    <div className="flex flex-col gap-4">
      {/* Country colors */}
      <div>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          What the colors mean
        </p>
        <div className="flex flex-col gap-2">
          {COUNTRIES.map((key) => (
            <div key={key} className="flex items-start gap-2">
              <div
                className="shrink-0 mt-0.5 rounded-sm"
                style={{ width: 10, height: 10, background: COUNTRY_COLORS[key] }}
              />
              <div>
                <p className="text-xs font-semibold text-white">{COUNTRY_LABELS[key]}</p>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">
                  {COUNTRY_DESCRIPTIONS[key]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ring meanings */}
      <div>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          What the rings mean
        </p>
        <div className="flex flex-col gap-2">
          {RINGS.map((ring) => (
            <div key={ring.label} className="flex items-start gap-2">
              <div
                className="shrink-0 mt-0.5 rounded-full border-2"
                style={{ width: 12, height: 12, borderColor: ring.color }}
              />
              <div>
                <p className="text-xs font-semibold text-white">{ring.label}</p>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">{ring.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data disclaimer */}
      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-xs font-bold text-slate-400 mb-1">What this tool can&apos;t see</p>
        <ul className="text-xs text-slate-500 space-y-1 leading-relaxed">
          <li>• Ships that disabled AIS before entering our coverage area</li>
          <li>• Actual cargo — we infer from vessel type and origin port</li>
          <li>• The real beneficial owner — flag state shows registration, not control</li>
          <li>• Historical routes — this shows what&apos;s happening now, not last week</li>
        </ul>
        <p className="text-xs text-slate-600 mt-2">
          AIS is self-reported. Not for navigation or legal use.
        </p>
      </div>
    </div>
  );
}
