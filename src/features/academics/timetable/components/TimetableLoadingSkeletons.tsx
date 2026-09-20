import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  label: string;
}

export function TimetablePageLoadingSkeleton({
  label,
}: LoadingSkeletonProps) {
  return (
    <LoadingRegion label={label} className="flex h-full flex-col bg-gray-50">
      <div className="flex h-12 items-end gap-8 border-b border-gray-200 bg-white px-6">
        <Skeleton className="h-8 w-24 rounded-b-none" />
        <Skeleton className="h-8 w-20 rounded-b-none" />
      </div>
      <TimetableContentSkeleton />
    </LoadingRegion>
  );
}

export function TimetableContentLoadingSkeleton({
  label,
}: LoadingSkeletonProps) {
  return (
    <LoadingRegion label={label} className="flex h-full flex-col bg-gray-50">
      <TimetableContentSkeleton />
    </LoadingRegion>
  );
}

export function TimetableActionBarLoadingSkeleton() {
  const buttonWidths = ["w-24", "w-20", "w-28", "w-24", "w-28", "w-20"];

  return (
    <div
      aria-hidden="true"
      className="flex min-h-16 flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:px-6"
    >
      {buttonWidths.map((width, index) => (
        <Skeleton key={`${width}-${index}`} className={`h-10 ${width}`} />
      ))}
    </div>
  );
}

export function TimetableGridLoadingSkeleton({ label }: LoadingSkeletonProps) {
  return (
    <LoadingRegion label={label} className="h-full min-h-[420px]">
      <GridSkeleton />
    </LoadingRegion>
  );
}

function TimetableContentSkeleton() {
  return (
    <>
      <FilterSkeleton />
      <TimetableProgressLoadingSkeleton />
      <Skeleton className="mx-4 my-3 h-7 w-56 lg:mx-6" />
      <TimetableActionBarLoadingSkeleton />
      <div className="flex-1 p-3 lg:p-6">
        <GridSkeleton />
      </div>
    </>
  );
}

function FilterSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:grid-cols-2 lg:px-6 xl:grid-cols-5 xl:gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function TimetableProgressLoadingSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-b border-gray-200 bg-white px-4 py-3 lg:px-6"
    >
      <div className="flex min-w-max items-center justify-center gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <Skeleton className="h-px w-6" />}
            <div className="flex w-32 flex-col items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid grid-cols-6 gap-px bg-gray-200 p-px">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            className="h-12 rounded-none bg-gray-100"
          />
        ))}
        {Array.from({ length: 30 }).map((_, index) => (
          <Skeleton
            key={`cell-${index}`}
            className="h-20 rounded-none bg-gray-50"
          />
        ))}
      </div>
    </div>
  );
}

function LoadingRegion({
  label,
  className,
  children,
}: LoadingSkeletonProps & { className: string; children: ReactNode }) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={className}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
