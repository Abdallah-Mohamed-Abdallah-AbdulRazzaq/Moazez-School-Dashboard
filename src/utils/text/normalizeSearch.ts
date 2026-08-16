/**
 * Normalize search text for bilingual (Arabic/English) search matching
 * Used in Teacher Allocation (Tab 7) and other search components
 */

/**
 * Normalize search text for better matching across Arabic and English
 * 
 * Rules:
 * - Trim whitespace
 * - Convert to lowercase
 * - Collapse multiple spaces to single space
 * - Remove Arabic tatweel (ـ)
 * - Normalize Arabic characters:
 *   - أ/إ/آ -> ا
 *   - ى -> ي
 *   - ة -> ه
 * 
 * @param input - The text to normalize
 * @returns Normalized text for search matching
 */
export function normalizeSearchText(input: string): string {
  if (!input) return "";

  const normalized = input
    .trim()
    .toLowerCase()
    // Remove Arabic tatweel
    .replace(/ـ/g, "")
    // Normalize Arabic Alef variations
    .replace(/[أإآ]/g, "ا")
    // Normalize Arabic Yaa
    .replace(/ى/g, "ي")
    // Normalize Arabic Taa Marbuta
    .replace(/ة/g, "ه")
    // Collapse multiple spaces
    .replace(/\s+/g, " ");

  return normalized;
}

/**
 * Build searchable text from multiple fields
 * Concatenates all searchable fields with spaces
 * 
 * @param fields - Array of text fields to concatenate
 * @returns Concatenated and normalized search text
 */
export function buildSearchText(...fields: (string | undefined | null)[]): string {
  return fields
    .filter((field): field is string => !!field)
    .join(" ");
}

/**
 * Highlight matching text in a string
 * Returns parts of text with match information
 * 
 * @param text - The text to highlight
 * @param query - The search query
 * @returns Array of text parts with highlight flag
 */
export function getHighlightedParts(
  text: string,
  query: string
): Array<{ text: string; highlight: boolean }> {
  if (!query.trim() || !text) {
    return [{ text, highlight: false }];
  }

  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);

  // Find the position of the match in normalized text
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return [{ text, highlight: false }];
  }

  // Find the corresponding position in original text
  let originalIndex = 0;
  let normalizedIndex = 0;

  // Count characters until we reach the match position
  while (normalizedIndex < matchIndex && originalIndex < text.length) {
    const char = text[originalIndex];
    const normalizedChar = normalizeSearchText(char);

    if (normalizedChar) {
      normalizedIndex += normalizedChar.length;
    }
    originalIndex++;
  }

  // Calculate match length in original text
  let matchLength = 0;
  let tempNormalizedIndex = 0;
  let tempOriginalIndex = originalIndex;

  while (
    tempNormalizedIndex < normalizedQuery.length &&
    tempOriginalIndex < text.length
  ) {
    const char = text[tempOriginalIndex];
    const normalizedChar = normalizeSearchText(char);

    if (normalizedChar) {
      tempNormalizedIndex += normalizedChar.length;
    }
    matchLength++;
    tempOriginalIndex++;
  }

  const before = text.slice(0, originalIndex);
  const match = text.slice(originalIndex, originalIndex + matchLength);
  const after = text.slice(originalIndex + matchLength);

  const parts: Array<{ text: string; highlight: boolean }> = [];

  if (before) {
    parts.push({ text: before, highlight: false });
  }

  parts.push({ text: match, highlight: true });

  if (after) {
    parts.push({ text: after, highlight: false });
  }

  return parts;
}
