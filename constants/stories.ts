import { StoryCard } from "@/types/index";

export const STORY_CARDS: StoryCard[] = [
  {
    id: "shadow-fleet",
    emoji: "🟣",
    title: "Russia's Shadow Fleet",
    subtitle: "~600 tankers moving sanctioned oil",
    body:
      "After Western sanctions in 2022, Russia assembled a fleet of old tankers registered under flags like Gabon, Palau, and Cook Islands to move Urals crude to India and China. These ships are highlighted in purple. Many operate without Western insurance.",
    answersQuestion: 4,
    highlight: { isShadowFleet: true },
    snapToRegion: "hormuz",
  },
  {
    id: "iran-sts",
    emoji: "🟠",
    title: "Iran's Ghost Tankers",
    subtitle: "Ship-to-ship transfers in the Gulf of Oman",
    body:
      "Iran has been under US sanctions since 1979. Its tankers move crude through ship-to-ship transfers — two vessels stop offshore, transfer the cargo, and the oil effectively loses its Iranian origin on paper. Look for vessels stopped offshore near Fujairah.",
    answersQuestion: 5,
    highlight: { countries: ["iran"], isSanctioned: true },
    snapToRegion: "gulf-oman",
  },
  {
    id: "houthi-effect",
    emoji: "⚠️",
    title: "The Houthi Effect",
    subtitle: "Why ships avoid Bab al-Mandab",
    body:
      "Since late 2023, Houthi forces in Yemen have attacked over 100 merchant vessels in the Red Sea. Insurance costs tripled. Most shipping now routes around Africa instead — adding 10–14 days and ~$1M in extra fuel per voyage.",
    note:
      "The near-empty water around Bab al-Mandab IS the story. Before 2023, dozens of ships transited here daily. What you're not seeing — the absence of traffic — represents billions in rerouting costs and a complete reshape of global shipping routes.",
    answersQuestion: 2,
    highlight: {},
    snapToRegion: "bab",
  },
  {
    id: "who-buying",
    emoji: "🔴",
    title: "Who's Still Buying?",
    subtitle: "Chinese and Indian tankers in the Gulf",
    body:
      "Despite Western sanctions on Iran and Russia, China and India continue to buy their oil at steep discounts. They are the primary customers for sanctioned crude — look at where vessels' reported destinations point (Ningbo, Zhoushan, Mundra, Sikka).",
    note:
      "Most Chinese and Indian tankers don't fly their own flag. They register under Panama, Marshall Islands, or Liberia to avoid scrutiny. On this map, look for destinations ending in China or India — that reveals the buyer, not the flag.",
    answersQuestion: 1,
    highlight: {
      countries: ["china", "india"],
      destinationKeywords: [
        // Chinese ports
        "NINGBO", "ZHOUSHAN", "QINGDAO", "TIANJIN", "DALIAN", "SHANGHAI",
        "GUANGZHOU", "SHENZHEN", "YANGSHAN", "HONG KONG", "HUIZHOU", "RIZHAO",
        // Indian ports
        "MUNDRA", "SIKKA", "PARADIP", "HALDIA", "CHENNAI", "COCHIN",
        "VADINAR", "JAMNAGAR", "VIZAG", "KANDLA", "MANGALORE",
      ],
    },
    snapToRegion: "hormuz",
  },
  {
    id: "departed-terminal",
    emoji: "🟡",
    title: "Fresh from Sanctioned Ports",
    subtitle: "Vessels that just left Iranian or Russian terminals",
    body:
      "Vessels currently in or recently departed from Iranian export terminals — Kharg Island, Bandar Abbas, and Assaluyeh — are flagged with an orange dot. These ships are almost certainly loading or carrying Iranian crude oil, regardless of what flag they fly.",
    note:
      "Russian terminals (Novorossiysk, Ust-Luga) are in the Black Sea and Baltic — outside this map's AIS coverage. To track Russian-origin vessels here, use the Shadow Fleet story instead.",
    answersQuestion: 1,
    highlight: { departedTerminal: true },
    snapToRegion: "hormuz",
  },
];
