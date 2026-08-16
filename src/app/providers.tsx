"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { CommunicationRealtimeProvider } from "@/features/communication/realtime/CommunicationRealtimeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CommunicationRealtimeProvider>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </CommunicationRealtimeProvider>
    </AuthProvider>
  );
}
