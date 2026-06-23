'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/common/buttons/Button';

import Header from '@/common/layout/Header';
import Footer from '@/common/layout/Footer';
import Hero from '@/common/marketing/Hero';
import FeatureCard from '@/common/marketing/FeatureCard';
import PricingCard from '@/common/marketing/PricingCard';
import StatCard from '@/common/marketing/StatCard';
import CTA from '@/common/marketing/CTA';

import { MARKETING } from '@/constants';
import { ROUTES } from '@/routes';

export function LandingScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Header Navigation */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Features List Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-semibold">{MARKETING.LANDING.CAPABILITIES_BADGE}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl text-foreground">{MARKETING.LANDING.CAPABILITIES_TITLE}</h2>
          <p className="mt-4 text-muted-foreground">
            {MARKETING.LANDING.CAPABILITIES_DESC}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MARKETING.LANDING.FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.t}
              icon={feature.icon}
              title={feature.t}
              description={feature.d}
              gradientClass={feature.grad}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* How it works Section */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-semibold">{MARKETING.LANDING.LOOP_BADGE}</p>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl text-foreground">{MARKETING.LANDING.LOOP_TITLE}</h2>
            <p className="mt-4 text-muted-foreground">
              {MARKETING.LANDING.LOOP_DESC}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                component={Link}
                href={ROUTES.SIGNUP}
                gradientBrand={true}
              >
                {MARKETING.LANDING.TRY_FLOW_BTN}
              </Button>
              <Button
                component={Link}
                href={ROUTES.LOGIN}
                gradientBrand={false}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-foreground)',
                  borderColor: 'var(--color-border)',
                }}
                className="backdrop-blur hover:bg-foreground/10"
              >
                {MARKETING.LANDING.SEE_DASHBOARD_BTN}
              </Button>
            </div>
          </div>
          <ol className="relative space-y-4 border-l border-border/40 pl-6">
            {MARKETING.LANDING.STEPS.map((s, i) => (
              <li key={s.n} className="relative animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-[11px] font-semibold text-white glow">
                  {s.n}
                </span>
                <div className="glass rounded-xl p-4">
                  <div className="font-display text-lg font-semibold text-foreground">{s.t}</div>
                  <div className="text-sm text-muted-foreground">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stats Summary Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-4 rounded-2xl border border-border/40 bg-aurora p-10 md:grid-cols-4">
          {MARKETING.LANDING.STATS.map((stat) => (
            <StatCard key={stat.l} value={stat.v} label={stat.l} />
          ))}
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-semibold">{MARKETING.LANDING.PRICING_BADGE}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl text-foreground">{MARKETING.LANDING.PRICING_TITLE}</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {MARKETING.LANDING.PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              tag={plan.tag}
              feats={plan.feats}
              highlight={plan.highlight}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <CTA />

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
}
