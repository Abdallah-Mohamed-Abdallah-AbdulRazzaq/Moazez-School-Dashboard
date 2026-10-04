"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui";

interface TimetableCollapsibleSectionProps {
  id: string;
  title: string;
  summary?: string;
  expanded: boolean;
  expandLabel: string;
  collapseLabel: string;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
}

export default function TimetableCollapsibleSection({
  id,
  title,
  summary,
  expanded,
  expandLabel,
  collapseLabel,
  onExpandedChange,
  children,
}: TimetableCollapsibleSectionProps) {
  const actionLabel = expanded ? collapseLabel : expandLabel;

  return (
    <section className="shrink-0 border-b border-gray-200 bg-white print:hidden">
      <div className="flex min-h-10 items-center justify-between gap-3 px-4 py-1 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="shrink-0 text-sm font-semibold text-gray-900">
            {title}
          </h2>
          {!expanded && summary && (
            <span className="truncate text-xs text-gray-600">{summary}</span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={`${actionLabel}: ${title}`}
          onClick={() => onExpandedChange(!expanded)}
          className="shrink-0 px-2"
          leftIcon={
            expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )
          }
        >
          {actionLabel}
        </Button>
      </div>
      {expanded && <div id={id}>{children}</div>}
    </section>
  );
}
