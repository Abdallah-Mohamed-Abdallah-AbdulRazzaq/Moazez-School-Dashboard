/**
 * Shared validation utilities for bilingual (Arabic/English) fields
 */

/**
 * Normalize text for comparison
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 * - Lowercases for case-insensitive comparison
 */
export function normalizeTextForCompare(text: string): string {
  let normalized = text.trim().replace(/\s+/g, " ");
  // Lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase();
  return normalized;
}

/**
 * Validates that Arabic and English values are different
 * Returns error messages for both fields if they are the same
 */
export function validateArEnDifferent(
  ar: string,
  en: string
): { arError?: string; enError?: string } {
  // Skip validation if either field is empty
  if (!ar.trim() || !en.trim()) {
    return {};
  }

  const normalizedAr = normalizeTextForCompare(ar);
  const normalizedEn = normalizeTextForCompare(en);

  // Compare normalized values
  if (normalizedAr === normalizedEn) {
    return {
      arError: "validation.arEnMustDiffer",
      enError: "validation.arEnMustDiffer",
    };
  }

  return {};
}

/**
 * Check if bilingual values are different (returns boolean)
 */
export function arEnAreDifferent(ar: string, en: string): boolean {
  const errors = validateArEnDifferent(ar, en);
  return Object.keys(errors).length === 0;
}
