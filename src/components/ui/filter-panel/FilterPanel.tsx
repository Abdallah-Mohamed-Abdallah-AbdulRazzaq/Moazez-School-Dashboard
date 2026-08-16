"use client";

import type { ReactNode } from "react";
import { Filter } from "lucide-react";

export interface FilterPanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  searchSlot?: ReactNode;
  bodySlot?: ReactNode;
  filtersSlot?: ReactNode;
  showFilters: boolean;
  onToggleFilters: () => void;
  clearAction?: ReactNode;
  hasActiveFilters?: boolean;
  className?: string;
  toggleTitle?: string;
  toggleAriaLabel?: string;
}

export default function FilterPanel({
  title,
  subtitle,
  searchSlot,
  bodySlot,
  filtersSlot,
  showFilters,
  onToggleFilters,
  clearAction,
  hasActiveFilters = false,
  className = "",
  toggleTitle,
  toggleAriaLabel,
}: FilterPanelProps) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ${className}`.trim()}>
      <div className="space-y-3">
        {(title || subtitle) && (
          <div className="space-y-1">
            {title ? (
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-gray-500">{subtitle}</p>
            ) : null}
          </div>
        )}

        {(searchSlot || filtersSlot) && (
          <div className="flex gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">{searchSlot}</div>
            {filtersSlot ? (
              <button
                type="button"
                onClick={onToggleFilters}
                aria-label={toggleAriaLabel || toggleTitle}
                title={toggleTitle}
                className={`rounded-lg border p-2 transition-colors ${
                  showFilters
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        )}

        {bodySlot ? <div>{bodySlot}</div> : null}

        {showFilters && filtersSlot ? (
          <div className="space-y-3">
            {filtersSlot}
            {hasActiveFilters && clearAction ? (
              <div className="flex justify-start sm:justify-end">
                {clearAction}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
