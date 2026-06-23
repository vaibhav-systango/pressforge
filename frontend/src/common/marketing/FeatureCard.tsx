'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientClass: string;
  index: number;
};

export function FeatureCard({ icon: Icon, title, description, gradientClass, index }: FeatureCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-foreground/[0.02] p-6 transition hover:-translate-y-1 hover:border-border/80 hover:bg-foreground/[0.04]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${gradientClass} blur-2xl opacity-70 transition group-hover:opacity-100`} />
      <div className="relative">
        <div className="inline-grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand glow">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default FeatureCard;
