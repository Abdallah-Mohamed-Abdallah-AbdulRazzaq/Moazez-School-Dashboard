import type { PropsWithChildren } from "react";

interface AttendanceMobileActionsProps extends PropsWithChildren {
  columns?: 1 | 2;
  className?: string;
}

export default function AttendanceMobileActions({
  children,
  columns = 1,
  className = "",
}: AttendanceMobileActionsProps) {
  const columnsClassName = columns === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className={`grid ${columnsClassName} gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
}
