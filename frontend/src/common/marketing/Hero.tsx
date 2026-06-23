'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Zap } from 'lucide-react';
import { Button } from '@/common/buttons/Button';
import { MARKETING } from '@/constants';
import { ROUTES } from '@/routes';

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
      {/* Aurora Background Orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-brand opacity-30 blur-3xl animate-aurora" />
        <div className="absolute top-20 right-[-160px] h-[460px] w-[460px] rounded-full bg-[oklch(0.66_0.25_340_/_0.35)] blur-3xl animate-aurora" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-[-200px] left-1/3 h-[520px] w-[520px] rounded-full bg-[oklch(0.78_0.16_210_/_0.25)] blur-3xl animate-aurora" style={{ animationDelay: "-12s" }} />
      </div>

      <h1 className="font-display text-5xl font-semibold tracking-tight md:text-7xl animate-fade-up text-foreground">
        {MARKETING.HERO.TITLE_LINE1}<br />
        <span className="text-gradient">{MARKETING.HERO.TITLE_GRADIENT}</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "120ms" }}>
        {MARKETING.HERO.SUBTITLE}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
        <Button
          component={Link}
          href={ROUTES.SIGNUP}
          size="lg"
          gradientBrand={true}
        >
          {MARKETING.HERO.ONBOARD_BTN} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          component={Link}
          href={ROUTES.LOGIN}
          size="lg"
          gradientBrand={false}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-foreground)',
            borderColor: 'var(--color-border)',
          }}
          className="backdrop-blur hover:bg-foreground/10"
        >
          {MARKETING.HERO.DEMO_BTN}
        </Button>
      </div>

      {/* Hero Product Mockup */}
      <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up" style={{ animationDelay: "360ms" }}>
        <div className="shimmer-border rounded-2xl">
          <div className="glass rounded-2xl p-2 shadow-[0_60px_120px_-40px_oklch(0.66_0.24_300/0.6)]">
            <div className="dark rounded-xl bg-[oklch(0.13_0.025_280)] p-6 text-left text-foreground">
              <div className="mb-4 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-xs text-muted-foreground">{MARKETING.HERO.MOCK_URL}</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {MARKETING.HERO.PRODUCT_STATS.map((k, i) => (
                  <div key={i} className="glass rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
                    <div className="mt-1 font-display text-2xl font-semibold">{k.v}</div>
                    {k.t && <div className="text-xs text-emerald-400">{k.t}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="col-span-2 glass rounded-lg p-4">
                  <div className="text-xs text-muted-foreground">{MARKETING.HERO.CHART_TITLE}</div>
                  <div className="mt-3 flex h-24 items-end gap-1.5">
                    {MARKETING.HERO.CHART_VALUES.map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-gradient-brand" style={{ height: `${h * 0.8}%`, opacity: 0.4 + i / 24 }} />
                    ))}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs text-muted-foreground">{MARKETING.HERO.SENTIMENT_TITLE}</div>
                  <div className="relative mt-3 grid place-items-center">
                    <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-brand glow animate-pulse-glow">
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-[oklch(0.16_0.025_280)]">
                        <span className="font-display text-xl font-semibold">82</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{MARKETING.HERO.HEALTH_SCORE_LABEL}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Floating badges */}
        <div className="absolute -left-6 top-20 hidden glass rounded-xl px-3 py-2 text-xs md:flex items-center gap-2 animate-float">
          <Check className="h-3.5 w-3.5 text-sky-500" /> {MARKETING.HERO.TELEGRAM_BADGE}
        </div>
        <div className="absolute -right-6 top-40 hidden glass rounded-xl px-3 py-2 text-xs md:flex items-center gap-2 animate-float" style={{ animationDelay: "-3s" }}>
          <Zap className="h-3.5 w-3.5 text-amber-400" /> {MARKETING.HERO.GENERATED_BADGE}
        </div>
      </div>

      {/* Trust/Logo strip */}
      <div className="mt-20 text-xs uppercase tracking-widest text-muted-foreground">
        {MARKETING.HERO.TRUSTED_BY}
      </div>
      <div className="relative mt-6 overflow-hidden">
        <div className="flex w-max gap-12 animate-marquee opacity-60">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex shrink-0 items-center gap-12 pr-12 font-display text-xl tracking-tight text-foreground">
              {MARKETING.HERO.TRUSTED_COMPANIES.map((n) => (
                <span key={n + k} className="opacity-80 font-bold">{n}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
