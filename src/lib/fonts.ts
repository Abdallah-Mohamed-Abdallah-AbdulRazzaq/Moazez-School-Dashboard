import localFont from "next/font/local";

// Cairo font with local files for offline builds
// Using woff2 format for better compression and performance
export const somar = localFont({
  src: [
    {
      path: "../../public/fonts/somar/standard/SomarSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/somar/standard/SomarSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/somar/standard/SomarSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/somar/standard/SomarSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-somar",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});
