// Adapted from FlightInt — fetches UKMTO and MARAD maritime advisories.
import { IntelItem, IntelFeedResult } from "@/types/intel";

const FETCH_TIMEOUT_MS = 8000;

interface FeedSource {
  id: string;
  name: string;
  short: string;
  rssUrl?: string;
  scrapeUrl?: string;
  type?: "rss" | "atom" | "html";
}

const FEED_SOURCES: FeedSource[] = [
  {
    id: "marad",
    name: "MARAD",
    short: "MARAD",
    scrapeUrl: "https://www.maritime.dot.gov/msci",
    type: "html",
  },
  {
    id: "ukmto",
    name: "UKMTO",
    short: "UKMTO",
    scrapeUrl: "https://www.ukmto.org/indian-ocean/recent-incidents",
    type: "html",
  },
];

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractFirst(xml: string, ...tags: string[]): string {
  for (const tag of tags) {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = xml.match(re);
    if (m) return stripCdata(stripTags(m[1])).substring(0, 400);
  }
  return "";
}

function extractLink(xml: string): string {
  const text = xml.match(/<link>([^<]+)<\/link>/i);
  if (text) return text[1].trim();
  const attr = xml.match(/<link[^>]+href="([^"]+)"/i);
  if (attr) return attr[1];
  const guid = xml.match(/<guid[^>]*>([^<]+)<\/guid>/i);
  return guid ? guid[1].trim() : "";
}

function parseDate(raw: string): { iso: string; ms: number } {
  if (!raw) return { iso: new Date().toISOString(), ms: Date.now() };
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) return { iso: new Date().toISOString(), ms: Date.now() };
  return { iso: d.toISOString(), ms: d.getTime() };
}

function splitBlocks(xml: string, tag: "item" | "entry"): string[] {
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?<\\/${tag}>`, "gi");
  return xml.match(re) ?? [];
}

function inferSeverity(title: string, summary: string): "high" | "medium" | "low" {
  const text = (title + " " + summary).toLowerCase();
  if (text.includes("attack") || text.includes("missile") || text.includes("drone") ||
      text.includes("fired upon") || text.includes("explosion")) return "high";
  if (text.includes("warning") || text.includes("caution") || text.includes("advisory") ||
      text.includes("suspicious")) return "medium";
  return "low";
}

function makeItem(
  source: FeedSource, idx: number,
  title: string, summary: string, link: string,
  iso: string, ms: number
): IntelItem {
  return {
    id: `${source.id}-${ms}-${idx}`,
    sourceId: source.id,
    sourceName: source.name,
    sourceShort: source.short,
    title,
    summary: summary.substring(0, 300),
    link,
    publishedAt: iso,
    publishedMs: ms,
    severity: inferSeverity(title, summary),
  };
}

function parseRSS(xml: string, source: FeedSource): IntelItem[] {
  return splitBlocks(xml, "item").slice(0, 12).map((block, i) => {
    const title = extractFirst(block, "title") || "(no title)";
    const summary = extractFirst(block, "description", "content:encoded", "summary");
    const link = extractLink(block);
    const { iso, ms } = parseDate(extractFirst(block, "pubDate", "dc:date", "date"));
    return makeItem(source, i, title, summary, link, iso, ms);
  });
}

function scrapeMARAD(html: string, source: FeedSource): IntelItem[] {
  const items: IntelItem[] = [];
  const articleRe = /<article[\s\S]*?<\/article>/gi;
  const articles = html.match(articleRe) ?? [];

  if (articles.length > 0) {
    for (let i = 0; i < Math.min(articles.length, 10); i++) {
      const block = articles[i];
      const titleM = block.match(/<h[234][^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      const title = titleM ? titleM[1].trim() : `MARAD Alert ${i + 1}`;
      const hrefM = block.match(/<a\s+href="([^"]+)"/i);
      const href = hrefM ? hrefM[1] : "";
      const link = href.startsWith("http") ? href : `https://www.maritime.dot.gov${href}`;
      const timeM = block.match(/<time[^>]+datetime="([^"]+)"/i);
      const { iso, ms } = parseDate(timeM ? timeM[1] : "");
      const summaryM = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const summary = summaryM ? stripTags(summaryM[1]).substring(0, 300) : "MARAD Maritime Security Advisory";
      items.push(makeItem(source, i, title, summary, link, iso, ms));
    }
    return items;
  }

  const linkRe = /<a\s+href="([^"]*(?:msci|maritime-security|advisory|alert)[^"]*)"[^>]*>([^<]{10,150})<\/a>/gi;
  let m, idx = 0;
  while ((m = linkRe.exec(html)) !== null && idx < 10) {
    const href = m[1];
    const link = href.startsWith("http") ? href : `https://www.maritime.dot.gov${href}`;
    const ms = Date.now() - idx * 86400000;
    items.push(makeItem(source, idx, m[2].trim(), "MARAD Maritime Security Advisory",
      link, new Date(ms).toISOString(), ms));
    idx++;
  }
  return items;
}

function scrapeGeneric(html: string, source: FeedSource, baseUrl: string): IntelItem[] {
  const items: IntelItem[] = [];
  const linkRe = /<a\s+href="([^"]*(?:incident|advisory|alert|warning|attack)[^"]*)"[^>]*>([^<]{10,200})<\/a>/gi;
  let m, idx = 0;
  while ((m = linkRe.exec(html)) !== null && idx < 10) {
    const href = m[1];
    const link = href.startsWith("http") ? href : `${baseUrl}${href}`;
    const ms = Date.now() - idx * 86400000;
    items.push(makeItem(source, idx, m[2].trim(), "Maritime security advisory",
      link, new Date(ms).toISOString(), ms));
    idx++;
  }
  return items;
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "StraitWatch/1.0 (public OSINT; educational use)",
        "Accept": "application/rss+xml, application/xml, text/html, */*",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSource(source: FeedSource): Promise<IntelItem[]> {
  try {
    if (source.rssUrl) {
      const text = await fetchWithTimeout(source.rssUrl);
      const items = parseRSS(text, source);
      if (items.length > 0) return items;
    }
    if (source.scrapeUrl) {
      const html = await fetchWithTimeout(source.scrapeUrl);
      const origin = new URL(source.scrapeUrl).origin;
      return source.id === "marad"
        ? scrapeMARAD(html, source)
        : scrapeGeneric(html, source, origin);
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchAllAdvisories(): Promise<IntelFeedResult> {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchSource));
  const items: IntelItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      items.push(...r.value);
    } else {
      errors.push(`${FEED_SOURCES[i].id}: ${r.reason}`);
    }
  }

  // Sort by recency
  items.sort((a, b) => b.publishedMs - a.publishedMs);

  return { items: items.slice(0, 20), fetchedAt: Date.now(), errors };
}
