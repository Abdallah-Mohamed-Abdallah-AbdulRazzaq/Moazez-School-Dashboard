"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { DashboardCommandCenterResponse } from "@/features/dashboard/types/dashboardApi.types";

const DashboardAnalysisCharts = dynamic(() => import("./DashboardAnalysisCharts"), {
  loading: () => <PartialLoader />,
});

export default function DeferredDashboardAnalysisCharts({
  commandCenter,
}: {
  commandCenter: DashboardCommandCenterResponse | null;
}) {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary || !commandCenter || isNearViewport) return;
    if (typeof IntersectionObserver === "undefined") {
      let active = true;
      queueMicrotask(() => {
        if (active) setIsNearViewport(true);
      });
      return () => { active = false; };
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "100% 0px" });
    observer.observe(boundary);
    return () => observer.disconnect();
  }, [commandCenter, isNearViewport]);

  return (
    <div ref={boundaryRef} className={isNearViewport ? undefined : "min-h-[1px]"}>
      {isNearViewport ? <DashboardAnalysisCharts commandCenter={commandCenter} /> : null}
    </div>
  );
}
