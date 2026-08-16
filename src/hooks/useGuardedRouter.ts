import { useRouter, usePathname } from "next/navigation";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import { useProgressBar } from "@/providers/ProgressBarProvider";
import { useCallback } from "react";

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
 * Hook that provides guarded router methods
 * Use this instead of useRouter() when you need programmatic navigation
 * 
 * Features:
 * - Guards navigation to check for unsaved changes
 * - Prevents navigation if target is the current route
 * - Starts progress bar automatically
 * 
 * @example
 * const router = useGuardedRouter();
 * 
 * // All navigation is guarded
 * router.push("/dashboard/academics");
 * router.replace("/dashboard/calendar");
 * router.back();
 */
export function useGuardedRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const { guardedNavigate } = useNavigationGuard();
  const progress = useProgressBar();

  const push = useCallback(
    (href: string) => {
      // Check if navigating to the same route
      const targetPathname = normalizePathname(href, pathname);
      if (targetPathname === pathname) {
        // Same route - do nothing
        return;
      }
      
      guardedNavigate(() => {
        progress.start();
        router.push(href);
      });
    },
    [guardedNavigate, router, pathname, progress]
  );

  const replace = useCallback(
    (href: string) => {
      // Check if navigating to the same route
      const targetPathname = normalizePathname(href, pathname);
      if (targetPathname === pathname) {
        // Same route - do nothing
        return;
      }
      
      guardedNavigate(() => {
        progress.start();
        router.replace(href);
      });
    },
    [guardedNavigate, router, pathname, progress]
  );

  const back = useCallback(() => {
    guardedNavigate(() => {
      progress.start();
      router.back();
    });
  }, [guardedNavigate, router, progress]);

  return {
    push,
    replace,
    back,
    // Pass through other router methods that don't need guarding
    refresh: router.refresh,
    prefetch: router.prefetch,
    forward: router.forward,
  };
}
