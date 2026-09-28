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

const CONVERSATIONS_PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 350;

type PageRequestFailureMode = "clear-list" | "preserve-list";

interface ConversationPageRequest {
  page: number;
  failureMode: PageRequestFailureMode;
}

interface ResolvedConversationPage {
  conversations: ConversationListItemModel[];
  page: number;
  total: number;
}

type ConversationRequestCache = Map<
  string,
  Promise<CommunicationList<Conversation>>
>;

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

function totalPagesFromTotal(total: number): number {
  return total === 0 ? 0 : Math.ceil(total / CONVERSATIONS_PAGE_SIZE);
}

function conversationPageParams(
  status: ConversationStatusFilter,
  type: ConversationTypeFilter,
  search: string,
  page: number,
): ListConversationsParams {
  return {
    ...(status !== "all" ? { status: status as ConversationStatus } : {}),
    ...(type !== "all" ? { type } : {}),
    ...(search ? { search } : {}),
    limit: CONVERSATIONS_PAGE_SIZE,
    page,
  };
}

async function fetchConversationList(
  params: ListConversationsParams,
  requestCache: ConversationRequestCache,
): Promise<CommunicationList<Conversation>> {
  const requestKey = JSON.stringify(params);
  let request = requestCache.get(requestKey);

  if (!request) {
    request = getConversations(params).then((response) =>
      unwrapList<Conversation>(response),
    );
    requestCache.set(requestKey, request);
  }

  try {
    return await request;
  } finally {
    if (requestCache.get(requestKey) === request) {
      requestCache.delete(requestKey);
    }
  }
}

async function resolveConversationPage(
  initialPage: number,
  status: ConversationStatusFilter,
  type: ConversationTypeFilter,
  search: string,
  requestCache: ConversationRequestCache,
): Promise<ResolvedConversationPage> {
  let requestedPage = initialPage;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const list = await fetchConversationList(
      conversationPageParams(status, type, search, requestedPage),
      requestCache,
    );
    const conversations = list.items.map(toConversationListItem);
    const total = list.total ?? conversations.length;
    const totalPages = totalPagesFromTotal(total);

    if (totalPages > 0 && requestedPage > totalPages && attempt === 0) {
      requestedPage = totalPages;
      continue;
    }

    return {
      conversations,
      page: totalPages === 0 ? 1 : requestedPage,
      total,
    };
  }

  throw new Error("Unable to resolve a valid conversations page.");
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
  const failedPageRequestRef = useRef<ConversationPageRequest | null>(null);
  const pageNavigationInFlightRef = useRef(false);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);
  const [filters, setFilters] = useState<ConversationFiltersState>(DEFAULT_FILTERS);
  const [conversations, setConversations] = useState<ConversationListItemModel[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(
    filters.search.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const requestPage = useCallback(
    async (request: ConversationPageRequest) => {
      const requestId = ++latestRequestIdRef.current;
      const isInitialLoad = !hasCompletedInitialLoadRef.current;

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setLoadError(null);
      failedPageRequestRef.current = null;

      try {
        const resolvedPage = await resolveConversationPage(
          request.page,
          filters.status,
          filters.type,
          debouncedSearch,
          inFlightRequestsRef.current,
        );

        if (!mountedRef.current || requestId !== latestRequestIdRef.current) {
          return;
        }
        setConversations(resolvedPage.conversations);
        setTotal(resolvedPage.total);
        setPage(resolvedPage.page);
        failedPageRequestRef.current = null;
      } catch (nextError) {
        if (!mountedRef.current || requestId !== latestRequestIdRef.current) {
          return;
        }
        setLoadError(errorMessageFromUnknown(nextError));
        failedPageRequestRef.current = request;

        if (request.failureMode === "clear-list") {
          setConversations([]);
          setTotal(0);
          setPage(1);
        }
      } finally {
        if (mountedRef.current && requestId === latestRequestIdRef.current) {
          hasCompletedInitialLoadRef.current = true;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [debouncedSearch, filters.status, filters.type],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void requestPage({ page: 1, failureMode: "clear-list" });
  }, [requestPage]);

  const refresh = useCallback(
    () => requestPage({ page, failureMode: "preserve-list" }),
    [page, requestPage],
  );

  const retry = useCallback(() => {
    const failedRequest = failedPageRequestRef.current;
    return failedRequest ? requestPage(failedRequest) : refresh();
  }, [refresh, requestPage]);

  const totalPages = useMemo(() => totalPagesFromTotal(total), [total]);

  const goToPage = useCallback(
    async (nextPage: number) => {
      if (
        pageNavigationInFlightRef.current ||
        nextPage === page ||
        nextPage < 1 ||
        nextPage > totalPages
      ) {
        return;
      }

      pageNavigationInFlightRef.current = true;
      try {
        await requestPage({ page: nextPage, failureMode: "preserve-list" });
      } finally {
        pageNavigationInFlightRef.current = false;
      }
    },
    [page, requestPage, totalPages],
  );

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

        return found ? next : current;
      });
    };

    const handleUpdated = (payload: unknown) => {
      const { conversationId, message } = lastMessageFromPayload(payload);
      if (!conversationId || !message?.id) {
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
  }, [socket]);

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

  const clearError = useCallback(() => setLoadError(null), []);

  return {
    conversations,
    total,
    page,
    pageSize: CONVERSATIONS_PAGE_SIZE,
    totalPages,
    filters,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error: loadError,
    clearError,
    retry,
    hasFilters,
    refresh,
    goToPage,
    markAsRead,
    create,
    update,
    close,
    reopen,
    archive,
  };
}
