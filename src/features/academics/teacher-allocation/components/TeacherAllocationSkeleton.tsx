"use client";

import Skeleton from "@/components/ui/skeleton/Skeleton";

export default function TeacherAllocationSkeleton({
  view,
  label,
}: {
  view: "matrix" | "load";
  label: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="h-full min-h-0 flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <Skeleton className="h-10 w-64" />
        {view === "matrix" && <SkeletonToolbar view={view} />}
        <SkeletonMetrics view={view} />
        {view === "load" && <SkeletonToolbar view={view} />}
        {view === "matrix" ? <SkeletonMatrix /> : <SkeletonTeacherCards />}
      </div>
    </div>
  );
}

function SkeletonMetrics({ view }: { view: "matrix" | "load" }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${view === "matrix" ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>
      {Array.from({ length: view === "matrix" ? 6 : 4 }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

function SkeletonToolbar({ view }: { view: "matrix" | "load" }) {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4">
      {view === "load" && <Skeleton className="h-9 w-48 flex-1" />}
      {Array.from({ length: view === "matrix" ? 5 : 1 }, (_, index) => (
        <div key={index} className="w-full space-y-2 sm:w-40">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      {view === "load" && <Skeleton className="h-9 w-24 self-end" />}
    </div>
  );
}

function SkeletonMatrix() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="min-w-[720px]">
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 gap-4 border-b border-slate-100 p-4 last:border-0">
            {Array.from({ length: 6 }, (_, columnIndex) => (
              <Skeleton key={columnIndex} className={rowIndex === 0 ? "h-4" : "h-8"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonTeacherCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
