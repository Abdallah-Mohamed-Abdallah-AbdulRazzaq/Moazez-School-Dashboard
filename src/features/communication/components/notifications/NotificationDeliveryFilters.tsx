"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import NotificationSearchSelect from "@/features/communication/components/selectors/NotificationSearchSelect";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import type { NotificationDeliveryFiltersState } from "@/features/communication/hooks/useNotificationDeliveries";
import {
  filterDate,
  filterIsoValue,
} from "@/features/communication/utils/notification-filter-dates";

type Labels = {
  notification: string;
  recipient: string;
  channel: string;
  status: string;
  provider: string;
  createdFrom: string;
  createdTo: string;
  all: string;
  clear: string;
  exactProvider: string;
  notificationSearch: string;
  notificationLoadError: string;
  noNotifications: string;
  loadingNotifications: string;
};

type Props = {
  filters: NotificationDeliveryFiltersState;
  labels: Labels;
  onChange: (filters: NotificationDeliveryFiltersState) => void;
};

const channels = ["in_app", "email", "sms", "push"] as const;
const statuses = ["pending", "sent", "delivered", "failed", "skipped"] as const;

export const EMPTY_NOTIFICATION_DELIVERY_FILTERS: NotificationDeliveryFiltersState = {
  notificationId: "",
  recipientUserId: "",
  channel: "",
  status: "",
  provider: "",
  createdFrom: "",
  createdTo: "",
};

export default function NotificationDeliveryFilters({ filters, labels, onChange }: Props) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <NotificationSearchSelect
        label={labels.notification}
        value={filters.notificationId}
        placeholder={labels.all}
        searchPlaceholder={labels.notificationSearch}
        loadingText={labels.loadingNotifications}
        emptyText={labels.noNotifications}
        errorText={labels.notificationLoadError}
        onChange={(notificationId) => onChange({ ...filters, notificationId })}
      />
      <UserSearchSelect
        label={labels.recipient}
        value={filters.recipientUserId}
        placeholder={labels.all}
        onChange={(recipientUserId) => onChange({ ...filters, recipientUserId })}
      />
      <Select
        label={labels.channel}
        value={filters.channel}
        options={[
          { value: "", label: labels.all },
          ...channels.map((channel) => ({ value: channel, label: channel })),
        ]}
        onChange={(channel) => onChange({ ...filters, channel })}
      />
      <Select
        label={labels.status}
        value={filters.status}
        options={[
          { value: "", label: labels.all },
          ...statuses.map((status) => ({ value: status, label: status })),
        ]}
        onChange={(status) =>
          onChange({
            ...filters,
            status: status as NotificationDeliveryFiltersState["status"],
          })
        }
      />
      <Input
        label={labels.provider}
        helperText={labels.exactProvider}
        value={filters.provider}
        onChange={(event) => onChange({ ...filters, provider: event.target.value })}
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
        leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
        onClick={() => onChange(EMPTY_NOTIFICATION_DELIVERY_FILTERS)}
      >
        {labels.clear}
      </Button>
    </div>
  );
}
