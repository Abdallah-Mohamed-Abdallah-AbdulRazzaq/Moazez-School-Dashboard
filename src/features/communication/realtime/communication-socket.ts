"use client";

import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/token-storage";
import { COMMUNICATION_SOCKET_EVENTS } from "./communication-events";

const REALTIME_TRANSPORTS = ["websocket", "polling"] as const;

// REALTIME_URL is the Socket.IO namespace URL.
// REALTIME_SOCKET_PATH is the Engine.IO transport path. Seeing /socket.io in
// the browser network tab is normal when the backend uses the default transport
// path. If the backend mounts Engine.IO under /api/v1/realtime/socket.io, set
// NEXT_PUBLIC_REALTIME_SOCKET_PATH=/api/v1/realtime/socket.io.
export const COMMUNICATION_REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ||
  "https://api.moazez.sa/api/v1/realtime";

export const COMMUNICATION_REALTIME_SOCKET_PATH =
  process.env.NEXT_PUBLIC_REALTIME_SOCKET_PATH || undefined;

export const COMMUNICATION_REALTIME_DEBUG =
  process.env.NEXT_PUBLIC_REALTIME_DEBUG === "true";

export function getCommunicationRealtimeNamespace(): string {
  try {
    const url = new URL(COMMUNICATION_REALTIME_URL);
    return url.pathname || "/";
  } catch {
    return "/api/v1/realtime";
  }
}

export interface CommunicationRealtimePayload {
  conversationId?: string;
  messageId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface CommunicationRoomPayload {
  conversationId: string;
}

export interface CommunicationTypingPayload extends CommunicationRoomPayload {
  messageDraftId?: string;
}

export interface CommunicationServerToClientEvents {
  connect: () => void;
  disconnect: (reason: Socket.DisconnectReason) => void;
  connect_error: (error: Error) => void;
  exception: (payload: CommunicationRealtimePayload) => void;
  reconnect: (attempt: number) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageCreated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageUpdated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageDeleted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageRead]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.reactionUpserted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.reactionDeleted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.attachmentLinked]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.attachmentDeleted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStarted]: (
    payload: CommunicationTypingPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStopped]: (
    payload: CommunicationTypingPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.announcementPublished]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.notificationCreated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.notificationRead]: (
    payload: CommunicationRealtimePayload,
  ) => void;
}

export interface CommunicationClientToServerEvents {
  [COMMUNICATION_SOCKET_EVENTS.conversationJoin]: (
    payload: CommunicationRoomPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.conversationLeave]: (
    payload: CommunicationRoomPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStart]: (
    payload: CommunicationTypingPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStop]: (
    payload: CommunicationTypingPayload,
  ) => void;
}

export type CommunicationSocket = Socket<
  CommunicationServerToClientEvents,
  CommunicationClientToServerEvents
>;

export function getCommunicationAccessToken(): string | null {
  return tokenStorage.getAccessToken();
}

export function createCommunicationSocket(
  token: string,
): CommunicationSocket | null {
  if (typeof window === "undefined" || !token) {
    return null;
  }

  if (COMMUNICATION_REALTIME_DEBUG) {
    console.info("[communication socket] creating socket", {
      url: COMMUNICATION_REALTIME_URL,
      namespace: getCommunicationRealtimeNamespace(),
      path: COMMUNICATION_REALTIME_SOCKET_PATH ?? "(socket.io default)",
      transports: [...REALTIME_TRANSPORTS],
      hasToken: Boolean(token),
    });
  }

  return io(COMMUNICATION_REALTIME_URL, {
    autoConnect: false,
    auth: {
      token,
    },
    transports: [...REALTIME_TRANSPORTS],
    reconnection: true,
    withCredentials: true,
    ...(COMMUNICATION_REALTIME_SOCKET_PATH
      ? { path: COMMUNICATION_REALTIME_SOCKET_PATH }
      : {}),
  });
}
