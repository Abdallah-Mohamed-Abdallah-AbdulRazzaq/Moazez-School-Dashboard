"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import AnnouncementSearchSelect from "@/features/communication/components/selectors/AnnouncementSearchSelect";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import type {
  NotificationFiltersState,
  NotificationStatusFilter,
} from "@/features/communication/hooks/useNotifications";
import type {
  NotificationPriority,
  NotificationSourceModule,
  NotificationType,
} from "@/features/communication/types/notification.types";
import {
  filterDate,
  filterIsoValue,
} from "@/features/communication/utils/notification-filter-dates";

export interface NotificationFiltersProps {
  filters: NotificationFiltersState;
  onChange: (filters: NotificationFiltersState) => void;
  labels: {
    status: string;
    all: string;
    unread: string;
    read: string;
    archived: string;
    priority: string;
    low: string;
    normal: string;
    high: string;
    urgent: string;
    type: string;
    sourceModule: string;
    sourceType: string;
    sourceId: string;
    recipientUserId: string;
    selectSourceTypeFirst: string;
    createdFrom: string;
    createdTo: string;
    clear: string;
  };
}

const notificationTypes: NotificationType[] = [
  "announcement_published",
  "message_received",
  "message_mention",
  "attendance_absence",
  "attendance_late",
  "grade_posted",
  "behavior_record_created",
  "reinforcement_reward_granted",
  "system_alert",
];

const sourceModules: NotificationSourceModule[] = [
  "communication",
  "announcements",
  "attendance",
  "grades",
  "behavior",
  "reinforcement",
  "admissions",
  "students",
  "system",
];

const priorities: NotificationPriority[] = ["low", "normal", "high", "urgent"];
const sourceTypes: Array<{
  value: string;
  label: string;
  sourceModule: NotificationSourceModule | null;
}> = [
  {
    value: "communication_announcement",
    label: "announcement",
    sourceModule: "announcements",
  },
  {
    value: "communication_message",
    label: "message",
    sourceModule: "communication",
  },
  {
    value: "school_support_message",
    label: "school_support_message",
    sourceModule: "communication",
  },
  {
    value: "attendance_absence_submit",
    label: "attendance_absence",
    sourceModule: "attendance",
  },
  {
    value: "dismissal_request",
    label: "dismissal_request",
    sourceModule: null,
  },
];

const emptyFilters: NotificationFiltersState = {
  status: "all",
  priority: "",
  type: "",
  sourceModule: "",
  sourceType: "",
  sourceId: "",
  recipientUserId: "",
  createdFrom: "",
  createdTo: "",
};

function sourceTypeOptions(sourceModule: "" | NotificationSourceModule) {
  if (!sourceModule) return sourceTypes;
  return sourceTypes.filter((option) => option.sourceModule === sourceModule);
}

function isAnnouncementSource(
  sourceModule: "" | NotificationSourceModule,
  sourceType: string,
) {
  return (
    sourceModule === "announcements" ||
    sourceType === "communication_announcement"
  );
}

export default function NotificationFilters({
  filters,
  labels,
  onChange,
}: NotificationFiltersProps) {
  const statusOptions: Array<{ value: NotificationStatusFilter; label: string }> = [
    { value: "all", label: labels.all },
    { value: "unread", label: labels.unread },
    { value: "read", label: labels.read },
    { value: "archived", label: labels.archived },
  ];
  const priorityLabels = {
    low: labels.low,
    normal: labels.normal,
    high: labels.high,
    urgent: labels.urgent,
  } satisfies Record<NotificationPriority, string>;

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <Select
        label={labels.status}
        value={filters.status}
        onChange={(value) =>
          onChange({ ...filters, status: value as NotificationStatusFilter })
        }
        options={statusOptions}
      />
      <Select
        label={labels.priority}
        value={filters.priority}
        onChange={(value) =>
          onChange({ ...filters, priority: value as "" | NotificationPriority })
        }
        options={[
          { value: "", label: labels.all },
          ...priorities.map((priority) => ({
            value: priority,
            label: priorityLabels[priority],
          })),
        ]}
      />
      <Select
        label={labels.type}
        value={filters.type}
        searchable
        onChange={(value) =>
          onChange({ ...filters, type: value as "" | NotificationType })
        }
        options={[
          { value: "", label: labels.all },
          ...notificationTypes.map((type) => ({ value: type, label: type })),
        ]}
      />
      <Select
        label={labels.sourceModule}
        value={filters.sourceModule}
        searchable
        onChange={(value) =>
          onChange({
            ...filters,
            sourceModule: value as "" | NotificationSourceModule,
            sourceType: "",
            sourceId: "",
          })
        }
        options={[
          { value: "", label: labels.all },
          ...sourceModules.map((module) => ({ value: module, label: module })),
        ]}
      />
      <Select
        label={labels.sourceType}
        value={filters.sourceType}
        searchable
        onChange={(value) => onChange({ ...filters, sourceType: value, sourceId: "" })}
        options={[
          { value: "", label: labels.all },
          ...sourceTypeOptions(filters.sourceModule).map((sourceType) => ({
            value: sourceType.value,
            label: sourceType.label,
          })),
        ]}
      />
      {isAnnouncementSource(filters.sourceModule, filters.sourceType) ? (
        <AnnouncementSearchSelect
          label={labels.sourceId}
          value={filters.sourceId}
          onChange={(sourceId) => onChange({ ...filters, sourceId })}
        />
      ) : (
        <Input
          key={`${filters.sourceModule}:${filters.sourceType}:${filters.sourceId}`}
          label={labels.sourceId}
          defaultValue={filters.sourceId}
          dir="ltr"
          disabled={!filters.sourceModule && !filters.sourceType}
          helperText={
            !filters.sourceModule && !filters.sourceType
              ? labels.selectSourceTypeFirst
              : undefined
          }
          onBlur={(event) => {
            const sourceId = event.target.value.trim();
            if (sourceId !== filters.sourceId) {
              onChange({ ...filters, sourceId });
            }
          }}
        />
      )}
      <UserSearchSelect
        label={labels.recipientUserId}
        value={filters.recipientUserId}
        onChange={(recipientUserId) => onChange({ ...filters, recipientUserId })}
      />
      <DateTimePicker
        label={labels.createdFrom}
        value={filterDate(filters.createdFrom)}
        maxDateTime={filterDate(filters.createdTo) ?? undefined}
        onChange={(date) =>
          onChange({ ...filters, createdFrom: filterIsoValue(date) })
        }
      />
      <DateTimePicker
        label={labels.createdTo}
        value={filterDate(filters.createdTo)}
        minDateTime={filterDate(filters.createdFrom) ?? undefined}
        onChange={(date) =>
          onChange({ ...filters, createdTo: filterIsoValue(date) })
        }
      />
      <Button
        type="button"
        variant="secondary"
        className="self-end"
        onClick={() => onChange(emptyFilters)}
        leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.clear}
      </Button>
    </div>
  );
}
