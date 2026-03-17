"use client";

import { StoryCard, StoryHighlight } from "@/types/index";
import { STORY_CARDS } from "@/constants/stories";

interface Props {
  activeStory: string | null;
  onSelect: (card: StoryCard) => void;
  onClear: () => void;
}

export default function StoryCards({ activeStory, onSelect, onClear }: Props) {
  return (
    <div className="flex flex-col gap-3">

      {/* Stories first — primary interactive content */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          The 5 key stories
        </p>
        {activeStory && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-white"
          >
            Show all
          </button>
        )}
      </div>

      {STORY_CARDS.map((card) => {
        const isActive = activeStory === card.id;
        return (
          <button
            key={card.id}
            onClick={() => (isActive ? onClear() : onSelect(card))}
            className={`text-left rounded-lg border p-3 transition-all ${
              isActive
                ? "border-white/30 bg-white/10"
                : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">{card.emoji}</span>
              <div>
                <p className="text-xs font-bold text-white">{card.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
                {isActive && (
                  <>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{card.body}</p>
                    {card.note && (
                      <div className="mt-2 p-2 rounded bg-amber-900/30 border border-amber-500/30">
                        <p className="text-xs text-amber-300 leading-relaxed">
                          <span className="font-bold">⚠ Why you might not see them: </span>
                          {card.note}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {!isActive && (
                  <p className="text-xs text-slate-500 mt-1">Click to highlight vessels on map</p>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* Context card at bottom — supporting info, not the entry point */}
      <div className="rounded-lg bg-slate-800/40 border border-white/8 p-3 mt-1">
        <p className="text-xs font-bold text-slate-300 mb-1.5">What is StraitWatch?</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Russia and Iran are under international sanctions. Western countries banned buying their oil.
          But China and India still buy it anyway, at a big discount.
          To avoid getting caught, ships use three tricks:
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          <li className="text-xs text-slate-400 flex gap-1.5">
            <span className="text-slate-500 shrink-0">1.</span>
            <span><span className="text-white font-medium">Fake flags</span>: register under Gabon or Palau so the ship looks neutral</span>
          </li>
          <li className="text-xs text-slate-400 flex gap-1.5">
            <span className="text-slate-500 shrink-0">2.</span>
            <span><span className="text-white font-medium">Turn off GPS</span>: disappear from tracking while doing the deal</span>
          </li>
          <li className="text-xs text-slate-400 flex gap-1.5">
            <span className="text-slate-500 shrink-0">3.</span>
            <span><span className="text-white font-medium">Swap cargo at sea</span>: transfer oil between ships so it loses its Russian or Iranian origin on paper</span>
          </li>
        </ul>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          This map watches the Strait of Hormuz and Bab al-Mandab, the two narrow straits where most of this oil has to pass, and flags the suspicious ships in real time.
        </p>
      </div>
    </div>
  );
}
