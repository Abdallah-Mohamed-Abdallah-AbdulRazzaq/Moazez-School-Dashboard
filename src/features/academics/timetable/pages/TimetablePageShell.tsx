"use client";

import { Suspense } from "react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import TimetablePageContent from "./TimetablePageContent";

/**
 * Shell component that renders immediately
 * Shows MainLoader while heavy content loads
 */
export default function TimetablePageShell() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <Suspense fallback={<MainLoader />}>
        <TimetablePageContent />
      </Suspense>
    </div>
  );
}
