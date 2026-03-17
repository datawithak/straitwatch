// Run once locally: node scripts/fetch-sanctions.mjs
// Fetches OFAC SDN XML and saves sanctioned vessel IMOs to data/sanctioned-vessels.json

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OFAC_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const OUT = resolve(__dirname, "../data/sanctioned-vessels.json");

console.log("Fetching OFAC SDN list...");
const res = await fetch(OFAC_URL, {
  headers: { "User-Agent": "StraitWatch/1.0 (public OSINT; educational use)" },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const xml = await res.text();
console.log(`Downloaded ${(xml.length / 1024 / 1024).toFixed(1)} MB`);

const result = {};
const entryRe = /<sdnEntry[\s\S]*?<\/sdnEntry>/gi;
const entries = xml.match(entryRe) ?? [];

for (const entry of entries) {
  const typeM = entry.match(/<sdnType>([^<]+)<\/sdnType>/i);
  if (!typeM || typeM[1].trim() !== "Vessel") continue;

  const nameM = entry.match(/<lastName>([^<]+)<\/lastName>/i) ||
                entry.match(/<firstName>([^<]+)<\/firstName>/i);
  const name = nameM ? nameM[1].trim() : "";

  const programRe = /<program>([^<]+)<\/program>/gi;
  const programs = [];
  let pm;
  while ((pm = programRe.exec(entry)) !== null) programs.push(pm[1].trim());

  // IMO stored as: <idNumber>IMO 1234567</idNumber>
  const imoRe = /<idNumber>IMO\s+(\d+)<\/idNumber>/gi;
  let im;
  while ((im = imoRe.exec(entry)) !== null) {
    const imo = im[1].trim();
    if (imo) result[imo] = { name, programs };
  }
}

console.log(`Found ${Object.keys(result).length} sanctioned vessels with IMO numbers`);
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`Saved to ${OUT}`);
