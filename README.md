# StraitWatch

Real-time maritime intelligence dashboard tracking sanctioned oil tankers and shadow fleet vessels at the Strait of Hormuz and Bab al-Mandab.

**Live:** https://straitwatch.onrender.com

![StraitWatch Dashboard](screenshot.png)

---

## Why I built this

The Strait of Hormuz is effectively closed. 21% of the world's oil supply is in geopolitical limbo.

I wanted to see which sanctioned tankers were still moving — and whether the sanctions meant anything in practice. So I built StraitWatch.

Russia and Iran are under international sanctions. Western countries banned buying their oil. But China and India still buy it anyway at steep discounts. To avoid getting caught, ships use three tricks:

1. **Fake flags** — register under Gabon or Palau so the ship looks neutral
2. **Turn off GPS** — disappear from AIS tracking during cargo transfers
3. **Swap cargo at sea** — transfer oil between ships so it loses its origin on paper

All of it leaves traces in public data. StraitWatch watches for it in real time.

---

## What you're looking at

Ships are being rerouted through the narrow Qeshm Channel and around Larak Island under Iranian Navy control. The economics, the sanctions evasion, the geopolitics — it's all visible in AIS data (the transponder signal every commercial ship is legally required to broadcast).

StraitWatch cross-references live vessel positions against the OFAC sanctions list (the US Treasury's list of sanctioned vessels and entities) and flags:

- **Sanctioned vessels** — ships on the OFAC SDN list (1,447 vessels matched by IMO number and name)
- **Shadow fleet** — vessels using flag-of-convenience registries to disguise origin
- **Going dark** — ships that stop broadcasting near known transfer zones. The silence is usually the signal.
- **Ship-to-ship transfers** — two vessels stationary in close proximity at sea
- **Departure terminals** — vessels that recently left a sanctioned Iranian or Russian export terminal

---

## What the markers mean

| Marker | Meaning |
|---|---|
| Pulsing red ring | OFAC sanctioned vessel |
| Pulsing purple ring | Known shadow fleet vessel |
| Pulsing yellow ring | Possible ship-to-ship transfer in progress |
| Faded / dashed outline | Vessel went dark (stopped broadcasting) |
| Orange dot top-right | Recently departed a sanctioned export terminal |
| Red dot bottom-left | Heading to a Chinese port |
| Orange dot bottom-left | Heading to an Indian port |
| Color | Flag state — Russia=red, Iran=orange, China=red, India=amber, shadow fleet=purple |

---

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Leaflet / react-leaflet** — map rendering
- **aisstream.io** — live AIS vessel positions via WebSocket
- **OFAC SDN list** — pre-baked into `data/sanctioned-vessels.json` (1,447 vessels)
- **Tailwind CSS**
- **Render** — hosting

---

## How to run it yourself

### 1. Get a free AIS API key

Sign up at [aisstream.io](https://aisstream.io) — free tier gives you real-time AIS data.

### 2. Clone the repo

```bash
git clone https://github.com/datawithak/straitwatch.git
cd straitwatch
```

### 3. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Add your API key

Create a `.env.local` file in the root:

```
AISSTREAM_API_KEY=your_key_here
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Vessels start streaming within 5-10 seconds.

---

## Deploy to Render

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) and create a new **Web Service**
3. Connect your GitHub repo
4. Set these values:
   - **Build command:** `npm install --legacy-peer-deps && npm run build`
   - **Start command:** `npm run start`
   - **Environment:** Node
5. Add environment variable: `AISSTREAM_API_KEY` = your aisstream.io key
6. Deploy

First load on the free tier takes ~60 seconds (cold start). Subsequent loads are fast.

---

## Refresh the sanctions list

The OFAC sanctions list is pre-baked into `data/sanctioned-vessels.json` so it works on cloud hosting without fetching the 27MB XML at runtime. To refresh it:

```bash
node scripts/fetch-sanctions.mjs
```

Then commit and push the updated JSON.

---

## Data sources

| Data | Source | Cost |
|---|---|---|
| Live vessel positions | [aisstream.io](https://aisstream.io) | Free |
| OFAC sanctions list | [US Treasury](https://www.treasury.gov/ofac/downloads/sdn.xml) | Free / public |
| Shadow fleet vessels | KSE Shadow Fleet Tracker, UN Panel of Experts, OFAC | Public |
| Maritime advisories | UKMTO | Free / public |
| Map tiles | ESRI Ocean Basemap | Free |

---

## Limitations

- AIS is self-reported. Vessels can spoof position or turn off transponders.
- Shadow fleet and sanctioned matching requires IMO numbers, which only come with static AIS messages (sent every ~6 minutes). Name-based matching provides faster detection as a fallback.
- Russian terminals (Novorossiysk, Ust-Luga) are outside the AIS bounding box covered here.
- Not for navigation or legal use.

---

Built by [@datawithak](https://github.com/datawithak)
