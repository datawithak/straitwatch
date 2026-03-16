"use client";

import { CountryKey } from "@/types/index";
import { COUNTRY_COLORS } from "@/constants/countries";

export interface FilterState {
  typeFilter: "all" | "tankers" | "cargo" | "military";
  countryFilter: "all" | CountryKey;
  showSanctioned: boolean;
  showShadowFleet: boolean;
  showSTS: boolean;
  showGoingDark: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  typeFilter: "all",
  countryFilter: "all",
  showSanctioned: true,
  showShadowFleet: true,
  showSTS: true,
  showGoingDark: true,
};

const TYPE_BTNS: { value: FilterState["typeFilter"]; label: string }[] = [
  { value: "all", label: "All vessels" },
  { value: "tankers", label: "Tankers" },
  { value: "cargo", label: "Cargo" },
  { value: "military", label: "Military" },
];

const COUNTRY_OPTIONS: { value: "all" | CountryKey; label: string }[] = [
  { value: "all", label: "All flags" },
  { value: "russia", label: "Russia" },
  { value: "china", label: "China" },
  { value: "iran", label: "Iran" },
  { value: "india", label: "India" },
  { value: "uae", label: "UAE" },
  { value: "usa", label: "USA" },
  { value: "greece", label: "Greece" },
  { value: "shadow-flag", label: "Shadow flags (Gabon, Palau…)" },
  { value: "flag-convenience", label: "Flag of convenience" },
];

const SIGNAL_TOGGLES: {
  key: keyof Pick<FilterState, "showSanctioned" | "showShadowFleet" | "showSTS" | "showGoingDark">;
  label: string;
  color: string;
}[] = [
  { key: "showSanctioned", label: "Sanctioned vessels", color: "#ef4444" },
  { key: "showShadowFleet", label: "Shadow fleet", color: "#8b5cf6" },
  { key: "showSTS", label: "Possible STS transfers", color: "#eab308" },
  { key: "showGoingDark", label: "Going dark", color: "#9ca3af" },
];

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export default function FiltersPanel({ filters, onChange, totalCount, filteredCount }: Props) {
  const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="flex flex-col gap-4">

      {/* Count + reset */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          <span className="font-bold text-white">{filteredCount}</span>
          <span> of {totalCount} vessels shown</span>
        </p>
        {!isDefault && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Vessel type */}
      <div>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Vessel type
        </p>
        <div className="grid grid-cols-2 gap-1">
          {TYPE_BTNS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => set({ typeFilter: value })}
              className={`text-xs py-1.5 px-2 rounded transition-colors text-left ${
                filters.typeFilter === value
                  ? "bg-white/15 text-white font-semibold"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Flag / country */}
      <div>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Flag state
        </p>
        <div className="flex flex-col gap-0.5">
          {COUNTRY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => set({ countryFilter: value })}
              className={`text-xs py-1.5 px-2 rounded transition-colors text-left flex items-center gap-2 ${
                filters.countryFilter === value
                  ? "bg-white/15 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {value !== "all" && (
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ background: COUNTRY_COLORS[value as CountryKey] }}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Signal toggles */}
      <div>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Show / hide
        </p>
        <div className="flex flex-col gap-2.5">
          {SIGNAL_TOGGLES.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => set({ [key]: !filters[key] })}
              className="flex items-center justify-between gap-2 text-left w-full"
            >
              <span className={`text-xs ${filters[key] ? "text-white" : "text-slate-500"}`}>
                {label}
              </span>
              <div
                className={`flex-none w-8 h-4 rounded-full relative transition-colors ${
                  filters[key] ? "bg-white/20" : "bg-white/5"
                }`}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full transition-[left]"
                  style={{
                    left: filters[key] ? "18px" : "2px",
                    background: filters[key] ? color : "#4b5563",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Filters apply to the map only. The situation report always reflects all vessels.
      </p>
    </div>
  );
}
