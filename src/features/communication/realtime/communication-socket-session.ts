import { subscribeToAccessTokenChanges } from "@/lib/token-storage";
import {
  classifyConnectionFailure,
  reconnectDelayForAttempt,
  RECONNECTION_ATTEMPTS,
  RECONNECTION_COOLDOWN_MS,
  retryDelayFromError,
  type CommunicationConnectionState,
} from "./communication-connection-policy";
import {
  logRealtimeEvent,
  registerSocketOwner,
} from "./communication-realtime-diagnostics";
import {
  getCommunicationAccessToken,
  type CommunicationSocket,
} from "./communication-socket";

interface CommunicationSocketSessionOptions {
  socket: CommunicationSocket;
  clearServerRooms: () => void;
  detachSocket: () => void;
  incrementResyncVersion: () => void;
  restoreActiveRooms: (socket: CommunicationSocket) => void;
  updateError: (error: string | null) => void;
  updateState: (state: CommunicationConnectionState) => void;
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Realtime connection failed.";
}

function socketToken(socket: CommunicationSocket) {
  const auth = socket.auth as { token?: unknown };
  return typeof auth.token === "string" ? auth.token : null;
}

export class CommunicationSocketSession {
  private authBlockedToken: string | null = null;
  private cooldownTimer: number | null = null;
  private hasConnected = false;
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private releaseSocketOwner: () => void = () => undefined;
  private stopped = false;
  private unsubscribeAccessToken: () => void = () => undefined;

  constructor(private readonly options: CommunicationSocketSessionOptions) {}

  start() {
    const { socket } = this.options;
    this.releaseSocketOwner = registerSocketOwner();
    socket.on("connect", this.onConnect);
    socket.on("disconnect", this.onDisconnect);
    socket.on("connect_error", this.onConnectError);
    socket.io.on("reconnect_attempt", this.onReconnectAttempt);
    socket.io.on("reconnect_failed", this.onReconnectFailed);
    this.unsubscribeAccessToken = subscribeToAccessTokenChanges(this.syncToken);
    window.addEventListener("offline", this.goOffline);
    window.addEventListener("online", this.goOnline);

    this.updateState(navigator.onLine ? "connecting" : "offline");
    logRealtimeEvent("socket_created");
    if (navigator.onLine) socket.connect();
  }

  stop = () => {
    if (this.stopped) return;
    this.stopped = true;
    const { socket } = this.options;
    this.resetReconnectCycle();
    this.unsubscribeAccessToken();
    window.removeEventListener("offline", this.goOffline);
    window.removeEventListener("online", this.goOnline);
    socket.off("connect", this.onConnect);
    socket.off("disconnect", this.onDisconnect);
    socket.off("connect_error", this.onConnectError);
    socket.io.off("reconnect_attempt", this.onReconnectAttempt);
    socket.io.off("reconnect_failed", this.onReconnectFailed);
    socket.disconnect();
    this.options.clearServerRooms();
    this.releaseSocketOwner();
  };

  retry = () => {
    const { socket } = this.options;
    const token = getCommunicationAccessToken();
    if (socket.connected || !navigator.onLine || !token) return;
    if (this.authBlockedToken === token) return;

    this.resetReconnectCycle();
    this.options.updateError(null);
    socket.io.reconnection(true);
    this.updateState("connecting");
    socket.connect();
  };

  private clearCooldown() {
    if (this.cooldownTimer === null) return;
    window.clearTimeout(this.cooldownTimer);
    this.cooldownTimer = null;
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer === null) return;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private resetReconnectCycle() {
    this.clearCooldown();
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;
  }

  private updateState(state: CommunicationConnectionState) {
    this.options.updateState(state);
    logRealtimeEvent("state_changed", { state });
  }

  private onConnect = () => {
    const isRecovery = this.hasConnected;
    this.resetReconnectCycle();
    this.authBlockedToken = null;
    this.hasConnected = true;
    this.options.socket.io.reconnection(true);
    this.options.updateError(null);
    this.updateState("connected");
    this.options.restoreActiveRooms(this.options.socket);
    if (isRecovery) this.options.incrementResyncVersion();
    logRealtimeEvent("connected", { isRecovery });
  };

  private onDisconnect = (reason: string) => {
    this.options.clearServerRooms();
    const state = !navigator.onLine
      ? "offline"
      : this.authBlockedToken
        ? "auth-error"
        : "reconnecting";
    this.updateState(state);
    logRealtimeEvent("disconnected", { reason });
    if (reason === "io server disconnect" && navigator.onLine) {
      this.scheduleTemporaryReconnect();
    }
  };

  private onConnectError = (error: Error) => {
    const failure = classifyConnectionFailure(error);
    this.options.updateError(errorMessage(error));
    logRealtimeEvent("connect_failed", { failure });
    if (failure === "auth") {
      this.pauseForAuthentication();
      return;
    }
    if (failure === "rate-limit") {
      this.scheduleReconnect(
        retryDelayFromError(error) ?? RECONNECTION_COOLDOWN_MS,
      );
      return;
    }
    this.updateState("reconnecting");
    if (!this.options.socket.active) this.scheduleTemporaryReconnect();
  };

  private pauseForAuthentication() {
    const { socket } = this.options;
    this.authBlockedToken = socketToken(socket);
    socket.io.reconnection(false);
    socket.disconnect();
    this.updateState("auth-error");
  }

  private onReconnectAttempt = (attempt: number) => {
    this.updateState("reconnecting");
    logRealtimeEvent("reconnect_attempted", { attempt });
  };

  private onReconnectFailed = () => {
    this.scheduleReconnect(RECONNECTION_COOLDOWN_MS);
  };

  private scheduleReconnect(delayMs: number) {
    this.resetReconnectCycle();
    this.options.socket.io.reconnection(false);
    this.updateState("degraded");
    logRealtimeEvent("cooldown_started", { delayMs });
    this.cooldownTimer = window.setTimeout(this.resumeAfterCooldown, delayMs);
  }

  private scheduleTemporaryReconnect() {
    if (this.reconnectTimer !== null || this.cooldownTimer !== null) return;
    if (this.reconnectAttempt >= RECONNECTION_ATTEMPTS) {
      this.scheduleReconnect(RECONNECTION_COOLDOWN_MS);
      return;
    }

    const delayMs = reconnectDelayForAttempt(this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.options.socket.io.reconnection(false);
    this.updateState("reconnecting");
    logRealtimeEvent("reconnect_attempt_scheduled", {
      attempt: this.reconnectAttempt,
      delayMs,
    });
    this.reconnectTimer = window.setTimeout(this.runScheduledReconnect, delayMs);
  }

  private runScheduledReconnect = () => {
    this.reconnectTimer = null;
    if (this.stopped) return;
    const token = getCommunicationAccessToken();
    if (!navigator.onLine || !token || this.authBlockedToken === token) return;
    this.options.socket.io.reconnection(true);
    this.options.socket.connect();
  };

  private resumeAfterCooldown = () => {
    this.cooldownTimer = null;
    if (this.stopped) return;
    const token = getCommunicationAccessToken();
    if (!navigator.onLine || !token || this.authBlockedToken === token) return;
    this.options.socket.io.reconnection(true);
    this.updateState("connecting");
    this.options.socket.connect();
  };

  private syncToken = () => {
    if (this.stopped) return;
    const token = getCommunicationAccessToken();
    if (token === socketToken(this.options.socket)) return;
    this.resetReconnectCycle();
    if (!token) {
      this.stop();
      this.options.detachSocket();
      return;
    }

    this.authBlockedToken = null;
    this.options.socket.auth = { ...this.options.socket.auth, token };
    this.options.socket.io.reconnection(true);
    this.options.socket.disconnect();
    this.updateState("connecting");
    this.options.socket.connect();
  };

  private goOffline = () => {
    this.resetReconnectCycle();
    this.options.socket.io.reconnection(false);
    this.options.socket.disconnect();
    this.updateState("offline");
  };

  private goOnline = () => {
    const token = getCommunicationAccessToken();
    if (!token || this.authBlockedToken === token) return;
    if (this.options.socket.connected) return;
    this.options.socket.io.reconnection(true);
    this.updateState("connecting");
    this.options.socket.connect();
  };
}
