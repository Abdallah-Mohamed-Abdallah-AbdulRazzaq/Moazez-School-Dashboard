"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui";

export interface TimetableWorkspacePanel {
  id: string;
  title: string;
  summary?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

interface TimetableWorkspacePanelBarProps {
  label: string;
  panels: TimetableWorkspacePanel[];
}

export default function TimetableWorkspacePanelBar({
  label,
  panels,
}: TimetableWorkspacePanelBarProps) {
  return (
    <nav
      aria-label={label}
      className="shrink-0 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 print:hidden lg:px-6"
    >
      <div className="flex min-w-max items-center gap-2">
        {panels.map((panel) => (
          <Button
            key={panel.id}
            type="button"
            size="sm"
            variant="secondary"
            aria-expanded={panel.expanded}
            aria-controls={panel.id}
            onClick={() => panel.onExpandedChange(!panel.expanded)}
            className={
              panel.expanded
                ? "border-primary-300 bg-primary-50 text-primary-800"
                : "text-gray-700"
            }
            rightIcon={
              panel.expanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )
            }
          >
            <span className="font-semibold">{panel.title}</span>
            {!panel.expanded && panel.summary && (
              <span className="hidden max-w-56 truncate font-normal text-gray-500 sm:inline">
                {panel.summary}
              </span>
            )}
          </Button>
        ))}
      </div>
    </nav>
  );
}
