/**
 * Accessibility utilities index
 * Central export for all a11y helpers
 */

export * from './focusTrap';
export * from './ariaHelpers';

/**
 * Accessibility checklist for components
 * 
 * KEYBOARD NAVIGATION:
 * - [ ] All interactive elements are keyboard accessible
 * - [ ] Tab order is logical
 * - [ ] Focus indicators are visible
 * - [ ] Escape key closes modals/dropdowns
 * - [ ] Enter/Space activates buttons
 * 
 * FOCUS MANAGEMENT:
 * - [ ] Focus is trapped in modals
 * - [ ] Focus returns to trigger element when modal closes
 * - [ ] Focus moves to first interactive element in modal
 * - [ ] Skip links are provided for long content
 * 
 * ARIA LABELS:
 * - [ ] All icon-only buttons have aria-label
 * - [ ] Form inputs have associated labels
 * - [ ] Error messages are announced
 * - [ ] Loading states use aria-busy
 * - [ ] Expandable sections use aria-expanded
 * 
 * LIVE REGIONS:
 * - [ ] Toast notifications use aria-live
 * - [ ] Dynamic content changes are announced
 * - [ ] Status messages use role="status"
 * - [ ] Alerts use role="alert"
 * 
 * SEMANTIC HTML:
 * - [ ] Proper heading hierarchy (h1, h2, h3...)
 * - [ ] Buttons use <button> not <div>
 * - [ ] Links use <a> with href
 * - [ ] Forms use proper form elements
 * - [ ] Lists use <ul>/<ol>/<li>
 * 
 * COLOR & CONTRAST:
 * - [ ] Text has sufficient contrast (4.5:1 minimum)
 * - [ ] Focus indicators are visible
 * - [ ] Color is not the only indicator
 * - [ ] Links are distinguishable from text
 * 
 * RESPONSIVE & MOBILE:
 * - [ ] Touch targets are at least 44x44px
 * - [ ] Content reflows at 200% zoom
 * - [ ] No horizontal scrolling at mobile sizes
 * - [ ] Pinch zoom is not disabled
 */

export const A11Y_CHECKLIST = {
  KEYBOARD_NAVIGATION: [
    'All interactive elements are keyboard accessible',
    'Tab order is logical',
    'Focus indicators are visible',
    'Escape key closes modals/dropdowns',
    'Enter/Space activates buttons',
  ],
  FOCUS_MANAGEMENT: [
    'Focus is trapped in modals',
    'Focus returns to trigger element when modal closes',
    'Focus moves to first interactive element in modal',
    'Skip links are provided for long content',
  ],
  ARIA_LABELS: [
    'All icon-only buttons have aria-label',
    'Form inputs have associated labels',
    'Error messages are announced',
    'Loading states use aria-busy',
    'Expandable sections use aria-expanded',
  ],
  LIVE_REGIONS: [
    'Toast notifications use aria-live',
    'Dynamic content changes are announced',
    'Status messages use role="status"',
    'Alerts use role="alert"',
  ],
  SEMANTIC_HTML: [
    'Proper heading hierarchy (h1, h2, h3...)',
    'Buttons use <button> not <div>',
    'Links use <a> with href',
    'Forms use proper form elements',
    'Lists use <ul>/<ol>/<li>',
  ],
  COLOR_CONTRAST: [
    'Text has sufficient contrast (4.5:1 minimum)',
    'Focus indicators are visible',
    'Color is not the only indicator',
    'Links are distinguishable from text',
  ],
  RESPONSIVE_MOBILE: [
    'Touch targets are at least 44x44px',
    'Content reflows at 200% zoom',
    'No horizontal scrolling at mobile sizes',
    'Pinch zoom is not disabled',
  ],
} as const;
