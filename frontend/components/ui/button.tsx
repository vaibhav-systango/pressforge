import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white hover:opacity-95 shadow-sm',
  secondary: 'bg-white border border-border-primary text-text-primary hover:bg-slate-50',
  ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
};

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition duration-150',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
