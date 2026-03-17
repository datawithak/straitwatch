const res = await fetch("https://www.treasury.gov/ofac/downloads/sdn.xml", {
  headers: { "User-Agent": "test" },
});
const xml = await res.text();

const entries = xml.match(/<sdnEntry[\s\S]*?<\/sdnEntry>/gi) ?? [];

// Find first vessel entry with IMO
const vessel = entries.find((e) => e.includes("Vessel") && e.includes("IMO"));
if (vessel) {
  console.log("First vessel with IMO (first 3000 chars):");
  console.log(vessel.substring(0, 3000));
} else {
  console.log("No vessel with IMO text found");
  // Check what id types exist
  const idTypes = new Set(xml.match(/<idType>[^<]+<\/idType>/gi) ?? []);
  console.log("ID types found:", [...idTypes].slice(0, 20));
}
