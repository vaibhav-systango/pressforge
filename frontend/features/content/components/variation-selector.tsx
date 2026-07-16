'use client';

import React from 'react';

interface Variation {
  id: string;
  name: string;
  caption: string;
  hashtags: string[];
  imageBrief: string;
  liCaption: string;
  liHashtags: string[];
  liImageBrief: string;
  imageUrl: string;
}

interface VariationSelectorProps {
  variations: Variation[];
  activeVarIdx: number;
  onSelectVariation: (idx: number) => void;
}

export function VariationSelector({
  variations,
  activeVarIdx,
  onSelectVariation,
}: VariationSelectorProps) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-1 flex gap-1 shadow-xs">
      {variations.map((v, idx) => (
        <button
          key={v.id}
          onClick={() => onSelectVariation(idx)}
          className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg transition text-center cursor-pointer ${
            activeVarIdx === idx
              ? "bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white"
              : "text-text-secondary hover:text-text-primary bg-bg-app border border-transparent"
          }`}
        >
          {v.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
