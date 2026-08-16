"use client";

import { useTranslations } from "next-intl";

export type StudentTabSkeletonVariant =
  | "cards"
  | "dashboard"
  | "form"
  | "table"
  | "timeline";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`motion-safe:animate-pulse rounded-lg bg-slate-100 ${className}`}
    />
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-44" />
        <SkeletonBlock className="h-4 w-64 max-w-[70vw]" />
      </div>
      <SkeletonBlock className="h-10 w-28" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="space-y-2" key={index}>
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-24 w-full" />
      </div>
      <SkeletonBlock className="h-36 w-full" />
    </>
  );
}

function TableSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonBlock className="h-12 w-full" />
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <SkeletonBlock className="h-11 w-full rounded-none" />
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className="grid grid-cols-4 gap-4 border-t border-slate-100 p-4"
            key={index}
          >
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-4/5" />
            <SkeletonBlock className="h-4 w-3/5" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock className="h-28 w-full" key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-64 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </>
  );
}

function CardsSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock className="h-36 w-full" key={index} />
        ))}
      </div>
    </>
  );
}

function TimelineSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="space-y-4 rounded-xl border border-slate-100 p-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="flex gap-4" key={index}>
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-2/5" />
              <SkeletonBlock className="h-4 w-4/5" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function StudentTabSkeleton({
  variant = "table",
}: {
  variant?: StudentTabSkeletonVariant;
}) {
  const t = useTranslations("common");
  const content = {
    cards: <CardsSkeleton />,
    dashboard: <DashboardSkeleton />,
    form: <FormSkeleton />,
    table: <TableSkeleton />,
    timeline: <TimelineSkeleton />,
  }[variant];

  return (
    <div
      aria-busy="true"
      role="status"
      className="min-h-64 space-y-6"
    >
      <span className="sr-only">{t("loading")}</span>
      {content}
    </div>
  );
}
