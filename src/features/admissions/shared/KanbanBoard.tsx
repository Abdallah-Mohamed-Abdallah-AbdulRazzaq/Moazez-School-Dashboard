// FILE: src/components/admissions/KanbanBoard.tsx

import React from "react";
import { Application } from "@/features/admissions/types/admissions";
import { Lead } from "@/features/admissions/leads/types/lead";
import StatusBadge from "./StatusBadge";
import {
  LeadStatus,
  ApplicationStatus,
  TestStatus,
  InterviewStatus,
} from "@/features/admissions/types/admissions";

interface KanbanColumn {
  id: string;
  title: string;
  count: number;
  items: (Lead | Application)[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardClick?: (item: Lead | Application) => void;
}

export default function KanbanBoard({
  columns,
  onCardClick,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="shrink-0 w-72">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                {column.count}
              </span>
            </div>

            <div className="space-y-2">
              {column.items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onCardClick?.(item)}
                  className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-primary"
                >
                  <p className="font-medium text-sm text-gray-900">
                    {"name" in item
                      ? (item as Lead).name
                      : (item as Application).studentName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {"gradeRequested" in item
                      ? (item as Application).gradeRequested
                      : ""}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      status={
                        item.status as
                          | LeadStatus
                          | ApplicationStatus
                          | TestStatus
                          | InterviewStatus
                      }
                    />
                  </div>
                </div>
              ))}

              {column.items.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No items
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
