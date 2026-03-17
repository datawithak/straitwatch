# StraitWatch

Real-time maritime intelligence dashboard tracking sanctioned oil tankers, shadow fleet vessels, and geopolitical chokepoints at the Strait of Hormuz and Bab al-Mandab.

**Live:** https://straitwatch.onrender.com

---

## What it does

Russia and Iran are under international sanctions. Western countries banned buying their oil. But China and India still buy it anyway at steep discounts. To avoid getting caught, ships use three tricks:

1. **Fake flags** — register under Gabon or Palau so the ship looks neutral
2. **Turn off GPS** — disappear from AIS tracking during cargo transfers
3. **Swap cargo at sea** — transfer oil between ships so it loses its origin on paper

StraitWatch watches the two narrow straits where most of this oil must pass and flags suspicious vessels in real time using public AIS data and the OFAC sanctions list.

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

## What the markers mean

- **Color** — flag state (Russia=red, China=red, Iran=orange, shadow fleet=purple)
- **Pulsing red ring** — OFAC sanctioned vessel
- **Pulsing purple ring** — known shadow fleet vessel
- **Pulsing yellow ring** — possible ship-to-ship transfer in progress
- **Faded/dashed** — vessel went dark (stopped broadcasting AIS)
- **Orange dot (top right)** — recently departed a sanctioned export terminal
- **Red dot (bottom left)** — heading to a Chinese port
- **Orange dot (bottom left)** — heading to an Indian port

---

## Limitations

- AIS is self-reported. Vessels can spoof position or turn off transponders.
- Shadow fleet and sanctioned matching requires IMO numbers, which only come with static AIS messages (sent every ~6 minutes). Name-based matching provides faster detection as a fallback.
- Russian terminals (Novorossiysk, Ust-Luga) are outside the AIS bounding box covered here.
- Not for navigation or legal use.

---

Built by [@datawithak](https://github.com/datawithak)
