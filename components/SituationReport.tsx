"use client";

import { SituationReport } from "@/lib/situation-report";

interface Props {
  report: SituationReport | null;
  isDemo: boolean;
  isLoading: boolean;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  if (value === 0) return null;
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 min-w-[56px]">
      <span className={`text-base font-bold leading-none ${color}`}>{value}</span>
      <span className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function SituationReportBar({ report, isDemo, isLoading }: Props) {
  return (
    <div className="bg-slate-900 border-b border-white/10 px-4 pt-3 pb-3 shrink-0">

      {/* Top row: badge + timestamp */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isDemo ? "text-amber-400" : "text-emerald-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-yellow-400 animate-pulse" : isDemo ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
          {isDemo ? "Demo data" : "Live intelligence briefing"}
        </span>
        {report && (
          <span className="text-xs text-slate-600 ml-auto">{timeAgo(report.generatedAt)}</span>
        )}
      </div>

      {/* Headline */}
      {report ? (
        <>
          <p className="text-sm font-bold text-white leading-snug mb-2.5">
            {report.headline}
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2 mb-2.5">
            <StatPill value={report.stats.total} label="vessels" color="text-slate-200" />
            {report.stats.tankers > 0
              ? <StatPill value={report.stats.tankers} label="tankers" color="text-blue-300" />
              : report.stats.unknownType > 0
              ? <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-base font-bold text-slate-400 leading-none">{report.stats.unknownType}</span>
                  <span className="text-xs text-slate-500 mt-0.5">type pending</span>
                </div>
              : null
            }
            <StatPill value={report.stats.sanctioned} label="sanctioned" color="text-red-400" />
            <StatPill value={report.stats.shadowFleet} label="shadow fleet" color="text-purple-400" />
            <StatPill value={report.stats.possibleSTS} label="transfers" color="text-yellow-400" />
            <StatPill value={report.stats.goingDark} label="gone dark" color="text-slate-400" />
          </div>

          {/* Detail bullets */}
          {report.details.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {report.details.map((d, i) => (
                <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                  <span className="text-slate-600 shrink-0">•</span>
                  {d}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500">Loading situation report...</p>
      )}

      <p className="text-xs text-slate-700 mt-2">
        AIS: aisstream.io · Sanctions: OFAC / KSE-3 · Partial coverage vs commercial feeds
      </p>
    </div>
  );
}
