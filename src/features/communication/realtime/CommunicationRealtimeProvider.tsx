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
import { COMMUNICATION_SOCKET_EVENTS } from "./communication-events";
import {
  COMMUNICATION_REALTIME_DEBUG,
  COMMUNICATION_REALTIME_SOCKET_PATH,
  COMMUNICATION_REALTIME_URL,
  createCommunicationSocket,
  getCommunicationAccessToken,
  getCommunicationRealtimeNamespace,
  type CommunicationSocket,
} from "./communication-socket";

export interface CommunicationRealtimeContextValue {
  socket: CommunicationSocket | null;
  isConnected: boolean;
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

function disconnectSocket(socket: CommunicationSocket | null) {
  if (!socket) return;
  socket.removeAllListeners();
  socket.io.removeAllListeners();
  socket.disconnect();
}

function deferStateUpdate(update: () => void) {
  if (typeof window === "undefined") return;
  window.queueMicrotask(update);
}

function getTransportName(socket: CommunicationSocket | null): string | undefined {
  return socket?.io.engine?.transport?.name;
}

function logConnectError(error: Error, socket: CommunicationSocket | null) {
  if (!COMMUNICATION_REALTIME_DEBUG) return;

  console.info("[communication socket] connect_error", {
    message: error.message,
    name: error.name,
    socketId: socket?.id,
    connected: Boolean(socket?.connected),
    transport: getTransportName(socket),
    url: COMMUNICATION_REALTIME_URL,
    namespace: getCommunicationRealtimeNamespace(),
    path:
      COMMUNICATION_REALTIME_SOCKET_PATH ??
      "(socket.io default)",
  });
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
  const userId = user?.id;
  const socketRef = useRef<CommunicationSocket | null>(null);
  const joinedConversationIdsRef = useRef<Map<string, number>>(new Map());
  const [socket, setSocket] = useState<CommunicationSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [resyncVersion, setResyncVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) {
      return;
    }

    const token = getCommunicationAccessToken();

    if (!isAuthenticated || !userId || !token) {
      disconnectSocket(socketRef.current);
      socketRef.current = null;
      joinedConversationIdsRef.current.clear();
      deferStateUpdate(() => {
        setSocket(null);
        setIsConnected(false);
      });
      return;
    }

    if (socketRef.current) {
      const currentAuth = socketRef.current.auth as { token?: string };
      if (currentAuth.token === token) {
        if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
        return;
      }

      disconnectSocket(socketRef.current);
      socketRef.current = null;
      deferStateUpdate(() => {
        setSocket(null);
        setIsConnected(false);
      });
    }

    const nextSocket = createCommunicationSocket(token);
    if (!nextSocket) {
      return;
    }

    nextSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      joinedConversationIdsRef.current.forEach((_, conversationId) => {
        nextSocket.emit(COMMUNICATION_SOCKET_EVENTS.conversationJoin, {
          conversationId,
        });
      });
    });

    nextSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    nextSocket.on("connect_error", (error) => {
      setIsConnected(false);
      setConnectionError(error.message);
      logConnectError(error, nextSocket);
    });

    nextSocket.on("exception", (payload) => {
      setConnectionError(socketExceptionMessage(payload));
    });

    nextSocket.io.on("reconnect", () => {
      setIsConnected(true);
      setConnectionError(null);
      joinedConversationIdsRef.current.forEach((_, conversationId) => {
        nextSocket.emit(COMMUNICATION_SOCKET_EVENTS.conversationJoin, {
          conversationId,
        });
      });
      setResyncVersion((version) => version + 1);
    });

    socketRef.current = nextSocket;
    deferStateUpdate(() => setSocket(nextSocket));
    nextSocket.connect();

    return () => {
      disconnectSocket(nextSocket);
      if (socketRef.current === nextSocket) {
        socketRef.current = null;
        deferStateUpdate(() => {
          setSocket(null);
          setIsConnected(false);
        });
      }
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const synchronizeSocketToken = () => {
      const token = getCommunicationAccessToken();
      const activeSocket = socketRef.current;
      if (token && activeSocket) {
        const currentAuth = activeSocket.auth as { token?: string };
        if (currentAuth.token === token) {
          return;
        }
        activeSocket.auth = { ...currentAuth, token };
        activeSocket.disconnect();
        activeSocket.connect();
        return;
      }

      if (token) return;
      disconnectSocket(activeSocket);
      socketRef.current = null;
      joinedConversationIdsRef.current.clear();
      setSocket(null);
      setIsConnected(false);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && !event.key.includes("moazez_access_token")) {
        return;
      }

      synchronizeSocketToken();
    };

    const intervalId = window.setInterval(synchronizeSocketToken, 5000);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const emitRoomEvent = useCallback(
    (
      event:
        | typeof COMMUNICATION_SOCKET_EVENTS.conversationJoin
        | typeof COMMUNICATION_SOCKET_EVENTS.conversationLeave,
      conversationId: string,
    ) => {
      if (!conversationId) return;
      const refCounts = joinedConversationIdsRef.current;

      if (event === COMMUNICATION_SOCKET_EVENTS.conversationJoin) {
        const count = refCounts.get(conversationId) ?? 0;
        refCounts.set(conversationId, count + 1);
        // Only emit join if this is the first subscriber
        if (count === 0) {
          const activeSocket = socketRef.current;
          if (activeSocket?.connected) {
            activeSocket.emit(event, { conversationId });
          }
        }
      } else {
        const count = refCounts.get(conversationId) ?? 0;
        const nextCount = Math.max(0, count - 1);
        if (nextCount === 0) {
          refCounts.delete(conversationId);
          // Only emit leave if no one else needs this room
          const activeSocket = socketRef.current;
          if (activeSocket?.connected) {
            activeSocket.emit(event, { conversationId });
          }
        } else {
          refCounts.set(conversationId, nextCount);
        }
      }
    },
    [],
  );

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
    setConnectionError(null);
    const activeSocket = socketRef.current;
    if (!activeSocket?.connected) {
      activeSocket?.connect();
    }
  }, []);

  const value = useMemo<CommunicationRealtimeContextValue>(
    () => ({
      socket,
      isConnected,
      connectionError,
      resyncVersion,
      retryConnection,
      joinConversation: (conversationId) =>
        emitRoomEvent(
          COMMUNICATION_SOCKET_EVENTS.conversationJoin,
          conversationId,
        ),
      leaveConversation: (conversationId) =>
        emitRoomEvent(
          COMMUNICATION_SOCKET_EVENTS.conversationLeave,
          conversationId,
        ),
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
      socket,
      isConnected,
      connectionError,
      resyncVersion,
      retryConnection,
      emitRoomEvent,
      emitTypingEvent,
    ],
  );

  return (
    <CommunicationRealtimeContext.Provider value={value}>
      {children}
    </CommunicationRealtimeContext.Provider>
  );
}
