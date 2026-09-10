'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type NavLinkProps = {
  href: string;
  end?: boolean;
  className?: string | ((args: { isActive: boolean }) => string);
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

function resolveActive(pathname: string, href: string, end?: boolean) {
  if (end) {
    return pathname === href;
  }

  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

export function NavLink({ href, end, className, children, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = resolveActive(pathname, href, end);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <Link href={href} className={cn(resolvedClassName)} aria-current={isActive ? 'page' : undefined} onClick={onClick}>
      {children}
    </Link>
  );
}
