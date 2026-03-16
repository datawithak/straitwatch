// Fetches and parses OFAC SDN XML to extract sanctioned vessel IMO numbers.
// Results are cached in module-level memory for 24 hours.

const OFAC_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: Map<string, { programs: string[]; name: string }>;
  fetchedAt: number;
}

let cache: CacheEntry | null = null;

function extractXmlValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function parseOFAC(xml: string): Map<string, { programs: string[]; name: string }> {
  const result = new Map<string, { programs: string[]; name: string }>();

  // Split into sdnEntry blocks
  const entryRe = /<sdnEntry[\s>][\s\S]*?<\/sdnEntry>/gi;
  const entries = xml.match(entryRe) ?? [];

  for (const entry of entries) {
    const sdnType = extractXmlValue(entry, "sdnType");
    if (sdnType !== "Vessel") continue;

    const name = extractXmlValue(entry, "lastName") || extractXmlValue(entry, "firstName");

    // Extract all IMO numbers
    const imoRe = /<idType>IMO #<\/idType>\s*<idNumber>([^<]+)<\/idNumber>/gi;
    let imoMatch;
    while ((imoMatch = imoRe.exec(entry)) !== null) {
      const imo = imoMatch[1].replace(/[^0-9]/g, "").trim();
      if (!imo) continue;

      // Extract sanction programs
      const programRe = /<program>([^<]+)<\/program>/gi;
      const programs: string[] = [];
      let progMatch;
      while ((progMatch = programRe.exec(entry)) !== null) {
        programs.push(progMatch[1].trim());
      }

      result.set(imo, { programs, name });
    }
  }

  return result;
}

export async function getSanctionedVessels(): Promise<
  Map<string, { programs: string[]; name: string }>
> {
  // Return cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(OFAC_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "StraitWatch/1.0 (public OSINT)", "Cache-Control": "no-store" },
      cache: "no-store", // skip Next.js fetch cache — file is 37MB, over the 2MB limit
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const data = parseOFAC(xml);
    cache = { data, fetchedAt: Date.now() };
    console.log(`[Sanctions] OFAC loaded: ${data.size} sanctioned vessels`);
    return data;
  } catch (err) {
    console.warn("[Sanctions] OFAC fetch failed:", err);
    // Return stale cache if available, otherwise empty
    return cache?.data ?? new Map();
  }
}

export function enrichWithSanctions(
  vessels: import("@/types/index").Vessel[],
  sanctioned: Map<string, { programs: string[]; name: string }>
): import("@/types/index").Vessel[] {
  return vessels.map((v) => {
    if (!v.imo) return v;
    const entry = sanctioned.get(v.imo);
    if (!entry) return v;
    return {
      ...v,
      isSanctioned: true,
      sanctionPrograms: entry.programs,
      sanctionSource: "OFAC" as const,
    };
  });
}
