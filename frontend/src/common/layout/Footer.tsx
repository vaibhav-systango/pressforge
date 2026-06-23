'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, Shield } from 'lucide-react';
import { LAYOUT } from '@/constants';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-brand">
            <Sparkles className="h-3 w-3 text-white" />
          </span>
          <span>{LAYOUT.FOOTER_COPYRIGHT}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> {LAYOUT.FOOTER_CAPABILITIES[0].label}
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> {LAYOUT.FOOTER_CAPABILITIES[1].label}
          </span>
          {LAYOUT.FOOTER_LINKS.map((link, i) => (
            <Link key={i} href={link.href} className="hover:text-foreground transition">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
