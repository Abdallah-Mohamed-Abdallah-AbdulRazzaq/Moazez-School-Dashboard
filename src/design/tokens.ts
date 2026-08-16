/**
 * Design Tokens
 * 
 * Single source of truth for all design decisions (colors, spacing, typography, etc.)
 * These tokens are consumed by both Tailwind and MUI theme configurations.
 * 
 * @see tailwind.config.ts - Tailwind theme extension
 * @see src/theme.ts - MUI theme configuration
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    DEFAULT: '#036b80',
    50: '#e6f2f4',
    100: '#cce5e9',
    200: '#99cbd3',
    300: '#66b1bd',
    400: '#3397a7',
    500: '#036b80', // Main primary
    600: '#025a6b',
    700: '#024956',
    800: '#013841',
    900: '#01272c',
    950: '#001317',
  },
  
  // Hover state (darker primary)
  hover: {
    DEFAULT: '#025a6b',
    50: '#e6f0f2',
    100: '#cce1e5',
    200: '#99c3cb',
    300: '#66a5b1',
    400: '#338797',
    500: '#025a6b', // Main hover
    600: '#024b59',
    700: '#013c47',
    800: '#012d35',
    900: '#011e23',
    950: '#000f12',
  },
  
  // Accent color (orange/gold)
  accent: {
    DEFAULT: '#F7A201',
    50: '#fef6e6',
    100: '#fdedcc',
    200: '#fbdb99',
    300: '#f9c966',
    400: '#f7b733',
    500: '#F7A201', // Main accent
    600: '#c68201',
    700: '#946101',
    800: '#634100',
    900: '#312000',
  },
  
  // Surface/background colors
  surface: {
    DEFAULT: '#EAE0CF',
    50: '#fdfcfa',
    100: '#faf8f5',
    200: '#f5f1eb',
    300: '#f0e9e1',
    400: '#ebe2d7',
    500: '#EAE0CF', // Main surface
    600: '#bbb3a6',
    700: '#8c867d',
    800: '#5d5a54',
    900: '#2e2d2a',
  },
  
  // Neutral/gray colors
  neutral: {
    DEFAULT: '#AFADB2',
    50: '#f7f7f8',
    100: '#efeff0',
    200: '#dfdfe1',
    300: '#cfcfd2',
    400: '#bfbec3',
    500: '#AFADB2', // Main neutral
    600: '#8c8a8e',
    700: '#69686b',
    800: '#464547',
    900: '#232324',
  },
  
  // Semantic colors
  success: {
    DEFAULT: '#04cc97',
    light: '#e6faf5',
    dark: '#039970',
  },
  
  error: {
    DEFAULT: '#e31919',
    light: '#fce8e8',
    dark: '#b61414',
  },
  
  warning: {
    DEFAULT: '#f59e0b',
    light: '#fef3c7',
    dark: '#d97706',
  },
  
  info: {
    DEFAULT: '#3b82f6',
    light: '#dbeafe',
    dark: '#2563eb',
  },
  
  // Base colors
  white: '#fefefe',
  black: '#000000',
  gray: 'grey',
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: ['var(--font-somar)', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: 'none',
  // Custom main shadow
  main: '0 4px 4px 0 rgba(0, 0, 0, 0.25)',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 'auto',
  // Semantic z-index values
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  timing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// BORDERS
// ============================================================================

export const borders = {
  width: {
    0: '0',
    DEFAULT: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
  
  color: {
    DEFAULT: '#cccccccc',
    light: '#e5e7eb',
    dark: '#9ca3af',
  },
} as const;

// ============================================================================
// EXPORTS FOR CONSUMPTION
// ============================================================================

/**
 * Design tokens object for easy consumption
 */
export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  borders,
} as const;

export default tokens;
