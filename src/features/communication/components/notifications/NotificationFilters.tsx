"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import Select from "@/components/ui/input/Select";
import AnnouncementSearchSelect from "@/features/communication/components/selectors/AnnouncementSearchSelect";
import ConversationSearchSelect from "@/features/communication/components/selectors/ConversationSearchSelect";
import MessageSearchSelect from "@/features/communication/components/selectors/MessageSearchSelect";
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
  "attendance_early_leave",
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
const sourceTypes = ["announcement", "conversation", "message"] as const;

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

function sourceKind(sourceModule?: string, sourceType?: string) {
  const value = `${sourceModule ?? ""} ${sourceType ?? ""}`.toLowerCase();
  if (value.includes("announcement")) return "announcement";
  if (value.includes("conversation") || value.includes("chat")) return "conversation";
  if (value.includes("message")) return "message";
  return "";
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
          ...sourceTypes.map((sourceType) => ({
            value: sourceType,
            label: sourceType,
          })),
        ]}
      />
      {sourceKind(filters.sourceModule, filters.sourceType) === "announcement" ? (
        <AnnouncementSearchSelect
          label={labels.sourceId}
          value={filters.sourceId}
          onChange={(sourceId) => onChange({ ...filters, sourceId })}
        />
      ) : sourceKind(filters.sourceModule, filters.sourceType) === "conversation" ? (
        <ConversationSearchSelect
          label={labels.sourceId}
          value={filters.sourceId}
          onChange={(sourceId) => onChange({ ...filters, sourceId })}
        />
      ) : sourceKind(filters.sourceModule, filters.sourceType) === "message" ? (
        <MessageSearchSelect
          label={labels.sourceId}
          value={filters.sourceId}
          helperText={labels.selectSourceTypeFirst}
          onChange={(sourceId) => onChange({ ...filters, sourceId })}
        />
      ) : (
        <ConversationSearchSelect
          label={labels.sourceId}
          value=""
          disabled
          helperText={labels.selectSourceTypeFirst}
          onChange={() => undefined}
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
