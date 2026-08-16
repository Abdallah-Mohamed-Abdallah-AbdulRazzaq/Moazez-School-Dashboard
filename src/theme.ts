// theme.ts
import { createTheme } from "@mui/material/styles";
import { tokens } from "@/design/tokens";

export const theme = createTheme({
  // Typography
  typography: {
    fontFamily: tokens.typography.fontFamily.sans.join(", "),
    fontSize: 16,
    
    h1: {
      fontSize: tokens.typography.fontSize["5xl"][0],
      fontWeight: tokens.typography.fontWeight.bold,
      lineHeight: tokens.typography.fontSize["5xl"][1].lineHeight,
    },
    h2: {
      fontSize: tokens.typography.fontSize["4xl"][0],
      fontWeight: tokens.typography.fontWeight.bold,
      lineHeight: tokens.typography.fontSize["4xl"][1].lineHeight,
    },
    h3: {
      fontSize: tokens.typography.fontSize["3xl"][0],
      fontWeight: tokens.typography.fontWeight.semibold,
      lineHeight: tokens.typography.fontSize["3xl"][1].lineHeight,
    },
    h4: {
      fontSize: tokens.typography.fontSize["2xl"][0],
      fontWeight: tokens.typography.fontWeight.semibold,
      lineHeight: tokens.typography.fontSize["2xl"][1].lineHeight,
    },
    h5: {
      fontSize: tokens.typography.fontSize.xl[0],
      fontWeight: tokens.typography.fontWeight.medium,
      lineHeight: tokens.typography.fontSize.xl[1].lineHeight,
    },
    h6: {
      fontSize: tokens.typography.fontSize.lg[0],
      fontWeight: tokens.typography.fontWeight.medium,
      lineHeight: tokens.typography.fontSize.lg[1].lineHeight,
    },
    body1: {
      fontSize: tokens.typography.fontSize.base[0],
      lineHeight: tokens.typography.fontSize.base[1].lineHeight,
    },
    body2: {
      fontSize: tokens.typography.fontSize.sm[0],
      lineHeight: tokens.typography.fontSize.sm[1].lineHeight,
    },
    button: {
      fontSize: tokens.typography.fontSize.sm[0],
      fontWeight: tokens.typography.fontWeight.medium,
      textTransform: "none",
    },
    caption: {
      fontSize: tokens.typography.fontSize.xs[0],
      lineHeight: tokens.typography.fontSize.xs[1].lineHeight,
    },
  },
  
  // Color palette
  palette: {
    primary: {
      main: tokens.colors.primary.DEFAULT,
      light: tokens.colors.primary[300],
      dark: tokens.colors.primary[700],
      contrastText: tokens.colors.white,
    },
    secondary: {
      main: tokens.colors.accent.DEFAULT,
      light: tokens.colors.accent[300],
      dark: tokens.colors.accent[700],
      contrastText: tokens.colors.white,
    },
    error: {
      main: tokens.colors.error.DEFAULT,
      light: tokens.colors.error.light,
      dark: tokens.colors.error.dark,
      contrastText: tokens.colors.white,
    },
    warning: {
      main: tokens.colors.warning.DEFAULT,
      light: tokens.colors.warning.light,
      dark: tokens.colors.warning.dark,
      contrastText: tokens.colors.white,
    },
    info: {
      main: tokens.colors.info.DEFAULT,
      light: tokens.colors.info.light,
      dark: tokens.colors.info.dark,
      contrastText: tokens.colors.white,
    },
    success: {
      main: tokens.colors.success.DEFAULT,
      light: tokens.colors.success.light,
      dark: tokens.colors.success.dark,
      contrastText: tokens.colors.white,
    },
    background: {
      default: tokens.colors.white,
      paper: tokens.colors.white,
    },
    text: {
      primary: tokens.colors.black,
      secondary: tokens.colors.neutral[600],
    },
  },
  
  // Spacing (MUI uses 8px base by default, we'll keep it consistent)
  spacing: 8,
  
  // Shape (border radius)
  shape: {
    borderRadius: parseInt(tokens.borderRadius.lg), // 8px default
  },
  
  // Shadows
  shadows: [
    "none",
    tokens.shadows.sm,
    tokens.shadows.DEFAULT,
    tokens.shadows.md,
    tokens.shadows.md,
    tokens.shadows.lg,
    tokens.shadows.lg,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
    tokens.shadows["2xl"],
  ],
  
  // Breakpoints
  breakpoints: {
    values: {
      xs: parseInt(tokens.breakpoints.xs),
      sm: parseInt(tokens.breakpoints.sm),
      md: parseInt(tokens.breakpoints.md),
      lg: parseInt(tokens.breakpoints.lg),
      xl: parseInt(tokens.breakpoints.xl),
    },
  },
  
  // Z-index
  zIndex: {
    mobileStepper: tokens.zIndex[10],
    speedDial: tokens.zIndex[50],
    appBar: tokens.zIndex.sticky,
    drawer: tokens.zIndex.fixed,
    modal: tokens.zIndex.modal,
    snackbar: tokens.zIndex.popover,
    tooltip: tokens.zIndex.tooltip,
  },
  
  // Transitions
  transitions: {
    duration: {
      shortest: parseInt(tokens.transitions.duration[150]),
      shorter: parseInt(tokens.transitions.duration[200]),
      short: 250,
      standard: parseInt(tokens.transitions.duration[300]),
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: tokens.transitions.timing.inOut,
      easeOut: tokens.transitions.timing.out,
      easeIn: tokens.transitions.timing.in,
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },
  
  // Component overrides
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.lg,
          textTransform: "none",
          fontWeight: tokens.typography.fontWeight.medium,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.xl,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.xl,
          boxShadow: tokens.shadows.sm,
        },
      },
    },
  },
});