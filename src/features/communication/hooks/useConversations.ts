"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  archiveConversation,
  closeConversation,
  createConversation,
  getConversations,
  reopenConversation,
  updateConversation,
} from "@/features/communication/api/communication.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  Conversation,
  ListConversationsParams,
  ConversationStatus,
  ConversationType,
  CreateConversationPayload,
  UpdateConversationPayload,
} from "@/features/communication/types/conversation.types";
import { useCommunicationSocket } from "./useCommunicationSocket";
import { useAuth } from "@/hooks/use-auth";

export type ConversationStatusFilter = "all" | "active" | "closed" | "archived";
export type ConversationTypeFilter = "all" | ConversationType;

export interface ConversationLastMessage {
  id?: string;
  body?: string;
  type?: string;
  status?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  senderName?: string;
}

export interface ConversationListItemModel extends Conversation {
  lastMessage?: ConversationLastMessage | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
}

export interface ConversationFiltersState {
  search: string;
  status: ConversationStatusFilter;
  type: ConversationTypeFilter;
}

export interface ConversationFormValues {
  title?: string;
  type?: string;
  description?: string;
  avatarFileId?: string;
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  isReadOnly?: boolean;
  isPinned?: boolean;
}

const DEFAULT_FILTERS: ConversationFiltersState = {
  search: "",
  status: "all",
  type: "all",
};

const CONVERSATIONS_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringFromUnknown(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;

  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );

  return (item ?? response) as T;
}

function unwrapList<T>(response: unknown): CommunicationList<T> {
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }

  if (!isRecord(response)) {
    return { items: [], total: 0 };
  }

  const sources = [
    response,
    response.data,
    response.result,
    response.payload,
  ].filter(isRecord);
  const itemSource = sources.find((source) => Array.isArray(source.items));

  if (itemSource) {
    const items = itemSource.items as T[];
    return {
      ...itemSource,
      items,
      total:
        numberFromUnknown(itemSource.total) ??
        numberFromUnknown(itemSource.count) ??
        items.length,
      page: numberFromUnknown(itemSource.page),
      limit: numberFromUnknown(itemSource.limit),
      totalPages: numberFromUnknown(itemSource.totalPages),
    };
  }

  const arraySource = [
    response.data,
    response.result,
    response.payload,
  ].find(Array.isArray);

  if (arraySource) {
    const items = arraySource as T[];
    return { items, total: items.length };
  }

  return { items: [], total: 0 };
}

function toConversationListItem(
  conversation: Conversation,
): ConversationListItemModel {
  const record = conversation as CommunicationRecord;
  const lastMessageRecord = [
    record.lastMessage,
    record.latestMessage,
    record.message,
  ].find(isRecord);

  const sender = isRecord(lastMessageRecord?.sender)
    ? lastMessageRecord.sender
    : undefined;

  return {
    ...conversation,
    unreadCount: numberFromUnknown(record.unreadCount),
    lastMessage: lastMessageRecord
      ? {
          id:
            stringFromUnknown(lastMessageRecord.id) ??
            stringFromUnknown(lastMessageRecord.messageId),
          body:
            stringFromUnknown(lastMessageRecord.body) ??
            stringFromUnknown(lastMessageRecord.content) ??
            stringFromUnknown(lastMessageRecord.text),
          type: stringFromUnknown(lastMessageRecord.type),
          status: stringFromUnknown(lastMessageRecord.status),
          sentAt: stringFromUnknown(lastMessageRecord.sentAt),
          createdAt: stringFromUnknown(lastMessageRecord.createdAt),
          updatedAt: stringFromUnknown(lastMessageRecord.updatedAt),
          senderName:
            stringFromUnknown(lastMessageRecord.senderName) ??
            stringFromUnknown(sender?.name) ??
            stringFromUnknown(sender?.nameEn) ??
            stringFromUnknown(sender?.nameAr),
        }
      : null,
    isPinned: Boolean(record.isPinned ?? record.pinned),
    pinnedAt: stringFromUnknown(record.pinnedAt) ?? null,
  };
}

function sortConversations(
  conversations: ConversationListItemModel[],
): ConversationListItemModel[] {
  return [...conversations].sort((left, right) => {
    if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;

    const leftDate =
      left.pinnedAt ??
      left.lastMessage?.createdAt ??
      left.lastMessage?.sentAt ??
      left.lastMessageAt ??
      left.updatedAt ??
      left.createdAt ??
      "";
    const rightDate =
      right.pinnedAt ??
      right.lastMessage?.createdAt ??
      right.lastMessage?.sentAt ??
      right.lastMessageAt ??
      right.updatedAt ??
      right.createdAt ??
      "";

    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function dedupeConversations(
  conversations: ConversationListItemModel[],
): ConversationListItemModel[] {
  const seen = new Set<string>();
  const output: ConversationListItemModel[] = [];

  for (const conversation of conversations) {
    const id = stringFromUnknown(conversation.id);
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    output.push(conversation);
  }

  return output;
}

function lastMessageTimestamp(
  message: ConversationLastMessage | null | undefined,
  fallback?: string | null,
): number | null {
  const value =
    message?.createdAt ?? message?.sentAt ?? message?.updatedAt ?? fallback;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function mergeSameLastMessage(
  apiMessage: ConversationLastMessage,
  localMessage: ConversationLastMessage,
): ConversationLastMessage {
  return {
    ...localMessage,
    ...apiMessage,
    body: apiMessage.body ?? localMessage.body,
    type: apiMessage.type ?? localMessage.type,
    status: apiMessage.status ?? localMessage.status,
    sentAt: apiMessage.sentAt ?? localMessage.sentAt,
    createdAt: apiMessage.createdAt ?? localMessage.createdAt,
    updatedAt: apiMessage.updatedAt ?? localMessage.updatedAt,
    senderName: apiMessage.senderName ?? localMessage.senderName,
  };
}

function newerLastMessage(
  apiMessage: ConversationLastMessage | null | undefined,
  localMessage: ConversationLastMessage | null | undefined,
  apiFallback?: string | null,
  localFallback?: string | null,
): ConversationLastMessage | null {
  if (!apiMessage) return localMessage ?? null;
  if (!localMessage) return apiMessage;
  if (apiMessage.id && apiMessage.id === localMessage.id) {
    return mergeSameLastMessage(apiMessage, localMessage);
  }

  const apiTimestamp = lastMessageTimestamp(apiMessage, apiFallback);
  const localTimestamp = lastMessageTimestamp(localMessage, localFallback);
  if (apiTimestamp === null) return localMessage;
  if (localTimestamp === null) return apiMessage;
  return apiTimestamp >= localTimestamp ? apiMessage : localMessage;
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load conversations.";
}

function messageFromPayload(payload: unknown): CommunicationRecord | null {
  if (!isRecord(payload)) return null;
  const nested = [
    payload.message,
    payload.data,
    payload.payload,
    payload.lastMessage,
    payload.latestMessage,
  ].find(isRecord);
  return (nested ?? payload) as CommunicationRecord;
}

function lastMessageFromPayload(
  payload: unknown,
): { conversationId?: string; senderUserId?: string; message?: ConversationLastMessage } {
  const message = messageFromPayload(payload);
  if (!message) return {};

  const sender = isRecord(message.sender) ? message.sender : undefined;

  return {
    conversationId:
      stringFromUnknown(message.conversationId) ??
      stringFromUnknown(message.conversation_id) ??
      (isRecord(payload) ? stringFromUnknown(payload.conversationId) : undefined) ??
      (isRecord(payload) ? stringFromUnknown(payload.conversation_id) : undefined),
    senderUserId:
      stringFromUnknown(message.senderUserId) ??
      stringFromUnknown(message.senderId) ??
      stringFromUnknown(message.userId) ??
      stringFromUnknown(sender?.userId) ??
      stringFromUnknown(sender?.id),
    message: {
      id:
        stringFromUnknown(message.id) ??
        stringFromUnknown(message.messageId) ??
        (isRecord(payload) ? stringFromUnknown(payload.messageId) : undefined),
      body:
        stringFromUnknown(message.body) ??
        stringFromUnknown(message.content) ??
        stringFromUnknown(message.text),
      type: stringFromUnknown(message.type),
      status: stringFromUnknown(message.status),
      sentAt: stringFromUnknown(message.sentAt),
      createdAt:
        stringFromUnknown(message.createdAt) ??
        stringFromUnknown(message.updatedAt) ??
        new Date().toISOString(),
      updatedAt: stringFromUnknown(message.updatedAt),
      senderName:
        stringFromUnknown(message.senderName) ??
        stringFromUnknown(sender?.name) ??
        stringFromUnknown(sender?.nameEn) ??
        stringFromUnknown(sender?.nameAr),
    },
  };
}

function payloadFromValues(
  values: ConversationFormValues,
): CreateConversationPayload {
  const title = values.title?.trim();
  const type = (values.type || "group") as ConversationType;
  const metadata = createCommunicationMetadata("conversation_create", {
    createdFrom: "communication_conversations_page",
    creationFlow: type === "classroom" ? "classroom_context" : "manual",
  });

  return {
    type,
    ...(title ? { title } : {}),
    ...(values.description?.trim()
      ? { description: values.description.trim() }
      : {}),
    ...(values.avatarFileId?.trim()
      ? { avatarFileId: values.avatarFileId.trim() }
      : {}),
    ...(values.academicYearId?.trim()
      ? { academicYearId: values.academicYearId.trim() }
      : {}),
    ...(values.termId?.trim() ? { termId: values.termId.trim() } : {}),
    ...(values.stageId?.trim() ? { stageId: values.stageId.trim() } : {}),
    ...(values.gradeId?.trim() ? { gradeId: values.gradeId.trim() } : {}),
    ...(values.sectionId?.trim() ? { sectionId: values.sectionId.trim() } : {}),
    ...(values.classroomId?.trim()
      ? { classroomId: values.classroomId.trim() }
      : {}),
    ...(values.subjectId?.trim() ? { subjectId: values.subjectId.trim() } : {}),
    isReadOnly: Boolean(values.isReadOnly),
    isPinned: Boolean(values.isPinned),
    ...(metadata ? { metadata } : {}),
  };
}

function updatePayloadFromValues(
  values: ConversationFormValues,
): UpdateConversationPayload {
  const metadata = createCommunicationMetadata("conversation_update", {
    updatedFrom: "communication_conversations_page",
  });

  return {
    ...(values.title?.trim() ? { title: values.title.trim() } : {}),
    ...(values.description?.trim()
      ? { description: values.description.trim() }
      : {}),
    ...(values.avatarFileId?.trim()
      ? { avatarFileId: values.avatarFileId.trim() }
      : {}),
    isReadOnly: Boolean(values.isReadOnly),
    isPinned: Boolean(values.isPinned),
    ...(metadata ? { metadata } : {}),
  };
}

export function useConversations() {
  const { socket, resyncVersion } = useCommunicationSocket();
  const { user } = useAuth();
  const mountedRef = useRef(false);
  const hasCompletedInitialLoadRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const inFlightRequestsRef = useRef(
    new Map<string, Promise<CommunicationList<Conversation>>>(),
  );
  const lastHandledResyncVersionRef = useRef(resyncVersion);
  const userIdRef = useRef(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState<ConversationFiltersState>(DEFAULT_FILTERS);
  const [conversations, setConversations] = useState<ConversationListItemModel[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(
    filters.search.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const refresh = useCallback(async (pageToFetch: number = 1) => {
    const requestParams: ListConversationsParams = {
      ...(filters.status !== "all"
        ? { status: filters.status as ConversationStatus }
        : {}),
      ...(filters.type !== "all" ? { type: filters.type } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: CONVERSATIONS_PAGE_SIZE,
      page: pageToFetch,
    };
    const requestKey = JSON.stringify(requestParams);
    const requestId = ++latestRequestIdRef.current;
    const isFirstPage = pageToFetch === 1;
    const isInitialLoad = isFirstPage && !hasCompletedInitialLoadRef.current;

    if (isFirstPage) {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPage(1);
      setHasMore(true);
    } else {
      setIsRefreshing(true);
    }
    setLoadError(null);

    try {
      let conversationListRequest = inFlightRequestsRef.current.get(requestKey);
      if (!conversationListRequest) {
        conversationListRequest = getConversations(requestParams).then((response) =>
          unwrapList<Conversation>(response),
        );
        inFlightRequestsRef.current.set(requestKey, conversationListRequest);
      }
      const list = await conversationListRequest;

      const normalized = sortConversations(
        dedupeConversations(
          list.items.map((conversation) => toConversationListItem(conversation)),
        ),
      );

      if (!mountedRef.current || requestId !== latestRequestIdRef.current) return;
      // Merge with existing data to preserve lastMessage from previous enrichment/realtime
      setConversations((current) => {
        const existingMap = new Map(current.map((c) => [c.id, c]));
        const merged = normalized.map((conversation) => {
          const existing = existingMap.get(conversation.id);
          if (!existing) return conversation;
          return {
            ...conversation,
            lastMessage: newerLastMessage(
              conversation.lastMessage,
              existing.lastMessage,
              conversation.lastMessageAt,
              existing.lastMessageAt,
            ),
            // Prefer the API's unreadCount (source of truth) unless it's undefined/null,
            // in which case fall back to the existing local value
            unreadCount: conversation.unreadCount ?? existing.unreadCount,
          };
        });

        const baseList = pageToFetch === 1 ? merged : [...merged, ...current];
        return sortConversations(dedupeConversations(baseList));
      });
      const totalItems = list.total ?? normalized.length;
      setTotal(totalItems);

      const fetchedCount = list.items.length;
      setHasMore(
        fetchedCount > 0 &&
          pageToFetch * CONVERSATIONS_PAGE_SIZE < totalItems,
      );

    } catch (nextError) {
      if (!mountedRef.current || requestId !== latestRequestIdRef.current) return;
      setLoadError(errorMessageFromUnknown(nextError));
      if (isInitialLoad) {
        setConversations([]);
        setTotal(0);
      }
      if (isInitialLoad || !isFirstPage) setHasMore(false);
    } finally {
      if (inFlightRequestsRef.current.get(requestKey)) {
        inFlightRequestsRef.current.delete(requestKey);
      }
      if (mountedRef.current && requestId === latestRequestIdRef.current) {
        if (isFirstPage) hasCompletedInitialLoadRef.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [debouncedSearch, filters.status, filters.type]);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      void refresh();
    }, 500);
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (
      resyncVersion === 0 ||
      resyncVersion <= lastHandledResyncVersionRef.current
    ) return;

    lastHandledResyncVersionRef.current = resyncVersion;
    void refresh();
  }, [refresh, resyncVersion]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleCreated = (payload: unknown) => {
      const { conversationId, senderUserId, message } = lastMessageFromPayload(payload);
      if (!conversationId || !message) {
        debouncedRefresh();
        return;
      }

      const isOwnMessage = Boolean(userIdRef.current && senderUserId === userIdRef.current);

      setConversations((current) => {
        let found = false;
        const next = current.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          found = true;
          const isDuplicateMessage =
            Boolean(message.id) && conversation.lastMessage?.id === message.id;
          return {
            ...conversation,
            lastMessage: message,
            lastMessageAt:
              message.createdAt ?? message.sentAt ?? conversation.lastMessageAt,
            unreadCount: isDuplicateMessage || isOwnMessage
              ? conversation.unreadCount
              : (conversation.unreadCount ?? 0) + 1,
            updatedAt:
              message.createdAt ?? message.sentAt ?? conversation.updatedAt,
          };
        });

        if (!found) {
          debouncedRefresh();
          return current;
        }

        return sortConversations(next);
      });
    };

    const handleUpdated = (payload: unknown) => {
      const { conversationId, message } = lastMessageFromPayload(payload);
      if (!conversationId || !message?.id) {
        debouncedRefresh();
        return;
      }

      setConversations((current) =>
        current.map((conversation) => {
          if (
            conversation.id !== conversationId ||
            conversation.lastMessage?.id !== message.id
          ) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: {
              ...conversation.lastMessage,
              ...message,
            },
          };
        }),
      );
    };

    const handleDeleted = (payload: unknown) => {
      const { conversationId, message } = lastMessageFromPayload(payload);
      if (!conversationId || !message?.id) {
        debouncedRefresh();
        return;
      }

      setConversations((current) =>
        current.map((conversation) => {
          if (
            conversation.id !== conversationId ||
            conversation.lastMessage?.id !== message.id
          ) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: {
              ...conversation.lastMessage,
              id: message.id,
              body: "",
              status: "deleted",
              updatedAt: message.updatedAt ?? new Date().toISOString(),
            },
          };
        }),
      );
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleCreated);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageUpdated, handleUpdated);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageDeleted, handleDeleted);

    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleCreated);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageUpdated, handleUpdated);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageDeleted, handleDeleted);
    };
  }, [debouncedRefresh, socket]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsMutating(true);

      try {
        const response = await operation();
        await refresh();
        return response;
      } catch (nextError) {
        throw nextError;
      } finally {
        if (mountedRef.current) {
          setIsMutating(false);
        }
      }
    },
    [refresh],
  );

  const create = useCallback(
    async (values: ConversationFormValues) => {
      const response = await mutate(() => createConversation(payloadFromValues(values)));
      return unwrapItem<Conversation>(response);
    },
    [mutate],
  );

  const update = useCallback(
    async (conversationId: string, values: ConversationFormValues) => {
      const response = await mutate(() =>
        updateConversation(conversationId, updatePayloadFromValues(values)),
      );
      return unwrapItem<Conversation>(response);
    },
    [mutate],
  );

  const close = useCallback(
    (conversationId: string) =>
      mutate(() => closeConversation(conversationId)),
    [mutate],
  );

  const reopen = useCallback(
    (conversationId: string) =>
      mutate(() => reopenConversation(conversationId)),
    [mutate],
  );

  const archive = useCallback(
    (conversationId: string) =>
      mutate(() => archiveConversation(conversationId)),
    [mutate],
  );

  const hasFilters = useMemo(
    () =>
      filters.search.trim() !== "" ||
      filters.status !== "all" ||
      filters.type !== "all",
    [filters.search, filters.status, filters.type],
  );

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  }, []);

  const loadMore = useCallback(() => {
    if (isLoading || isRefreshing || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    void refresh(nextPage);
  }, [isLoading, isRefreshing, hasMore, page, refresh]);

  const clearError = useCallback(() => setLoadError(null), []);

  return {
    conversations,
    total,
    filters,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error: loadError,
    clearError,
    hasFilters,
    refresh,
    markAsRead,
    create,
    update,
    close,
    reopen,
    archive,
    loadMore,
    hasMore,
  };
}
