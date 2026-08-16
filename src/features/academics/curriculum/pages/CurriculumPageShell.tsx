"use client";

import { Suspense } from "react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import CurriculumPageContent from "./CurriculumPageContent";

/**
 * Shell component that renders immediately
 * Shows MainLoader while heavy content loads
 */
export default function CurriculumPageShell() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<MainLoader />}>
        <CurriculumPageContent />
      </Suspense>
    </div>
  );
}
