'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/common/buttons/Button';
import { LAYOUT } from '@/constants';
import { ROUTES } from '@/routes';

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={ROUTES.HOME} className="flex items-center gap-2 font-semibold font-display">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand glow">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="tracking-tight text-foreground">
            {LAYOUT.BRAND_NAME_PART1} <span className="text-gradient">{LAYOUT.BRAND_NAME_PART2}</span>
          </span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          {LAYOUT.HEADER_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground transition">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            component={Link}
            href={ROUTES.LOGIN}
            gradientBrand={false}
            variant="subtle"
            color="gray"
            className="text-foreground hover:bg-foreground/5 hidden sm:inline-flex"
          >
            {LAYOUT.HEADER_LOGIN_TEXT}
          </Button>
          <Button
            component={Link}
            href={ROUTES.SIGNUP}
            gradientBrand={true}
          >
            {LAYOUT.HEADER_GET_STARTED_TEXT} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
