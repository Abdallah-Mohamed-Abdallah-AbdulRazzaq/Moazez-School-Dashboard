/**
 * Shared hook for tab navigation in profile/detail layouts
 * Eliminates duplication of tab logic across layout files
 */

import { useMemo, startTransition } from 'react';
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation';
import { buildTabPath, getActiveTabFromPath } from '@/lib/routing/localePath';

export interface TabConfig {
  key: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface UseSectionTabsOptions {
  /**
   * Base path segments (e.g., ['students-guardians', 'students'])
   */
  basePath: string[];
  
  /**
   * Parameter name for the entity ID (e.g., 'studentId', 'guardianId', 'id')
   */
  idParam: string;
  
  /**
   * Tab configurations
   */
  tabs: TabConfig[];
  
  /**
   * Default tab key (defaults to 'overview')
   */
  defaultTab?: string;
}

export interface UseSectionTabsReturn {
  /**
   * Current active tab key
   */
  activeTab: string;
  
  /**
   * Current locale/language
   */
  lang: string;
  
  /**
   * Entity ID from params
   */
  entityId: string;
  
  /**
   * Tab configurations with computed properties
   */
  tabs: TabConfig[];
  
  /**
   * Navigate to a specific tab
   */
  handleTabClick: (tabKey: string) => void;
  
  /**
   * Build a path for a specific tab
   */
  buildPath: (tabKey: string) => string;
}

/**
 * Hook for managing tab navigation in profile/detail pages
 * 
 * @example
 * const { activeTab, handleTabClick, tabs } = useSectionTabs({
 *   basePath: ['students-guardians', 'students'],
 *   idParam: 'studentId',
 *   tabs: [
 *     { key: 'overview', labelKey: 'tabs.overview', icon: Activity },
 *     { key: 'grades', labelKey: 'tabs.grades', icon: GraduationCap },
 *   ],
 * });
 */
export function useSectionTabs(options: UseSectionTabsOptions): UseSectionTabsReturn {
  const { basePath, idParam, tabs } = options;
  
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const lang = (params.lang as string) || 'en';
  const entityId = params[idParam] as string;
  
  const activeTab = useMemo(() => {
    return getActiveTabFromPath(pathname, entityId);
  }, [pathname, entityId]);
  
  const buildPath = (tabKey: string): string => {
    return buildTabPath(lang, basePath, entityId, tabKey);
  };
  
  const handleTabClick = (tabKey: string) => {
    const path = buildPath(tabKey);
    const query = searchParams.toString();
    const nextPath = query ? `${path}?${query}` : path;
    startTransition(() => {
      router.push(nextPath, { scroll: false });
    });
  };
  
  return {
    activeTab,
    lang,
    entityId,
    tabs,
    handleTabClick,
    buildPath,
  };
}
