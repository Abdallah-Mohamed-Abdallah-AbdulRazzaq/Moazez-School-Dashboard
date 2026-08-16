interface ReinforcementTableSkeletonProps {
  columns: number;
  rows?: number;
}

export default function ReinforcementTableSkeleton({
  columns,
  rows = 6,
}: ReinforcementTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100" aria-busy="true">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={`header-${index}`} className="px-4 py-3">
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {Array.from({ length: columns }).map((__, columnIndex) => (
                  <td key={`cell-${rowIndex}-${columnIndex}`} className="px-4 py-4">
                    <div
                      className={`h-4 animate-pulse rounded bg-gray-100 ${
                        columnIndex === 0 ? "w-4/5" : "w-3/5"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
