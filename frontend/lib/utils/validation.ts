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
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Email is required';
  }
  return /^\S+@\S+\.\S+$/.test(trimmed) ? null : 'Enter a valid email address';
}

/**
 * Validates a workspace/brand name.
 */
export function validateWorkspaceName(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Workspace / Brand Name is required';
  }
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (trimmed.length > 50) {
    return 'Name must be 50 characters or less';
  }
  return null;
}

/**
 * Validates a website URL (optional).
 */
export function validateWebsiteUrl(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return null; // optional
  }
  if (trimmed.length > 200) {
    return 'Website URL must be 200 characters or less';
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'URL must start with http:// or https://';
    }
    return null;
  } catch (e) {
    return 'Enter a valid URL';
  }
}

/**
 * Validates a brand keyword tag.
 */
export function validateKeyword(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim().toLowerCase() : '';
  if (!trimmed) {
    return 'Keyword cannot be empty';
  }
  if (trimmed.length < 2) {
    return 'Keyword must be at least 2 characters';
  }
  if (trimmed.length > 30) {
    return 'Keyword must be 30 characters or less';
  }
  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return 'Keyword must only contain alphanumeric characters, hyphens or underscores';
  }
  return null;
}

/**
 * Validates a writing prompt rule.
 */
export function validateRule(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Rule cannot be empty';
  }
  if (trimmed.length < 5) {
    return 'Rule must be at least 5 characters';
  }
  if (trimmed.length > 150) {
    return 'Rule must be 150 characters or less';
  }
  return null;
}

/**
 * Validates brand voice guidelines description.
 */
export function validateBrandVoice(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return null; // optional
  }
  if (trimmed.length > 1000) {
    return 'Brand voice description must be 1000 characters or less';
  }
  return null;
}

/**
 * Validates a user's full name.
 * Must be non-empty and at most 100 characters.
 */
export function validateFullName(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Full name is required';
  }
  if (trimmed.length > 100) {
    return 'Full name must be 100 characters or less';
  }
  return null;
}

/**
 * Validates an organization/agency name.
 * Must be non-empty and at most 100 characters.
 */
export function validateOrganizationName(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Organization / Agency name is required';
  }
  if (trimmed.length > 100) {
    return 'Organization / Agency name must be 100 characters or less';
  }
  return null;
}

/**
 * Validates a phone number.
 */
export function validatePhoneNumber(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Phone number is required';
  }
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  if (!phoneRegex.test(trimmed)) {
    return 'Enter a valid phone number';
  }
  return null;
}

/**
 * Validates a date of birth. Must be valid and age must be >= 18.
 */
export function validateDob(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Date of birth is required';
  }
  const dobDate = new Date(trimmed);
  if (isNaN(dobDate.getTime())) {
    return 'Enter a valid date';
  }
  
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return 'You must be at least 18 years old';
  }
  return null;
}

/**
 * Validates a company legal name.
 */
export function validateCompanyName(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Company legal name is required';
  }
  if (trimmed.length < 2) {
    return 'Company name must be at least 2 characters';
  }
  if (trimmed.length > 100) {
    return 'Company name must be 100 characters or less';
  }
  return null;
}

/**
 * Validates a business tax ID/EIN.
 */
export function validateTaxId(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Tax ID / EIN is required';
  }
  if (trimmed.length < 5) {
    return 'Tax ID / EIN must be at least 5 characters';
  }
  return null;
}

/**
 * Validates a business registered address.
 */
export function validateBusinessAddress(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Registered address is required';
  }
  if (trimmed.length < 10) {
    return 'Please enter a complete address (at least 10 characters)';
  }
  return null;
}

/**
 * Validates a primary contact person.
 */
export function validateContactPerson(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (!trimmed) {
    return 'Primary contact person name is required';
  }
  if (trimmed.length < 2) {
    return 'Contact person must be at least 2 characters';
  }
  return null;
}

/**
 * Validates brief organization description.
 */
export function validateOrganizationDescription(value: string | undefined | null): string | null {
  const trimmed = value ? value.trim() : '';
  if (trimmed.length > 500) {
    return 'Description must be 500 characters or less';
  }
  return null;
}

