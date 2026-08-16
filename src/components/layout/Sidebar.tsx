"use client";

import {
  bottomItems,
  filterMenuItems,
  groupMenuChildren,
  menuItems,
} from "@/config/navigation";
import {
  Building2,
  Menu,
  ChevronLeft,
  ChevronDown,
  Loader2,
  LogOut,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import GuardedLink from "@/components/navigation/GuardedLink";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import {
  filterNavigationItemsByPermission,
  usePermissions,
} from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/use-auth";

const COLLAPSED_FLYOUT_MARGIN = 12;
const COLLAPSED_FLYOUT_MAX_HEIGHT = 420;

interface SidebarProps {
  activeItem?: string;
  onSelect?: (item: string) => void;
  schoolName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  isRTL?: boolean;
}

function getActiveExpandedKeys(
  items: ReadonlyArray<(typeof menuItems)[number]>,
  pathname: string,
  isArabic: boolean,
) {
  return items.reduce<string[]>((nextExpandedKeys, item) => {
    if (!item.children) {
      return nextExpandedKeys;
    }

    const isChildActive = item.children.some((child) => {
      const childHref = isArabic ? child.href_ar : child.href_en;
      if (pathname === childHref) return true;

      return child.children?.some((grandchild) => {
        const grandchildHref = isArabic
          ? grandchild.href_ar
          : grandchild.href_en;
        return pathname === grandchildHref;
      });
    });

    if (isChildActive) {
      nextExpandedKeys.push(item.key);
    }

    item.children.forEach((child) => {
      const isGrandchildActive = child.children?.some((grandchild) => {
        const grandchildHref = isArabic
          ? grandchild.href_ar
          : grandchild.href_en;
        return pathname === grandchildHref;
      });

      if (isGrandchildActive) {
        nextExpandedKeys.push(child.key);
      }
    });

    return nextExpandedKeys;
  }, []);
}

export default function Sidebar({
  onSelect,
  schoolName = "School Name",
  isOpen = true,
  onToggle,
  isRTL = false,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const tApp = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const { logout } = useAuth();
  const isArabic = pathname.startsWith("/ar");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hoveredCollapsedItemKey, setHoveredCollapsedItemKey] = useState<
    string | null
  >(null);
  const [collapsedFlyoutTop, setCollapsedFlyoutTop] = useState(0);
  const lastAutoExpandedPathRef = useRef(pathname);
  const previousIsOpenRef = useRef(isOpen);
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    getActiveExpandedKeys(menuItems, pathname, isArabic),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSnapshotRef = useRef<string[] | null>(null);
  const focusSearchOnOpenRef = useRef(false);

  const hasSearchQuery = searchQuery.trim().length > 0;

  const visibleMenuItems = useMemo(
    () => filterNavigationItemsByPermission(menuItems, hasPermission),
    [hasPermission],
  );

  const visibleBottomItems = useMemo(
    () => filterNavigationItemsByPermission(bottomItems, hasPermission),
    [hasPermission],
  );

  const displayMenuItems = useMemo(
    () =>
      hasSearchQuery
        ? filterMenuItems(visibleMenuItems, searchQuery, isArabic)
        : visibleMenuItems,
    [hasSearchQuery, isArabic, searchQuery, visibleMenuItems],
  );

  // Clear pending state when pathname changes (navigation complete)
  useEffect(() => {
    if (pendingHref !== null) {
      void Promise.resolve().then(() => setPendingHref(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const wasOpen = previousIsOpenRef.current;
    previousIsOpenRef.current = isOpen;
    if (isOpen && !wasOpen) {
      void Promise.resolve().then(() => setHoveredCollapsedItemKey(null));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!hasSearchQuery) {
      if (searchSnapshotRef.current !== null) {
        setExpandedItems(searchSnapshotRef.current);
        searchSnapshotRef.current = null;
      }
      return;
    }

    if (searchSnapshotRef.current === null) {
      setExpandedItems((current) => {
        searchSnapshotRef.current = current;
        return current;
      });
    }

    const matchingExpandedKeys = displayMenuItems.flatMap((item) => [
      ...(item.children ? [item.key] : []),
      ...(item.children ?? [])
        .filter((child) => child.children && child.children.length > 0)
        .map((child) => child.key),
    ]);

    setExpandedItems((current) => {
      const next = [...new Set([...current, ...matchingExpandedKeys])];
      const isUnchanged =
        next.length === current.length &&
        next.every((key, index) => key === current[index]);

      return isUnchanged ? current : next;
    });
  }, [displayMenuItems, hasSearchQuery]);

  useEffect(() => {
    if (!isOpen || !focusSearchOnOpenRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      focusSearchOnOpenRef.current = false;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  // Auto-expand parent if current route is a child or grandchild
  useEffect(() => {
    if (lastAutoExpandedPathRef.current === pathname) {
      return;
    }

    const activeExpandedKeys = getActiveExpandedKeys(
      visibleMenuItems,
      pathname,
      isArabic,
    );

    if (activeExpandedKeys.length === 0) {
      return;
    }

    lastAutoExpandedPathRef.current = pathname;

    void Promise.resolve().then(() => {
      setExpandedItems((prev) => {
        const nextExpandedKeys = [...prev];

        activeExpandedKeys.forEach((key) => {
          if (!nextExpandedKeys.includes(key)) {
            nextExpandedKeys.push(key);
          }
        });

        return nextExpandedKeys.length === prev.length ? prev : nextExpandedKeys;
      });
    });
  }, [pathname, isArabic, visibleMenuItems]);

  const handleItemClick = (key: string) => {
    onSelect?.(key);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const openSearchFromCollapsedSidebar = () => {
    focusSearchOnOpenRef.current = true;
    onToggle?.();
  };

  const handleNavigationStart = (href: string) => {
    // Set pending state only when navigation actually starts
    setPendingHref(href);
    setHoveredCollapsedItemKey(null);
  };

  const preserveGradesQuery = (href: string) => {
    const currentGradesPrefix = isArabic ? "/ar/grades" : "/en/grades";
    if (
      !pathname.startsWith(currentGradesPrefix) ||
      !href.startsWith(currentGradesPrefix)
    ) {
      return href;
    }

    const currentQuery = searchParams.toString();
    if (!currentQuery || href.includes("?")) {
      return href;
    }

    return `${href}?${currentQuery}`;
  };

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const showCollapsedFlyout = (
    key: string,
    element: HTMLElement,
    hasChildren: boolean,
  ) => {
    if (isOpen) {
      return;
    }

    if (!hasChildren) {
      setHoveredCollapsedItemKey(null);
      return;
    }

    const { top } = element.getBoundingClientRect();
    const maxTop =
      window.innerHeight -
      COLLAPSED_FLYOUT_MAX_HEIGHT -
      COLLAPSED_FLYOUT_MARGIN;
    setCollapsedFlyoutTop(
      Math.max(
        COLLAPSED_FLYOUT_MARGIN,
        Math.min(top, Math.max(COLLAPSED_FLYOUT_MARGIN, maxTop)),
      ),
    );
    setHoveredCollapsedItemKey(key);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isItemActive = (item: (typeof menuItems)[0]) => {
    const itemHref = isArabic ? item.href_ar : item.href_en;
    if (pathname === itemHref) return true;

    if (item.children) {
      return item.children.some((child) => {
        const childHref = isArabic ? child.href_ar : child.href_en;
        if (pathname === childHref) return true;

        // Check grandchildren
        if (child.children) {
          return child.children.some((grandchild) => {
            const grandchildHref = isArabic
              ? grandchild.href_ar
              : grandchild.href_en;
            return pathname === grandchildHref;
          });
        }
        return false;
      });
    }
    return false;
  };

  const getVariantClasses = (
    variant?: "default" | "highlight",
    options?: { active?: boolean; pending?: boolean; backgroundImage?: string },
  ) => {
    if (options?.backgroundImage) {
      if (options?.active || options?.pending) {
        return "text-white shadow-md";
      }
      return "text-white hover:text-white hover:brightness-110";
    }

    if (options?.active || options?.pending) {
      return "";
    }

    if (variant !== "highlight") {
      return "";
    }

    return "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15";
  };

  const getVariantStyle = (options?: {
    active?: boolean;
    pending?: boolean;
    backgroundImage?: string;
  }): CSSProperties | undefined => {
    const locale = isArabic ? "ar" : "en";
    if (!options?.backgroundImage) {
      return undefined;
    }

    const overlayStrength = options.active || options.pending ? 0.28 : 0.5;

    return {
      backgroundImage: `linear-gradient(${locale === "ar" ? "-90deg" : "90deg"}, rgba(15, 23, 42, ${overlayStrength}) 0%, rgba(15, 23, 42, 0.24) 42%, rgba(15, 23, 42, 0.05) 100%), url(${options.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  };

  const hoveredCollapsedItem = !isOpen
    ? visibleMenuItems.find((item) => item.key === hoveredCollapsedItemKey)
    : null;

  return (
    <>
      {/* Mobile Overlay - only on small screens when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseLeave={() => setHoveredCollapsedItemKey(null)}
        className={`group/sidebar fixed z-50 h-screen bg-[#065769] flex flex-col transition-all duration-300 ease-in-out
      ${isRTL ? "right-0 border-l" : "left-0 border-r"} border-white/10
      ${isOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
      ${isOpen ? "w-[260px] max-w-[80vw]" : "lg:w-20 lg:px-3"}`}
      >
        {/* Toggle Button (fixed top) */}
        <button
          onClick={onToggle}
          aria-label={tApp(isOpen ? "collapse" : "expand")}
          className={`hidden lg:block rounded-lg border border-white/30 p-2 text-white
            transition-[opacity,transform,background-color,box-shadow] duration-200 ease-out
            motion-reduce:transition-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
            focus-visible:ring-offset-2 focus-visible:ring-offset-[#065769]
            ${
              isOpen
                ? "-translate-y-1 pointer-events-none opacity-0 group-hover/sidebar:pointer-events-auto group-hover/sidebar:translate-y-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:pointer-events-auto group-focus-within/sidebar:translate-y-0 group-focus-within/sidebar:opacity-100"
                : "translate-y-0 opacity-100 hover:bg-white/20 hover:shadow-md mb-2"
            }
            mt-2 shrink-0 ${isRTL ? "ml-2 mr-auto" : "ml-auto mr-2"}`}
        >
          {isOpen ? (
            <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {!isOpen && (
          <button
            type="button"
            onClick={openSearchFromCollapsedSidebar}
            aria-label={isArabic ? "فتح بحث التنقل" : "Open navigation search"}
            className={`hidden lg:inline-flex rounded-lg border border-white/30 p-2 text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#065769] motion-reduce:transition-none ${
              isRTL ? "ml-2 mr-auto" : "ml-auto mr-2"
            }`}
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </button>
        )}

        {/* Logo Section (fixed top) */}
        <div className="px-4 py-6 flex items-center justify-center shrink-0">
          <GuardedLink
            href={isArabic ? "/ar/dashboard" : "/en/dashboard"}
            className="flex items-center justify-center rounded-lg text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#065769]"
          >
            <Image
              src="/images/logo/moazez_white_logo.svg"
              alt="Logo"
              width={isOpen ? 120 : 40}
              height={isOpen ? 30 : 40}
              priority
              className="transition-all duration-300"
            />
          </GuardedLink>
        </div>

        {/* School Selector (fixed top) */}
        {isOpen && (
          <div className="mb-1 shrink-0 p-2">
            <div className="flex items-center gap-3 p-3 border border-white/20 rounded-xl bg-white/20">
              <div className="w-10 h-10 rounded-full bg-white flex border-2 border-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/60 font-medium">
                  {t("school")}
                </p>
                <p className="text-sm font-bold text-white">{schoolName}</p>
              </div>
            </div>
          </div>
        )}

        {/* âœ… Scrollable Menu Only */}
        {isOpen && (
          <div className="mx-2 mb-3 shrink-0">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={isArabic ? "بحث في التنقل" : "Search navigation"}
                placeholder={
                  isArabic ? "ابحث في التبويبات..." : "Search tabs..."
                }
                className="sidebar-search-input h-10 w-full rounded-lg border border-white/15 bg-white/10 ps-9 pe-9 text-sm text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-white/70 focus:border-white/45 focus:bg-white/15 focus:ring-2 focus:ring-white/25 motion-reduce:transition-none"
              />
              {hasSearchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={
                    isArabic ? "مسح بحث التنقل" : "Clear navigation search"
                  }
                  className="absolute end-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/60 transition-colors duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 sidebar-scroll">
          <nav className="space-y-1 pb-4">
            {hasSearchQuery && displayMenuItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/60">
                {isArabic ? "لم يتم العثور على تبويبات" : "No tabs found"}
              </p>
            ) : (
              displayMenuItems.map((item) => {
                const Icon = item.icon;
                const itemHref = isArabic ? item.href_ar : item.href_en;
                const itemNavigationHref = preserveGradesQuery(itemHref);
                const isHeroJourneyItem = item.key === "hero-journey";

                const isActive = isItemActive(item);
                const isExpanded = expandedItems.includes(item.key);
                const hasChildren = item.children && item.children.length > 0;
                const itemVariantClasses = getVariantClasses(
                  item.buttonVariant,
                  {
                    active: isActive,
                    backgroundImage: item.buttonBackgroundImage,
                  },
                );
                const itemVariantStyle = getVariantStyle({
                  active: isActive,
                  backgroundImage: item.buttonBackgroundImage,
                });
                const isHighlighted =
                  item.buttonVariant === "highlight" &&
                  !isActive &&
                  !item.buttonBackgroundImage;
                const hasImageBackground = Boolean(item.buttonBackgroundImage);

                return (
                  <div
                    key={item.key}
                    className={item.buttonBackgroundImage ? "px-0" : "px-2"}
                    onMouseEnter={(event) =>
                      showCollapsedFlyout(
                        item.key,
                        event.currentTarget,
                        Boolean(hasChildren),
                      )
                    }
                  >
                    {/* Parent Item */}
                    {hasChildren ? (
                      <button
                        onClick={(e) => {
                          if (isOpen) {
                            toggleExpand(item.key, e);
                          }
                        }}
                        title={
                          !isOpen
                            ? isArabic
                              ? item.label_ar
                              : item.label_en
                            : undefined
                        }
                        className={`group w-full flex items-center gap-3 ${item.buttonBackgroundImage ? "rounded-none" : "rounded-[6px]"} transition-all duration-200 ${
                          isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                        } ${
                          isActive
                            ? item.buttonBackgroundImage
                              ? "text-white shadow-sm"
                              : "bg-white text-primary shadow-sm"
                            : "text-white hover:bg-white hover:text-primary"
                        } ${isArabic ? "text-right" : "text-left"} ${itemVariantClasses}`}
                        style={itemVariantStyle}
                      >
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            isActive
                              ? "text-primary"
                              : hasImageBackground
                                ? "text-white"
                                : isHighlighted
                                  ? "text-primary"
                                  : "text-white group-hover:text-primary"
                          }`}
                        />
                        {isOpen && (
                          <>
                            <span className="font-semibold text-[15px] flex-1 truncate">
                              {isArabic ? item.label_ar : item.label_en}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform shrink-0 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>
                    ) : (
                      <GuardedLink
                        href={itemNavigationHref}
                        onClick={() => handleItemClick(item.key)}
                        onNavigationStart={() =>
                          handleNavigationStart(itemNavigationHref)
                        }
                        prefetch
                        title={
                          !isOpen
                            ? isArabic
                              ? item.label_ar
                              : item.label_en
                            : undefined
                        }
                        className={`group w-full flex items-center gap-3 ${item.buttonBackgroundImage ? "rounded-none" : "rounded-[6px]"} transition-all duration-200 text-left ${
                          isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                        } ${
                          isActive || pendingHref === itemNavigationHref
                            ? item.buttonBackgroundImage
                              ? "text-white shadow-sm"
                              : "bg-white text-primary shadow-sm"
                            : "text-white hover:bg-white/15"
                        } ${getVariantClasses(item.buttonVariant, {
                          active: isActive,
                          pending: pendingHref === itemNavigationHref,
                          backgroundImage: item.buttonBackgroundImage,
                        })} ${isHeroJourneyItem ? "h-27.5" : ""}`}
                        style={getVariantStyle({
                          active: isActive,
                          pending: pendingHref === itemNavigationHref,
                          backgroundImage: item.buttonBackgroundImage,
                        })}
                      >
                        {!isHeroJourneyItem && (
                          <Icon
                            className={`w-5 h-5 shrink-0 transition-colors ${
                              isActive || pendingHref === itemNavigationHref
                                ? "text-primary"
                                : item.buttonBackgroundImage
                                  ? "text-white"
                                  : item.buttonVariant === "highlight"
                                    ? "text-primary"
                                    : "text-white group-hover:text-white"
                            }`}
                          />
                        )}
                        {isOpen && (
                          <>
                            <span className="font-semibold text-[16px] truncate">
                              {isArabic ? item.label_ar : item.label_en}
                            </span>
                            {pendingHref === itemNavigationHref && (
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            )}
                          </>
                        )}
                      </GuardedLink>
                    )}

                    {/* Children Items */}
                    {hasChildren && isExpanded && isOpen && (
                      <div
                        className={`relative mt-1 space-y-1 ${
                          isArabic ? "mr-6" : "ml-6"
                        } before:content-[''] before:absolute before:w-[2px] before:h-full before:top-0 before:bg-primary`}
                      >
                        {groupMenuChildren(item, item.children!).map(
                          ({ subgroup, children }) => (
                            <div key={subgroup.key}>
                              <p
                                className={`px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55 ${
                                  isArabic ? "text-right" : "text-left"
                                }`}
                              >
                                {isArabic
                                  ? subgroup.label_ar
                                  : subgroup.label_en}
                              </p>
                              {children.map((child) => {
                                const ChildIcon = child.icon;
                                const childHref = isArabic
                                  ? child.href_ar
                                  : child.href_en;
                                const childNavigationHref =
                                  preserveGradesQuery(childHref);
                                const isChildActive = pathname === childHref;
                                const hasGrandchildren =
                                  child.children && child.children.length > 0;
                                const isChildExpanded = expandedItems.includes(
                                  child.key,
                                );

                                return (
                                  <div key={child.key}>
                                    {/* Child Item */}
                                    {hasGrandchildren ? (
                                      <button
                                        onClick={(e) =>
                                          toggleExpand(child.key, e)
                                        }
                                        className={`group w-full flex items-center gap-3 rounded-[6px] transition-all duration-200 px-4 py-2.5 ${
                                          isArabic ? "text-right" : "text-left"
                                        } ${
                                          isChildActive
                                            ? "bg-white/20 text-primary font-semibold"
                                            : "text-white/80 hover:bg-white/15"
                                        }`}
                                      >
                                        <ChildIcon
                                          className={`w-4 h-4 shrink-0 transition-colors ${isChildActive ? "text-primary" : "group-hover:text-white"}`}
                                        />
                                        <span className="text-sm flex-1 truncate">
                                          {isArabic
                                            ? child.label_ar
                                            : child.label_en}
                                        </span>
                                        <ChevronDown
                                          className={`w-3 h-3 transition-transform shrink-0 ${
                                            isChildExpanded ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>
                                    ) : (
                                      <GuardedLink
                                        href={childNavigationHref}
                                        onClick={() =>
                                          handleItemClick(child.key)
                                        }
                                        onNavigationStart={() =>
                                          handleNavigationStart(
                                            childNavigationHref,
                                          )
                                        }
                                        prefetch
                                        className={`group w-full flex items-center gap-3 rounded-[6px] transition-all duration-200 px-4 py-2.5 ${
                                          isArabic ? "text-right" : "text-left"
                                        } ${
                                          isChildActive ||
                                          pendingHref === childNavigationHref
                                            ? "bg-white/20 text-white font-semibold"
                                            : "text-white/80 hover:bg-white/15"
                                        }`}
                                      >
                                        <ChildIcon
                                          className={`w-4 h-4 shrink-0 transition-colors ${isChildActive || pendingHref === childNavigationHref ? "text-white" : "group-hover:text-white"}`}
                                        />
                                        <span className="text-sm flex-1 truncate">
                                          {isArabic
                                            ? child.label_ar
                                            : child.label_en}
                                        </span>
                                        {pendingHref ===
                                          childNavigationHref && (
                                          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                        )}
                                      </GuardedLink>
                                    )}

                                    {/* Grandchildren Items */}
                                    {hasGrandchildren && isChildExpanded && (
                                      <div
                                        className={`relative mt-1 space-y-1 ${
                                          isArabic ? "mr-4" : "ml-4"
                                        }`}
                                      >
                                        {child.children!.map((grandchild) => {
                                          const GrandchildIcon =
                                            grandchild.icon;
                                          const grandchildHref = isArabic
                                            ? grandchild.href_ar
                                            : grandchild.href_en;
                                          const grandchildNavigationHref =
                                            preserveGradesQuery(grandchildHref);
                                          const isGrandchildActive =
                                            pathname === grandchildHref;

                                          return (
                                            <GuardedLink
                                              key={grandchild.key}
                                              href={grandchildNavigationHref}
                                              onClick={() =>
                                                handleItemClick(grandchild.key)
                                              }
                                              onNavigationStart={() =>
                                                handleNavigationStart(
                                                  grandchildNavigationHref,
                                                )
                                              }
                                              prefetch
                                              className={`group w-full flex items-center gap-2 rounded-[6px] transition-all duration-200 px-3 py-2 ${
                                                isArabic
                                                  ? "text-right"
                                                  : "text-left"
                                              } ${
                                                isGrandchildActive ||
                                                pendingHref ===
                                                  grandchildNavigationHref
                                                  ? "bg-white/20 text-primary font-semibold"
                                                  : "text-white/70 hover:bg-white/15"
                                              }`}
                                            >
                                              <GrandchildIcon
                                                className={`w-3.5 h-3.5 shrink-0 transition-colors ${isGrandchildActive || pendingHref === grandchildNavigationHref ? "text-primary" : "group-hover:text-white"}`}
                                              />
                                              <span className="text-xs truncate">
                                                {isArabic
                                                  ? grandchild.label_ar
                                                  : grandchild.label_en}
                                              </span>
                                              {pendingHref ===
                                                grandchildNavigationHref && (
                                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                              )}
                                            </GuardedLink>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </div>

        {/* âœ… Bottom Section Ø«Ø§Ø¨Øª ØªØ­Øª */}
        <div
          className="pb-6 space-y-1 shrink-0 border-t border-white/15 pt-3"
          onMouseEnter={() => setHoveredCollapsedItemKey(null)}
        >
          {visibleBottomItems.map((item) => {
            const Icon = item.icon;
            const itemHref = isArabic ? item.href_ar : item.href_en;
            const isPendingItem = pendingHref === itemHref;
            const isActiveItem = pathname === itemHref;
            const itemVariantClasses = getVariantClasses(item.buttonVariant, {
              active: isActiveItem,
              pending: isPendingItem,
              backgroundImage: item.buttonBackgroundImage,
            });
            const itemVariantStyle = getVariantStyle({
              active: isActiveItem,
              pending: isPendingItem,
              backgroundImage: item.buttonBackgroundImage,
            });

            return (
              <GuardedLink
                href={itemHref}
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                onNavigationStart={() => handleNavigationStart(itemHref)}
                prefetch
                title={
                  !isOpen
                    ? isArabic
                      ? item.label_ar
                      : item.label_en
                    : undefined
                }
                className={`group w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-left ${
                  isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                } ${
                  isActiveItem || isPendingItem
                    ? item.buttonBackgroundImage
                      ? "text-white shadow-sm"
                      : "bg-white/20 text-white"
                    : "text-white hover:bg-white/15"
                } ${itemVariantClasses}`}
                style={itemVariantStyle}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    item.buttonBackgroundImage &&
                    !isActiveItem &&
                    !isPendingItem
                      ? "text-white"
                      : item.buttonVariant === "highlight" &&
                          !isActiveItem &&
                          !isPendingItem
                        ? "text-primary"
                        : "text-white group-hover:text-white"
                  }`}
                />
                {isOpen && (
                  <>
                    <span className="font-medium text-sm truncate">
                      {isArabic ? item.label_ar : item.label_en}
                    </span>
                    {isPendingItem && (
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    )}
                  </>
                )}
              </GuardedLink>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={!isOpen ? tApp("logout") : undefined}
            className={`group w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-left ${
              isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
            } ${
              isLoggingOut
                ? "cursor-not-allowed text-white/50"
                : "text-red-200 hover:bg-red-500/15 hover:text-red-100"
            }`}
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 shrink-0 transition-colors" />
            )}
            {isOpen && (
              <span className="font-medium text-sm truncate ">
                {tApp("logout")}
              </span>
            )}
          </button>
        </div>

        {!isOpen && hoveredCollapsedItem?.children ? (
          <div
            className={`absolute z-[70] max-h-[min(420px,calc(100vh-24px))] w-64 overflow-y-auto rounded-lg border border-white/10 bg-[#065769] p-2 text-white shadow-2xl ${
              isRTL ? "right-full mr-2" : "left-full ml-2"
            }`}
            style={{ top: collapsedFlyoutTop }}
          >
            <p className="px-3 py-2 text-sm font-bold text-white">
              {isArabic
                ? hoveredCollapsedItem.label_ar
                : hoveredCollapsedItem.label_en}
            </p>
            <div className="space-y-1">
              {groupMenuChildren(
                hoveredCollapsedItem,
                hoveredCollapsedItem.children,
              ).map(({ subgroup, children }) => (
                <div key={subgroup.key}>
                  <p
                    className={`px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55 ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    {isArabic ? subgroup.label_ar : subgroup.label_en}
                  </p>
                  {children.map((child) => {
                    const ChildIcon = child.icon;
                    const childHref = isArabic ? child.href_ar : child.href_en;
                    const childNavigationHref = preserveGradesQuery(childHref);
                    const isChildActive = pathname === childHref;
                    const hasGrandchildren =
                      child.children && child.children.length > 0;
                    const isChildExpanded = expandedItems.includes(child.key);

                    return (
                      <div key={child.key}>
                        {hasGrandchildren ? (
                          <button
                            type="button"
                            onClick={(event) => toggleExpand(child.key, event)}
                            className={`group flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-sm transition-colors ${
                              isArabic ? "text-right" : "text-left"
                            } ${
                              isChildActive
                                ? "bg-white/20 text-white font-semibold"
                                : "text-white/85 hover:bg-white/15"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">
                              {isArabic ? child.label_ar : child.label_en}
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                                isChildExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        ) : (
                          <GuardedLink
                            href={childNavigationHref}
                            onClick={() => handleItemClick(child.key)}
                            onNavigationStart={() =>
                              handleNavigationStart(childNavigationHref)
                            }
                            prefetch
                            className={`group flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-sm transition-colors ${
                              isArabic ? "text-right" : "text-left"
                            } ${
                              isChildActive ||
                              pendingHref === childNavigationHref
                                ? "bg-white/20 text-white font-semibold"
                                : "text-white/85 hover:bg-white/15"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">
                              {isArabic ? child.label_ar : child.label_en}
                            </span>
                            {pendingHref === childNavigationHref ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                            ) : null}
                          </GuardedLink>
                        )}

                        {hasGrandchildren && isChildExpanded ? (
                          <div className={isArabic ? "mr-4 mt-1" : "ml-4 mt-1"}>
                            {child.children!.map((grandchild) => {
                              const GrandchildIcon = grandchild.icon;
                              const grandchildHref = isArabic
                                ? grandchild.href_ar
                                : grandchild.href_en;
                              const grandchildNavigationHref =
                                preserveGradesQuery(grandchildHref);
                              const isGrandchildActive =
                                pathname === grandchildHref;

                              return (
                                <GuardedLink
                                  key={grandchild.key}
                                  href={grandchildNavigationHref}
                                  onClick={() =>
                                    handleItemClick(grandchild.key)
                                  }
                                  onNavigationStart={() =>
                                    handleNavigationStart(
                                      grandchildNavigationHref,
                                    )
                                  }
                                  prefetch
                                  className={`group flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-xs transition-colors ${
                                    isArabic ? "text-right" : "text-left"
                                  } ${
                                    isGrandchildActive ||
                                    pendingHref === grandchildNavigationHref
                                      ? "bg-white/20 text-white font-semibold"
                                      : "text-white/75 hover:bg-white/15"
                                  }`}
                                >
                                  <GrandchildIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {isArabic
                                      ? grandchild.label_ar
                                      : grandchild.label_en}
                                  </span>
                                  {pendingHref === grandchildNavigationHref ? (
                                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                                  ) : null}
                                </GuardedLink>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
