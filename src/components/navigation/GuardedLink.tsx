"use client";

import { useRouter, usePathname } from "next/navigation";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import { useProgressBar } from "@/providers/ProgressBarProvider";
import React, { useCallback } from "react";

interface GuardedLinkProps extends Pick<React.AriaAttributes, "aria-current"> {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  replace?: boolean;
  prefetch?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
  title?: string;
  onMouseEnter?: () => void;
  onNavigationStart?: () => void; // Called only when navigation actually starts
}

/**
 * Guarded navigation link that checks for unsaved changes before navigating
 * Use this instead of next/link in dashboard navigation
 * 
 * Features:
 * - Prefetches routes on hover for instant navigation
 * - Guards navigation to check for unsaved changes
 * - Prevents navigation if clicking the current route
 * - Supports all standard link props
 * 
 * @example
 * <GuardedLink href="/dashboard/academics" prefetch>
 *   Academics
 * </GuardedLink>
 */
export default function GuardedLink({
  href,
  children,
  className,
  style,
  replace = false,
  prefetch = true,
  onClick,
  disabled = false,
  title,
  onMouseEnter,
  onNavigationStart,
  "aria-current": ariaCurrent,
}: GuardedLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { guardedNavigate } = useNavigationGuard();
  const progress = useProgressBar();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Preserve default link behavior for:
    // - Events that are already prevented
    // - Non-left clicks (middle click, right click)
    // - Modified clicks (Cmd/Ctrl/Shift/Alt + click for new tab/window)
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      // Let the browser handle these naturally
      return;
    }
    
    // Only prevent default for plain left clicks
    e.preventDefault();
    
    if (disabled) return;
    
    const currentUrl = new URL(window.location.href);
    currentUrl.pathname = pathname;
    const targetUrl = new URL(href, currentUrl);

    // Status-filter links share a pathname but represent different destinations.
    if (targetUrl.href === currentUrl.href) {
      // Same route - do nothing (no navigation, no loading, no progress)
      onClick?.(e);
      return;
    }
    
    // Call custom onClick if provided
    onClick?.(e);
    
    // Guard the navigation
    guardedNavigate(() => {
      onNavigationStart?.();

      // Start progress bar immediately before navigation
      progress.start();
      
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  };

  // Prefetch on hover for instant navigation
  const handleMouseEnter = useCallback(() => {
    if (prefetch && !disabled) {
      router.prefetch(href);
    }
    onMouseEnter?.();
  }, [prefetch, disabled, href, router, onMouseEnter]);

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={className}
      title={title}
      aria-disabled={disabled}
      aria-current={ariaCurrent}
      style={{ ...style, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </a>
  );
}
