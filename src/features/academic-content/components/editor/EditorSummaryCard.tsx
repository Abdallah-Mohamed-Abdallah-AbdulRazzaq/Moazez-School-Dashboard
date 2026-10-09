import type { ReactNode } from "react";

interface EditorSummaryCardProps {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function EditorSummaryCard({
  icon,
  title,
  action,
  children,
}: EditorSummaryCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
