"use client";

import { useContext } from "react";
import { CommunicationRealtimeContext } from "@/features/communication/realtime/CommunicationRealtimeProvider";

export function useCommunicationSocket() {
  const context = useContext(CommunicationRealtimeContext);

  if (!context) {
    throw new Error(
      "useCommunicationSocket must be used within a CommunicationRealtimeProvider",
    );
  }

  return context;
}
