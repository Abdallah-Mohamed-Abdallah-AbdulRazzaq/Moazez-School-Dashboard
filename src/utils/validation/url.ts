/**
 * URL Validation Utilities
 * 
 * Provides strict validation for HTTP(S) URLs with:
 * - Protocol enforcement (http/https only)
 * - Hostname validation
 * - Common typo auto-fixing
 * - Security checks against unsafe protocols
 */

const MAX_URL_LENGTH = 2048;

// Unsafe protocols that should be rejected
const UNSAFE_PROTOCOLS = [
  'javascript:',
  'data:',
  'file:',
  'vbscript:',
  'about:',
  'blob:',
];

export interface UrlValidationResult {
  ok: boolean;
  normalized?: string;
  hostname?: string;
  reason?: 'required' | 'invalid' | 'protocol' | 'incomplete' | 'too_long' | 'blocked_domain';
}

export interface UrlValidationOptions {
  allowLocalhost?: boolean;
  allowedDomains?: string[];
}

/**
 * Normalizes a URL by:
 * - Trimming whitespace
 * - Removing internal whitespace
 * - Fixing common protocol typos
 */
export function normalizeUrl(input: string): string {
  if (!input) return '';

  // Trim and remove all whitespace characters
  let normalized = input.trim().replace(/\s+/g, '');

  // Fix common protocol typos
  // "://https" -> "https://"
  normalized = normalized.replace(/^:\/\/(https?)/i, '$1://');
  
  // "https//" -> "https://"
  normalized = normalized.replace(/^(https?)\/{2,}/i, '$1://');
  
  // "http//" -> "http://"
  normalized = normalized.replace(/^(https?)\/{1}$/i, '$1://');

  return normalized;
}

/**
 * Extracts hostname from a URL string
 * Returns null if URL is invalid
 */
export function getHostname(input: string): string | null {
  try {
    const url = new URL(input);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * Validates that a URL is a valid HTTP(S) URL with strict rules
 */
export function validateHttpUrl(
  input: string,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  const { allowLocalhost = process.env.NODE_ENV === 'development', allowedDomains } = options;

  // Check if empty
  if (!input || !input.trim()) {
    return { ok: false, reason: 'required' };
  }

  // Normalize the URL
  const normalized = normalizeUrl(input);

  // Check length
  if (normalized.length > MAX_URL_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }

  // Must start with http:// or https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return { ok: false, reason: 'protocol' };
  }

  // Check for unsafe protocols (defense in depth)
  const lowerNormalized = normalized.toLowerCase();
  for (const unsafeProtocol of UNSAFE_PROTOCOLS) {
    if (lowerNormalized.startsWith(unsafeProtocol)) {
      return { ok: false, reason: 'protocol' };
    }
  }

  // Try to parse as URL
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  // Verify protocol is exactly http: or https:
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'protocol' };
  }

  // Check hostname exists and is not empty
  const hostname = url.hostname;
  if (!hostname || hostname.length === 0) {
    return { ok: false, reason: 'incomplete' };
  }

  // Reject incomplete URLs like "https://" or "http://"
  if (normalized === 'https://' || normalized === 'http://') {
    return { ok: false, reason: 'incomplete' };
  }

  // Hostname validation
  // Must have at least one dot OR be localhost (if allowed)
  const hasValidHostname = hostname.includes('.') || (allowLocalhost && hostname === 'localhost');
  
  if (!hasValidHostname) {
    return { ok: false, reason: 'incomplete' };
  }

  // Hostname cannot start or end with dot or hyphen
  if (
    hostname.startsWith('.') ||
    hostname.endsWith('.') ||
    hostname.startsWith('-') ||
    hostname.endsWith('-')
  ) {
    return { ok: false, reason: 'invalid' };
  }

  // Check for control characters (should already be removed, but double-check)
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    return { ok: false, reason: 'invalid' };
  }

  // Check allowed domains if specified
  if (allowedDomains && allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
    if (!isAllowed) {
      return { ok: false, reason: 'blocked_domain' };
    }
  }

  // All checks passed
  return {
    ok: true,
    normalized,
    hostname,
  };
}

/**
 * Helper to get error message key from validation reason
 */
export function getUrlErrorKey(reason?: string): string {
  switch (reason) {
    case 'required':
      return 'validation.urlRequired';
    case 'protocol':
      return 'validation.urlProtocol';
    case 'incomplete':
      return 'validation.urlIncomplete';
    case 'too_long':
      return 'validation.urlTooLong';
    case 'blocked_domain':
      return 'validation.urlBlocked';
    case 'invalid':
    default:
      return 'validation.urlInvalid';
  }
}
