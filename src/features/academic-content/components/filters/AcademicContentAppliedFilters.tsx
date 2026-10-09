"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";

export interface AppliedAcademicContentFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface AcademicContentAppliedFiltersProps {
  filters: AppliedAcademicContentFilter[];
  removeLabel: (label: string) => string;
}

export default function AcademicContentAppliedFilters({
  filters,
  removeLabel,
}: AcademicContentAppliedFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full border-indigo-100 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
          aria-label={removeLabel(filter.label)}
          rightIcon={<X aria-hidden="true" className="size-3.5" />}
          onClick={filter.onRemove}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
