'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/common/buttons/Button';
import { MARKETING } from '@/constants';
import { ROUTES } from '@/routes';

export function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="shimmer-border rounded-3xl">
        <div className="glass rounded-3xl p-12 text-center">
          <h2 className="font-display text-3xl font-semibold md:text-5xl text-foreground">
            {MARKETING.CTA.TITLE}<span className="text-gradient">{MARKETING.CTA.TITLE_GRADIENT}</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {MARKETING.CTA.SUBTITLE}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              component={Link}
              href={ROUTES.SIGNUP}
              size="lg"
              gradientBrand={true}
            >
              {MARKETING.CTA.FREE_BTN} <ArrowRight className="ml-2 h-4 w-4" />
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
              {MARKETING.CTA.TOUR_BTN}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
