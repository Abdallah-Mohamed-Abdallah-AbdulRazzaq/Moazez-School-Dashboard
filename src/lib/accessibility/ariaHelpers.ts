/**
 * ARIA helper utilities for improved accessibility
 */

/**
 * Generates a unique ID for ARIA attributes
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  idCounter++;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Creates ARIA label props for icon-only buttons
 */
export interface AriaLabelProps {
  'aria-label': string;
  'aria-labelledby'?: string;
}

export function createAriaLabel(label: string): AriaLabelProps {
  return {
    'aria-label': label,
  };
}

/**
 * Creates ARIA description props
 */
export interface AriaDescriptionProps {
  'aria-describedby': string;
}

export function createAriaDescription(descriptionId: string): AriaDescriptionProps {
  return {
    'aria-describedby': descriptionId,
  };
}

/**
 * Creates ARIA live region props for announcements
 */
export interface AriaLiveProps {
  role: 'status' | 'alert' | 'log';
  'aria-live': 'polite' | 'assertive' | 'off';
  'aria-atomic': boolean;
}

export function createAriaLive(
  type: 'polite' | 'assertive' = 'polite',
  role: 'status' | 'alert' | 'log' = 'status'
): AriaLiveProps {
  return {
    role,
    'aria-live': type,
    'aria-atomic': true,
  };
}

/**
 * Creates ARIA props for modals/dialogs
 */
export interface AriaModalProps {
  role: 'dialog' | 'alertdialog';
  'aria-modal': boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function createAriaModal(
  labelId?: string,
  descriptionId?: string,
  isAlert: boolean = false
): AriaModalProps {
  return {
    role: isAlert ? 'alertdialog' : 'dialog',
    'aria-modal': true,
    ...(labelId && { 'aria-labelledby': labelId }),
    ...(descriptionId && { 'aria-describedby': descriptionId }),
  };
}

/**
 * Creates ARIA props for expandable sections
 */
export interface AriaExpandableProps {
  'aria-expanded': boolean;
  'aria-controls'?: string;
}

export function createAriaExpandable(
  isExpanded: boolean,
  controlsId?: string
): AriaExpandableProps {
  return {
    'aria-expanded': isExpanded,
    ...(controlsId && { 'aria-controls': controlsId }),
  };
}

/**
 * Creates ARIA props for loading states
 */
export interface AriaLoadingProps {
  'aria-busy': boolean;
  'aria-live'?: 'polite' | 'assertive';
}

export function createAriaLoading(isLoading: boolean): AriaLoadingProps {
  return {
    'aria-busy': isLoading,
    ...(isLoading && { 'aria-live': 'polite' }),
  };
}

/**
 * Announces a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Screen reader only class for visually hidden but accessible content
 */
export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
