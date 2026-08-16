"use client";

import { Button, FilterPanel, Input, Select } from "@/components/ui";

export interface TeacherFilterValues extends Record<string, string> {
  search: string;
  employmentStatus: string;
  accountStatus: string;
  membershipStatus: string;
  gender: string;
  profileCompleteness: string;
}

interface TeacherFilterBarProps {
  values: TeacherFilterValues;
  showFilters: boolean;
  onToggleFilters: () => void;
  onChange: (key: keyof TeacherFilterValues, value: string) => void;
  onClear: () => void;
  labels: {
    search: string;
    filters: string;
    clear: string;
    employment: string;
    account: string;
    membership: string;
    gender: string;
    completeness: string;
    all: string;
    active: string;
    inactive: string;
    terminated: string;
    invited: string;
    suspended: string;
    disabled: string;
    transferred: string;
    male: string;
    female: string;
    complete: string;
    incomplete: string;
  };
}

const options = (all: string, entries: Array<[string, string]>) => [
  { value: "", label: all },
  ...entries.map(([value, label]) => ({ value, label })),
];

export default function TeacherFilterBar({
  values,
  showFilters,
  onToggleFilters,
  onChange,
  onClear,
  labels,
}: TeacherFilterBarProps) {
  const hasActiveFilters = Object.values(values).some(Boolean);
  const statusEntries: Array<[string, string]> = [
    ["ACTIVE", labels.active],
    ["INACTIVE", labels.inactive],
  ];

  return (
    <FilterPanel
      searchSlot={
        <Input
          value={values.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder={labels.search}
        />
      }
      filtersSlot={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select label={labels.employment} value={values.employmentStatus} onChange={(next) => onChange("employmentStatus", next)} options={options(labels.all, [...statusEntries, ["TERMINATED", labels.terminated]])} />
          <Select label={labels.account} value={values.accountStatus} onChange={(next) => onChange("accountStatus", next)} options={options(labels.all, [["ACTIVE", labels.active], ["INVITED", labels.invited], ["SUSPENDED", labels.suspended], ["DISABLED", labels.disabled]])} />
          <Select label={labels.membership} value={values.membershipStatus} onChange={(next) => onChange("membershipStatus", next)} options={options(labels.all, [...statusEntries, ["TRANSFERRED", labels.transferred], ["SUSPENDED", labels.suspended]])} />
          <Select label={labels.gender} value={values.gender} onChange={(next) => onChange("gender", next)} options={options(labels.all, [["MALE", labels.male], ["FEMALE", labels.female]])} />
          <Select label={labels.completeness} value={values.profileCompleteness} onChange={(next) => onChange("profileCompleteness", next)} options={options(labels.all, [["complete", labels.complete], ["incomplete", labels.incomplete]])} />
        </div>
      }
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      toggleTitle={labels.filters}
      toggleAriaLabel={labels.filters}
      hasActiveFilters={hasActiveFilters}
      clearAction={<Button variant="ghost" onClick={onClear}>{labels.clear}</Button>}
    />
  );
}
