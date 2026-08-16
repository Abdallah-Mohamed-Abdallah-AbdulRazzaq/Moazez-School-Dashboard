"use client";

import AdmissionsDashboardContent from "../pages/AdmissionsDashboardContent";

/**
 * Backward-compatible export for routes that still import the legacy container.
 * The active dashboard implementation owns API loading and state management.
 */
export default function AdmissionsDashboardContainer() {
  return <AdmissionsDashboardContent />;
}
