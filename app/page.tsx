"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Vessel, RegionKey, StoryCard, StoryHighlight } from "@/types/index";
import { IntelFeedResult } from "@/types/intel";
import { REGIONS } from "@/constants/regions";
import { detectSTSPairs } from "@/lib/sts-detection";
import { generateSituationReport, SituationReport } from "@/lib/situation-report";
import SituationReportBar from "@/components/SituationReport";
import StoryCards from "@/components/Sidebar/StoryCards";
import VesselDetail from "@/components/Sidebar/VesselDetail";
import IntelFeed from "@/components/Sidebar/IntelFeed";
import Legend from "@/components/Sidebar/Legend";

const StraitMap = dynamic(() => import("@/components/Map/StraitMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-500 text-sm">
      Loading map...
    </div>
  ),
});

const INTEL_REFRESH_MS = 300_000;

type SidebarTab = "stories" | "intel" | "legend";

export default function Home() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [vesselLoading, setVesselLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const vesselMapRef = useRef(new Map<string, Vessel>());

  const [intelResult, setIntelResult] = useState<IntelFeedResult | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  const [region, setRegion] = useState<RegionKey>("global");
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<StoryHighlight | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("stories");
  const [situationReport, setSituationReport] = useState<SituationReport | null>(null);

  // Mobile state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSidebarTab, setMobileSidebarTab] = useState<SidebarTab>("stories");

  const intelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Apply STS detection and update state from vessel map ─────────────────
  const flushVessels = useCallback(() => {
    const all = Array.from(vesselMapRef.current.values());
    const stsPairs = detectSTSPairs(all);
    const stsMMSIs = new Set<string>();
    const stsPartners = new Map<string, { mmsi: string; name: string }>();
    for (const pair of stsPairs) {
      stsMMSIs.add(pair.vesselA.mmsi);
      stsMMSIs.add(pair.vesselB.mmsi);
      stsPartners.set(pair.vesselA.mmsi, { mmsi: pair.vesselB.mmsi, name: pair.vesselB.name });
      stsPartners.set(pair.vesselB.mmsi, { mmsi: pair.vesselA.mmsi, name: pair.vesselA.name });
    }
    const enriched = all.map((v) => ({
      ...v,
      isPossibleSTS: stsMMSIs.has(v.mmsi),
      stsPartnerMMSI: stsPartners.get(v.mmsi)?.mmsi ?? v.stsPartnerMMSI,
      stsPartnerName: stsPartners.get(v.mmsi)?.name ?? v.stsPartnerName,
    }));
    setVessels(enriched);
    setSituationReport(generateSituationReport(enriched, intelResult?.items ?? []));
  }, [intelResult]);

  // ── Live SSE connection ────────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/vessels/live");
      setVesselLoading(true);

      es.onopen = () => {
        setLiveConnected(true);
        setIsDemo(false);
        setVesselLoading(false);
      };

      es.onmessage = (e) => {
        try {
          const v = JSON.parse(e.data) as Vessel;
          if (!v.mmsi) return;
          const existing = vesselMapRef.current.get(v.mmsi);
          vesselMapRef.current.set(v.mmsi, { ...existing, ...v } as Vessel);
        } catch {}
      };

      es.onerror = () => {
        setLiveConnected(false);
        es.close();
        // Reconnect after 5s
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    // Flush vessel map to React state every 2 seconds (smooth updates, not per-message re-render)
    stsIntervalRef.current = setInterval(flushVessels, 2000);

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
      if (stsIntervalRef.current) clearInterval(stsIntervalRef.current);
    };
  }, [flushVessels]);

  // Fallback: manual refresh still calls /api/vessels for a fresh batch
  const fetchVessels = useCallback(async () => {
    setVesselLoading(true);
    try {
      const res = await fetch("/api/vessels");
      const data = await res.json();
      if (data.vessels) {
        for (const v of data.vessels as Vessel[]) {
          vesselMapRef.current.set(v.mmsi, v);
        }
        setIsDemo(data.isDemo ?? false);
        flushVessels();
      }
    } catch {}
    finally { setVesselLoading(false); }
  }, [flushVessels]);

  // ── Fetch intel ───────────────────────────────────────────────────────────
  const fetchIntel = useCallback(async () => {
    setIntelLoading(true);
    try {
      const res = await fetch("/api/intel");
      const data: IntelFeedResult = await res.json();
      setIntelResult(data);
    } catch {}
    finally { setIntelLoading(false); }
  }, []);

  // Kick off an initial batch fetch to pre-warm the vessel map
  useEffect(() => { fetchVessels(); }, [fetchVessels]);

  useEffect(() => {
    fetchIntel();
    intelIntervalRef.current = setInterval(fetchIntel, INTEL_REFRESH_MS);
    return () => { if (intelIntervalRef.current) clearInterval(intelIntervalRef.current); };
  }, [fetchIntel]);

  // Update situation report when intel updates
  useEffect(() => {
    if (vessels.length > 0 && intelResult) {
      setSituationReport(generateSituationReport(vessels, intelResult.items));
    }
  }, [intelResult, vessels]);

  // ── Story card handlers ───────────────────────────────────────────────────
  const handleStorySelect = (card: StoryCard) => {
    setActiveStory(card.id);
    setHighlight(card.highlight);
    if (card.snapToRegion) setRegion(card.snapToRegion);
    setSelectedVessel(null);
  };

  const handleStoryClear = () => {
    setActiveStory(null);
    setHighlight(null);
  };

  // ── Vessel select ─────────────────────────────────────────────────────────
  const handleSelectVessel = (v: Vessel) => {
    setSelectedVessel(v);
    setMobileOpen(true);
  };

  const handleCloseVessel = () => {
    setSelectedVessel(null);
  };

  // ── Region labels ─────────────────────────────────────────────────────────
  const regionKeys: RegionKey[] = ["global", "hormuz", "gulf-oman", "bab", "red-sea"];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">

      {/* Header */}
      <header className="bg-slate-950 border-b border-white/10 px-4 py-2 flex items-center gap-3 shrink-0 z-10">
        <div>
          <span className="font-bold tracking-widest text-sm text-white">⚓ STRAITWATCH</span>
          <span className="text-slate-500 text-xs ml-2 hidden sm:inline">/ maritime intelligence</span>
        </div>

        {/* Region toggles */}
        <div className="flex items-center gap-1 ml-4 overflow-x-auto scrollbar-none">
          {regionKeys.map((key) => (
            <button
              key={key}
              onClick={() => setRegion(key)}
              className={`text-xs px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
                region === key
                  ? "bg-white/15 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {REGIONS[key].label}
            </button>
          ))}
        </div>

        {/* Live status + refresh */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className={`text-xs flex items-center gap-1 ${liveConnected ? "text-emerald-400" : "text-slate-500"}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${liveConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            {liveConnected ? "LIVE" : "CONNECTING..."}
          </span>
          <button
            onClick={fetchVessels}
            disabled={vesselLoading}
            className="text-xs bg-white/10 hover:bg-white/15 disabled:opacity-40 px-3 py-1 rounded transition-colors"
          >
            {vesselLoading ? "Updating..." : "↺ Refresh"}
          </button>
        </div>
      </header>

      {/* Situation Report */}
      <SituationReportBar
        report={situationReport}
        isDemo={isDemo}
        isLoading={vesselLoading}
      />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-80 bg-slate-950 border-r border-white/10 shrink-0 overflow-hidden">
          {/* Sidebar tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {(["stories", "intel", "legend"] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 text-xs py-2 capitalize transition-colors ${
                  sidebarTab === tab
                    ? "text-white border-b-2 border-white font-semibold"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {tab === "stories" ? "Stories" : tab === "intel" ? "Advisories" : "Guide"}
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedVessel ? (
              <VesselDetail vessel={selectedVessel} onClose={handleCloseVessel} />
            ) : sidebarTab === "stories" ? (
              <StoryCards
                activeStory={activeStory}
                onSelect={handleStorySelect}
                onClear={handleStoryClear}
              />
            ) : sidebarTab === "intel" ? (
              <IntelFeed result={intelResult} loading={intelLoading} />
            ) : (
              <Legend />
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <StraitMap
            vessels={vessels}
            selectedMMSI={selectedVessel?.mmsi ?? null}
            region={region}
            highlight={highlight}
            intelItems={intelResult?.items ?? []}
            onSelectVessel={handleSelectVessel}
          />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-white/10 flex">
        {(["stories", "intel", "legend"] as SidebarTab[]).map((tab) => {
          const emoji = tab === "stories" ? "📡" : tab === "intel" ? "⚠️" : "❓";
          const label = tab === "stories" ? "Stories" : tab === "intel" ? "Alerts" : "Guide";
          return (
            <button
              key={tab}
              onClick={() => {
                setMobileSidebarTab(tab);
                setSelectedVessel(null);
                setMobileOpen((prev) => !(prev && mobileSidebarTab === tab));
              }}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs ${
                mobileOpen && mobileSidebarTab === tab ? "text-white" : "text-slate-500"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-slate-950 rounded-t-2xl h-[70vh] flex flex-col border-t border-white/10">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="flex-1 overflow-y-auto p-4">
              {selectedVessel ? (
                <VesselDetail vessel={selectedVessel} onClose={() => { setSelectedVessel(null); setMobileOpen(false); }} />
              ) : mobileSidebarTab === "stories" ? (
                <StoryCards activeStory={activeStory} onSelect={(c) => { handleStorySelect(c); setMobileOpen(false); }} onClear={handleStoryClear} />
              ) : mobileSidebarTab === "intel" ? (
                <IntelFeed result={intelResult} loading={intelLoading} />
              ) : (
                <Legend />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
