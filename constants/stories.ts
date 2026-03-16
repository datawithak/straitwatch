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
      "Since late 2023, Houthi forces in Yemen have attacked over 100 merchant vessels in the Red Sea. Insurance costs tripled. Most shipping now routes around Africa instead — adding 10–14 days and ~$1M in extra fuel per voyage. Watch how few ships transit Bab al-Mandab.",
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
      "Despite Western sanctions on Iran and Russia, China and India continue to buy their oil at steep discounts. Chinese and Indian-flagged vessels transiting Hormuz are the primary customers for sanctioned crude. Look at where their reported destinations point.",
    answersQuestion: 1,
    highlight: { countries: ["china", "india"] },
    snapToRegion: "hormuz",
  },
  {
    id: "departed-terminal",
    emoji: "🟡",
    title: "Fresh from Sanctioned Ports",
    subtitle: "Vessels that just left Iranian or Russian terminals",
    body:
      "Vessels recently departed from Kharg Island (Iran's main oil terminal) or Novorossiysk (Russia's main Black Sea port) are highlighted with an orange dot. These ships are almost certainly carrying sanctioned crude oil, regardless of what flag they fly.",
    answersQuestion: 1,
    highlight: { departedTerminal: true },
    snapToRegion: "global",
  },
];
