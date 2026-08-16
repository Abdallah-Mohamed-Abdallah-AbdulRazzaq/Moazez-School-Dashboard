"use client";

import { useRouter, usePathname } from "next/navigation";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import { useProgressBar } from "@/providers/ProgressBarProvider";
import React, { useCallback } from "react";

interface GuardedLinkProps {
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
 * Normalize a URL to extract pathname for comparison
 * Handles absolute URLs, relative URLs, and URLs with query params/hash
 */
function normalizePathname(href: string, currentPathname: string): string {
  try {
    // If href is absolute (starts with http/https), parse it
    if (href.startsWith("http://") || href.startsWith("https://")) {
      const url = new URL(href);
      return url.pathname;
    }
    
    // If href starts with /, it's already a pathname
    if (href.startsWith("/")) {
      // Remove query params and hash
      return href.split("?")[0].split("#")[0];
    }
    
    // Relative URL - resolve against current pathname
    const base = currentPathname.endsWith("/") ? currentPathname : currentPathname + "/";
    return (base + href).split("?")[0].split("#")[0];
  } catch {
    // Fallback: just remove query/hash
    return href.split("?")[0].split("#")[0];
  }
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
    
    // Check if clicking the same route
    const targetPathname = normalizePathname(href, pathname);
    const currentPathname = pathname;
    
    if (targetPathname === currentPathname) {
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
      style={{ ...style, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </a>
  );
}
