"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { getNotifications } from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

const PAGE_SIZE = 50;

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loadingText?: string;
  emptyText?: string;
  errorText?: string;
};

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function unwrapNotifications(response: unknown) {
  if (Array.isArray(response)) {
    return { items: response as CommunicationNotification[], total: response.length };
  }
  if (!isRecord(response)) return { items: [], total: 0 };

  const sources = [response, response.data, response.result, response.payload].filter(isRecord);
  for (const source of sources) {
    const items = Array.isArray(source.items)
      ? source.items
      : Array.isArray(source.notifications)
        ? source.notifications
        : undefined;
    if (!items) continue;
    const pagination = isRecord(source.pagination) ? source.pagination : undefined;
    return {
      items: items as CommunicationNotification[],
      total:
        numberValue(pagination?.total) ??
        numberValue(source.total) ??
        numberValue(source.count) ??
        items.length,
    };
  }
  return { items: [], total: 0 };
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatDate(value: unknown) {
  const raw = textValue(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function notificationOption(notification: CommunicationNotification): SelectOption | null {
  const id = textValue(notification.id);
  if (!id) return null;
  const title = textValue(notification.title) ?? textValue(notification.titleEn) ?? textValue(notification.titleAr);
  const body =
    textValue(notification.message) ??
    textValue(notification.body) ??
    textValue(notification.bodyEn) ??
    textValue(notification.bodyAr);
  const primary = title ?? body ?? textValue(notification.type) ?? "Notification";
  const preview = primary.length > 90 ? `${primary.slice(0, 87)}...` : primary;
  const context = [
    textValue(notification.type) === primary ? undefined : textValue(notification.type),
    formatDate(notification.createdAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    value: id,
    label: context ? `${preview} - ${context}` : preview,
    searchText: [title, body, notification.type, notification.createdAt]
      .filter(Boolean)
      .join(" "),
  };
}

export default function NotificationSearchSelect({
  emptyText = "No notifications loaded",
  errorText = "Unable to load notifications",
  label,
  loadingText = "Loading notifications...",
  onChange,
  placeholder = "Select a notification",
  searchPlaceholder = "Search loaded notifications...",
  value,
}: Props) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const loadingRef = useRef(false);

  const loadNextPage = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(undefined);
    const nextPage = page + 1;

    try {
      const response = await getNotifications({ page: nextPage, limit: PAGE_SIZE });
      const list = unwrapNotifications(response);
      const nextOptions = list.items
        .map(notificationOption)
        .filter((option): option is SelectOption => Boolean(option));
      setOptions((current) => {
        const byId = new Map(current.map((option) => [option.value, option]));
        nextOptions.forEach((option) => byId.set(option.value, option));
        return [...byId.values()];
      });
      setPage(nextPage);
      setHasMore(
        list.items.length > 0 && nextPage * PAGE_SIZE < list.total,
      );
    } catch {
      setError(errorText);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [errorText, hasMore, page]);

  const selectOptions = useMemo(() => {
    const next = [{ value: "", label: placeholder }, ...options];
    if (isLoading) next.push({ value: "__loading", label: loadingText, disabled: true });
    return next;
  }, [isLoading, loadingText, options, placeholder]);

  return (
    <Select
      label={label}
      value={value}
      options={selectOptions}
      searchable
      searchPlaceholder={searchPlaceholder}
      helperText={error}
      error={error}
      noOptionsText={emptyText}
      noResultsText={emptyText}
      onOpen={() => {
        if (page === 0) void loadNextPage();
      }}
      onEndReached={() => void loadNextPage()}
      onChange={(nextValue) => {
        if (nextValue !== "__loading") onChange(nextValue);
      }}
    />
  );
}
