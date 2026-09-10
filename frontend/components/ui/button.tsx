import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white hover:opacity-95 shadow-sm',
  secondary: 'bg-white border border-border-primary text-text-primary hover:bg-slate-50',
  ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
};

export function Button({
  variant = 'primary',
  className,
  children,
  isLoading = false,
  loadingText,
  fullWidth = false,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
