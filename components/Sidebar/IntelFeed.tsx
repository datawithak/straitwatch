"use client";

import { IntelFeedResult } from "@/types/intel";

interface Props {
  result: IntelFeedResult | null;
  loading: boolean;
  onViewOnMap?: (lat: number, lng: number) => void;
}

const SEVERITY_COLORS = {
  high: { bg: "bg-red-950/40", border: "border-red-800/40", badge: "bg-red-700 text-red-100" },
  medium: { bg: "bg-yellow-950/30", border: "border-yellow-800/30", badge: "bg-yellow-700 text-yellow-100" },
  low: { bg: "bg-slate-800/40", border: "border-slate-700/30", badge: "bg-slate-600 text-slate-200" },
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function IntelFeed({ result, loading, onViewOnMap }: Props) {
  if (loading && !result) {
    return (
      <div className="text-xs text-slate-500 py-4 text-center">Loading advisories...</div>
    );
  }

  if (!result || result.items.length === 0) {
    return (
      <div className="text-xs text-slate-500 py-4 text-center">
        No recent advisories from UKMTO or MARAD.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
        Maritime advisories
      </p>

      {result.items.map((item) => {
        const sev = item.severity ?? "low";
        const colors = SEVERITY_COLORS[sev];
        const hasCoords = item.lat != null && item.lng != null;
        return (
          <div
            key={item.id}
            className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>
                {item.sourceShort}
              </span>
              {sev === "high" && (
                <span className="text-xs font-bold text-red-400">⚠ INCIDENT</span>
              )}
              <span className="text-xs text-slate-500 ml-auto">{timeAgo(item.publishedMs)}</span>
            </div>
            <p className="text-xs font-semibold text-white leading-snug">{item.title}</p>
            {item.summary && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {hasCoords && onViewOnMap && (
                <button
                  onClick={() => onViewOnMap(item.lat!, item.lng!)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  View on map →
                </button>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                  Full advisory ↗
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
