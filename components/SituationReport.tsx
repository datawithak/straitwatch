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

export default function SituationReportBar({ report, isDemo, isLoading }: Props) {
  return (
    <div className="bg-slate-900 border-b border-white/10 px-4 py-2.5">
      <div className="flex items-start gap-3 max-w-full">
        {/* Live / Demo badge */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-400 animate-pulse" : isDemo ? "bg-amber-400" : "bg-green-400 animate-pulse"}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${isDemo ? "text-amber-400" : "text-green-400"}`}>
            {isDemo ? "Demo" : "Live"}
          </span>
        </div>

        {/* Situation text */}
        <div className="flex-1 min-w-0">
          {report ? (
            <>
              <p className="text-xs font-semibold text-white leading-snug truncate">
                {report.headline}
              </p>
              {report.details.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {report.details[0]}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">Loading situation report...</p>
          )}
        </div>

        {/* Stats chips */}
        {report && (
          <div className="hidden md:flex items-center gap-2 shrink-0 text-xs">
            <Chip value={report.stats.total} label="vessels" color="text-slate-300" />
            {report.stats.tankers > 0
              ? <Chip value={report.stats.tankers} label="tankers" color="text-blue-300" />
              : report.stats.unknownType > 0
              ? <span className="text-slate-500">{report.stats.unknownType} type&nbsp;pending</span>
              : null
            }
            {report.stats.sanctioned > 0 && (
              <Chip value={report.stats.sanctioned} label="sanctioned" color="text-red-400" />
            )}
            {report.stats.shadowFleet > 0 && (
              <Chip value={report.stats.shadowFleet} label="shadow fleet" color="text-purple-400" />
            )}
            {report.stats.possibleSTS > 0 && (
              <Chip value={report.stats.possibleSTS} label="STS" color="text-yellow-400" />
            )}
            {report.stats.goingDark > 0 && (
              <Chip value={report.stats.goingDark} label="dark" color="text-slate-400" />
            )}
            <span className="text-slate-600">
              {report ? timeAgo(report.generatedAt) : ""}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-600 mt-1">
        AIS coverage via aisstream.io — partial coverage vs commercial feeds. Sanctioned &amp; shadow fleet data: OFAC / KSE-3 list.
      </p>
    </div>
  );
}

function Chip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className={`${color} font-semibold`}>
      {value} <span className="font-normal text-slate-500">{label}</span>
    </span>
  );
}
