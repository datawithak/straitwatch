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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
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
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{card.body}</p>
                )}
                {!isActive && (
                  <p className="text-xs text-slate-500 mt-1">Click to highlight on map →</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
