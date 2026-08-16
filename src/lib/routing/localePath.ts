/**
 * Utility functions for building locale-aware paths
 * Eliminates duplication across layout files
 */

/**
 * Builds a locale-aware path for navigation
 * @param lang - The locale (e.g., 'en', 'ar')
 * @param segments - Path segments to join
 * @returns Complete path with locale prefix
 * 
 * @example
 * buildLocalePath('en', 'students-guardians', 'students', '123')
 * // Returns: '/en/students-guardians/students/123'
 * 
 * buildLocalePath('ar', 'admissions', 'leads')
 * // Returns: '/ar/admissions/leads'
 */
export function buildLocalePath(lang: string, ...segments: string[]): string {
  const cleanSegments = segments.filter(Boolean);
  return `/${lang}/${cleanSegments.join('/')}`;
}

/**
 * Builds a tab path for profile/detail pages
 * @param lang - The locale
 * @param basePath - Base path segments (e.g., ['students-guardians', 'students'])
 * @param id - Entity ID
 * @param tabKey - Tab key (use 'overview' or empty for default tab)
 * @returns Complete tab path
 * 
 * @example
 * buildTabPath('en', ['students-guardians', 'students'], '123', 'grades')
 * // Returns: '/en/students-guardians/students/123/grades'
 * 
 * buildTabPath('en', ['admissions', 'leads'], 'L001', 'overview')
 * // Returns: '/en/admissions/leads/L001' (overview is default)
 */
export function buildTabPath(
  lang: string,
  basePath: string[],
  id: string,
  tabKey: string
): string {
  const segments = [...basePath, id];
  
  // Don't append tab key if it's the default/overview tab
  if (tabKey && tabKey !== 'overview') {
    segments.push(tabKey);
  }
  
  return buildLocalePath(lang, ...segments);
}

/**
 * Extracts the active tab from a pathname
 * @param pathname - Current pathname
 * @param entityId - Entity ID to check against
 * @returns Active tab key or 'overview' if on default tab
 * 
 * @example
 * getActiveTabFromPath('/en/students-guardians/students/123/grades', '123')
 * // Returns: 'grades'
 * 
 * getActiveTabFromPath('/en/students-guardians/students/123', '123')
 * // Returns: 'overview'
 */
export function getActiveTabFromPath(pathname: string, entityId: string): string {
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  
  // If the last part is the entity ID, we're on the overview/default tab
  if (lastPart === entityId) {
    return 'overview';
  }
  
  return lastPart;
}
