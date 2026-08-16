"use client";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export default function LessonPlansSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10" />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <SkeletonBlock className="hidden h-[32rem] lg:block" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-80" />
          ))}
        </div>
      </div>
    </div>
  );
}
