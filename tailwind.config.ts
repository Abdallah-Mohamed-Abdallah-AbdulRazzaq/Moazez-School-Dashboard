import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import { tokens } from "./src/design/tokens.ts";

const config: Config = {
  // Content scanning configuration - critical for proper CSS generation
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // Colors from design tokens
      colors: {
        primary: tokens.colors.primary,
        hover: tokens.colors.hover,
        accent: tokens.colors.accent,
        surface: tokens.colors.surface,
        neutral: tokens.colors.neutral,
        success: tokens.colors.success,
        error: tokens.colors.error,
        warning: tokens.colors.warning,
        info: tokens.colors.info,
        
        // Add border color for standard utility usage
        border: tokens.colors.neutral[200],
      },
      
      // Typography from design tokens
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      
      // Spacing from design tokens
      spacing: tokens.spacing,
      
      // Border radius from design tokens
      borderRadius: tokens.borderRadius,
      
      // Shadows from design tokens
      boxShadow: tokens.shadows,
      
      // Z-index from design tokens
      zIndex: tokens.zIndex,
      
      // Transitions from design tokens
      transitionDuration: tokens.transitions.duration,
      transitionTimingFunction: tokens.transitions.timing,
      
      // Border width from design tokens
      borderWidth: tokens.borders.width,
    },
  },
  plugins: [forms],
};

export default config;


