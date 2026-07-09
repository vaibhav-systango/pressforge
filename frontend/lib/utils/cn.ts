import { type ClassValue, clsx } from 'clsx';

/** Merge Tailwind / conditional class names safely. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}
