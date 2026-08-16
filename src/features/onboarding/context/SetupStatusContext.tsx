"use client";

import { createContext, useContext } from "react";
import {
  useSetupStatus,
  type UseSetupStatusResult,
} from "../hooks/useSetupStatus";

const SetupStatusContext = createContext<UseSetupStatusResult | null>(null);

export function SetupStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setupStatus = useSetupStatus();

  return (
    <SetupStatusContext.Provider value={setupStatus}>
      {children}
    </SetupStatusContext.Provider>
  );
}

export function useSetupStatusContext() {
  const setupStatus = useContext(SetupStatusContext);

  if (!setupStatus) {
    throw new Error(
      "useSetupStatusContext must be used within SetupStatusProvider",
    );
  }

  return setupStatus;
}
