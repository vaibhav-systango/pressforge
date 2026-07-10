/**
 * Reusable validation functions for form inputs.
 */

/**
 * Validates a password value.
 * Must be between 8 and 30 characters.
 */
export function validatePassword(value: string | undefined | null): string | null {
  if (!value) {
    return 'Password is required';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (value.length > 30) {
    return 'Password must be 30 characters or less';
  }
  return null;
}

/**
 * Validates an email address.
 */
export function validateEmail(value: string | undefined | null): string | null {
  if (!value || !value.trim()) {
    return 'Email is required';
  }
  return /^\S+@\S+\.\S+$/.test(value) ? null : 'Enter a valid email address';
}
