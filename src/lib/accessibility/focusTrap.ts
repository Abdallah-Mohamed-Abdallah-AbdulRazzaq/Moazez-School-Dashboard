import * as React from "react";

/**
 * Focus trap utility for modals and dialogs
 * Ensures keyboard navigation stays within the modal
 */

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter(el => {
      // Filter out hidden elements
      return el.offsetParent !== null && 
             !el.hasAttribute('hidden') &&
             window.getComputedStyle(el).display !== 'none';
    });
}

/**
 * Creates a focus trap within a container
 * Returns a cleanup function
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstFocusable = focusableElements[0];

  // Store the element that had focus before the trap
  const previouslyFocused = document.activeElement as HTMLElement;

  // Focus the first element
  if (firstFocusable) {
    firstFocusable.focus();
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    // Get current focusable elements (they might have changed)
    const currentFocusable = getFocusableElements(container);
    const currentFirst = currentFocusable[0];
    const currentLast = currentFocusable[currentFocusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: moving backwards
      if (document.activeElement === currentFirst) {
        e.preventDefault();
        currentLast?.focus();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === currentLast) {
        e.preventDefault();
        currentFirst?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    // Restore focus to previously focused element
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}

/**
 * Hook-friendly focus trap
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
): void {
  React.useEffect(() => {
    if (typeof window === "undefined" || !isActive || !containerRef.current) {
      return;
    }

    const cleanup = createFocusTrap(containerRef.current);
    return cleanup;
  }, [containerRef, isActive]);
}
