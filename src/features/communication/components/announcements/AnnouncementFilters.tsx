"use client";

import { Search, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  AnnouncementFiltersState,
  AnnouncementStatusFilter,
} from "@/features/communication/hooks/useAnnouncements";

export interface AnnouncementFiltersProps {
  filters: AnnouncementFiltersState;
  onChange: (filters: AnnouncementFiltersState) => void;
  labels: {
    search: string;
    searchPlaceholder: string;
    status: string;
    all: string;
    draft: string;
    published: string;
    archived: string;
    clear: string;
  };
}

export default function AnnouncementFilters({
  filters,
  labels,
  onChange,
}: AnnouncementFiltersProps) {
  const statusOptions: Array<{ value: AnnouncementStatusFilter; label: string }> = [
    { value: "all", label: labels.all },
    { value: "draft", label: labels.draft },
    { value: "published", label: labels.published },
    { value: "archived", label: labels.archived },
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_auto] lg:items-end">
      <Input
        label={labels.search}
        placeholder={labels.searchPlaceholder}
        value={filters.search}
        onChange={(event) =>
          onChange({ ...filters, search: event.target.value })
        }
        leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
      />
      <Select
        label={labels.status}
        value={filters.status}
        onChange={(value) =>
          onChange({ ...filters, status: value as AnnouncementStatusFilter })
        }
        options={statusOptions}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange({ search: "", status: "all" })}
        leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.clear}
      </Button>
    </div>
  );
}
