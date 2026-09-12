"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import type { CommunicationConnectionState } from "./communication-connection-policy";
import {
  logRealtimeEvent,
  warnDuplicateRoomJoin,
} from "./communication-realtime-diagnostics";
import { COMMUNICATION_SOCKET_EVENTS } from "./communication-events";
import {
  createCommunicationSocket,
  getCommunicationAccessToken,
  type CommunicationSocket,
} from "./communication-socket";
import { CommunicationSocketSession } from "./communication-socket-session";

export interface CommunicationRealtimeContextValue {
  socket: CommunicationSocket | null;
  isConnected: boolean;
  connectionState: CommunicationConnectionState;
  connectionError: string | null;
  resyncVersion: number;
  retryConnection: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string, messageDraftId?: string) => void;
  stopTyping: (conversationId: string, messageDraftId?: string) => void;
}

export const CommunicationRealtimeContext =
  createContext<CommunicationRealtimeContextValue | null>(null);

function deferStateUpdate(updateState: () => void) {
  window.setTimeout(updateState, 0);
}

function socketExceptionMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Realtime room request failed.";
  }

  const exception = payload as { code?: unknown; message?: unknown };
  const nestedException =
    exception.message && typeof exception.message === "object"
      ? (exception.message as { code?: unknown; message?: unknown })
      : undefined;
  if (typeof exception.code === "string") return exception.code;
  if (typeof nestedException?.code === "string") return nestedException.code;
  if (typeof exception.message === "string") return exception.message;
  if (typeof nestedException?.message === "string") {
    return nestedException.message;
  }
  return "Realtime room request failed.";
}

export function CommunicationRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const socketRef = useRef<CommunicationSocket | null>(null);
  const sessionRef = useRef<CommunicationSocketSession | null>(null);
  const roomSubscriberCountsRef = useRef<Map<string, number>>(new Map());
  const serverRoomIdsRef = useRef<Set<string>>(new Set());
  const [socket, setSocket] = useState<CommunicationSocket | null>(null);
  const [connectionState, setConnectionState] =
    useState<CommunicationConnectionState>("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [resyncVersion, setResyncVersion] = useState(0);

  const emitConversationJoin = useCallback(
    (activeSocket: CommunicationSocket, conversationId: string) => {
      if (serverRoomIdsRef.current.has(conversationId)) {
        warnDuplicateRoomJoin(serverRoomIdsRef.current.size);
        return;
      }
      serverRoomIdsRef.current.add(conversationId);
      activeSocket.emit(COMMUNICATION_SOCKET_EVENTS.conversationJoin, {
        conversationId,
      });
      logRealtimeEvent("room_joined", {
        currentRoomCount: serverRoomIdsRef.current.size,
      });
    },
    [],
  );

  const restoreActiveRooms = useCallback(
    (activeSocket: CommunicationSocket) => {
      serverRoomIdsRef.current.clear();
      roomSubscriberCountsRef.current.forEach((_, conversationId) => {
        emitConversationJoin(activeSocket, conversationId);
      });
    },
    [emitConversationJoin],
  );

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;
    const roomSubscriberCounts = roomSubscriberCountsRef.current;
    const serverRoomIds = serverRoomIdsRef.current;
    const token = getCommunicationAccessToken();
    if (!isAuthenticated || !user?.id || !token) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      socketRef.current = null;
      roomSubscriberCounts.clear();
      serverRoomIds.clear();
      deferStateUpdate(() => {
        if (socketRef.current) return;
        setSocket(null);
        setConnectionError(null);
        setConnectionState("idle");
      });
      return;
    }

    const nextSocket = createCommunicationSocket(token);
    if (!nextSocket) return;
    socketRef.current = nextSocket;
    deferStateUpdate(() => {
      if (socketRef.current === nextSocket) setSocket(nextSocket);
    });

    const nextSession = new CommunicationSocketSession({
      socket: nextSocket,
      clearServerRooms: () => serverRoomIdsRef.current.clear(),
      detachSocket: () => {
        if (socketRef.current !== nextSocket) return;
        socketRef.current = null;
        setSocket(null);
        setConnectionError(null);
        setConnectionState("idle");
        roomSubscriberCountsRef.current.clear();
      },
      incrementResyncVersion: () =>
        setResyncVersion((version) => version + 1),
      restoreActiveRooms,
      updateError: setConnectionError,
      updateState: setConnectionState,
    });
    sessionRef.current = nextSession;

    const onException = (payload: unknown) => {
      setConnectionError(socketExceptionMessage(payload));
    };
    nextSocket.on("exception", onException);
    nextSession.start();

    return () => {
      nextSocket.off("exception", onException);
      nextSession.stop();
      if (sessionRef.current === nextSession) sessionRef.current = null;
      if (socketRef.current === nextSocket) socketRef.current = null;
      roomSubscriberCounts.clear();
      serverRoomIds.clear();
    };
  }, [isAuthenticated, isLoading, restoreActiveRooms, user?.id]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!conversationId) return;
      const subscriberCount =
        roomSubscriberCountsRef.current.get(conversationId) ?? 0;
      roomSubscriberCountsRef.current.set(conversationId, subscriberCount + 1);
      const activeSocket = socketRef.current;
      if (subscriberCount === 0 && activeSocket?.connected) {
        emitConversationJoin(activeSocket, conversationId);
      }
    },
    [emitConversationJoin],
  );

  const leaveConversation = useCallback((conversationId: string) => {
    const subscriberCount =
      roomSubscriberCountsRef.current.get(conversationId) ?? 0;
    if (subscriberCount > 1) {
      roomSubscriberCountsRef.current.set(conversationId, subscriberCount - 1);
      return;
    }

    roomSubscriberCountsRef.current.delete(conversationId);
    if (!serverRoomIdsRef.current.delete(conversationId)) return;
    const activeSocket = socketRef.current;
    if (!activeSocket?.connected) return;
    activeSocket.emit(COMMUNICATION_SOCKET_EVENTS.conversationLeave, {
      conversationId,
    });
    logRealtimeEvent("room_left", {
      currentRoomCount: serverRoomIdsRef.current.size,
    });
  }, []);

  const emitTypingEvent = useCallback(
    (
      event:
        | typeof COMMUNICATION_SOCKET_EVENTS.typingStart
        | typeof COMMUNICATION_SOCKET_EVENTS.typingStop,
      conversationId: string,
      messageDraftId?: string,
    ) => {
      const activeSocket = socketRef.current;
      if (!activeSocket?.connected || !conversationId) return;
      activeSocket.emit(event, {
        conversationId,
        ...(messageDraftId ? { messageDraftId } : {}),
      });
    },
    [],
  );

  const retryConnection = useCallback(() => {
    sessionRef.current?.retry();
  }, []);

  const value = useMemo<CommunicationRealtimeContextValue>(
    () => ({
      socket,
      isConnected: connectionState === "connected",
      connectionState,
      connectionError,
      resyncVersion,
      retryConnection,
      joinConversation,
      leaveConversation,
      startTyping: (conversationId, messageDraftId) =>
        emitTypingEvent(
          COMMUNICATION_SOCKET_EVENTS.typingStart,
          conversationId,
          messageDraftId,
        ),
      stopTyping: (conversationId, messageDraftId) =>
        emitTypingEvent(
          COMMUNICATION_SOCKET_EVENTS.typingStop,
          conversationId,
          messageDraftId,
        ),
    }),
    [
      connectionError,
      connectionState,
      emitTypingEvent,
      joinConversation,
      leaveConversation,
      resyncVersion,
      retryConnection,
      socket,
    ],
  );

  return (
    <CommunicationRealtimeContext.Provider value={value}>
      {children}
    </CommunicationRealtimeContext.Provider>
  );
}
