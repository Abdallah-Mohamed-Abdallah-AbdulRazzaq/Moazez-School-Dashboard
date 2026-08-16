export function SetupGuideSkeleton() {
  return (
    <section
      aria-busy="true"
      className="min-h-[520px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-56 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-2 w-40 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="h-36 animate-pulse rounded-xl border border-gray-100 bg-gray-50" key={index} />
        ))}
      </div>
      <div className="mt-5 h-48 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
    </section>
  );
}
