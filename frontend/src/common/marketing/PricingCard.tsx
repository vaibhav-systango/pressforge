'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/common/buttons/Button';
import { ROUTES } from '@/routes';
import { MARKETING } from '@/constants';

export type PricingCardProps = {
  name: string;
  price: string;
  tag: string;
  feats: readonly string[];
  highlight?: boolean;
};

export function PricingCard({ name, price, tag, feats, highlight = false }: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-6 transition flex flex-col justify-between ${
        highlight
          ? "border-transparent bg-gradient-brand text-white glow scale-[1.02]"
          : "border-border/40 bg-foreground/[0.02] hover:border-border/80 text-foreground"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
          {MARKETING.LANDING.MOST_POPULAR_BADGE}
        </div>
      )}
      <div>
        <div className="font-display text-xl font-semibold">{name}</div>
        <div className={`text-sm ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{tag}</div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-4xl font-semibold">{price}</span>
          {price.startsWith("$") && <span className={`text-sm ${highlight ? "text-white/80" : "text-muted-foreground"}`}>/mo</span>}
        </div>
        <ul className="mt-6 space-y-2 text-sm">
          {feats.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className={`h-4 w-4 ${highlight ? "text-white" : "text-emerald-500"}`} /> {f}
            </li>
          ))}
        </ul>
      </div>
      <Button
        component={Link}
        href={ROUTES.SIGNUP}
        gradientBrand={!highlight}
        style={highlight ? { backgroundColor: 'white', color: 'oklch(0.20 0.05 300)', border: 'none' } : undefined}
        className={`mt-6 w-full ${
          highlight ? "hover:bg-white/90" : "hover:opacity-90"
        }`}
      >
        {MARKETING.LANDING.GET_STARTED_BTN}
      </Button>
    </div>
  );
}

export default PricingCard;
