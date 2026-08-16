/**
 * Mock Socket.IO utility for testing real-time communication features.
 * Provides a controllable socket mock that tracks listeners, emitted events,
 * and supports simulating connection lifecycle events.
 *
 * Validates: Requirements 14.2
 */

type SocketHandler = (...args: unknown[]) => void;

export interface EmittedEvent {
  event: string;
  args: unknown[];
}

export interface MockSocket {
  /** Register a listener for a socket event */
  on: (event: string, handler: SocketHandler) => void;
  /** Remove a listener for a socket event */
  off: (event: string, handler: SocketHandler) => void;
  /** Emit an event to the server (records the emission for assertions) */
  emit: (event: string, ...args: unknown[]) => void;
  /** Whether the socket is currently connected */
  connected: boolean;
  /** Simulate an incoming server event, triggering all registered listeners */
  simulateEvent: (event: string, ...args: unknown[]) => void;
  /** Simulate a socket disconnection (sets connected=false, triggers 'disconnect' listeners) */
  simulateDisconnect: () => void;
  /** Simulate a socket reconnection (sets connected=true, triggers 'connect' listeners) */
  simulateReconnect: () => void;
  /** Get all emitted events for test assertions */
  getEmittedEvents: () => EmittedEvent[];
  /** Get emitted events filtered by event name */
  getEmittedByEvent: (event: string) => EmittedEvent[];
  /** Get all registered listeners for a specific event */
  getListeners: (event: string) => Set<SocketHandler>;
  /** Clear all recorded emitted events */
  clearEmitted: () => void;
  /** Reset the mock socket to its initial state */
  reset: () => void;
}

/**
 * Creates a mock Socket.IO instance for testing.
 *
 * Tracks registered listeners per event in a Map and records all emitted events
 * so tests can assert on both incoming and outgoing socket communication.
 */
export function createMockSocket(): MockSocket {
  const listeners = new Map<string, Set<SocketHandler>>();
  const emittedEvents: EmittedEvent[] = [];
  let connected = true;

  function getOrCreateListenerSet(event: string): Set<SocketHandler> {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  }

  const socket: MockSocket = {
    get connected() {
      return connected;
    },
    set connected(value: boolean) {
      connected = value;
    },

    on(event: string, handler: SocketHandler) {
      getOrCreateListenerSet(event).add(handler);
    },

    off(event: string, handler: SocketHandler) {
      const set = listeners.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          listeners.delete(event);
        }
      }
    },

    emit(event: string, ...args: unknown[]) {
      emittedEvents.push({ event, args });
    },

    simulateEvent(event: string, ...args: unknown[]) {
      const set = listeners.get(event);
      if (set) {
        for (const handler of set) {
          handler(...args);
        }
      }
    },

    simulateDisconnect() {
      connected = false;
      const set = listeners.get("disconnect");
      if (set) {
        for (const handler of set) {
          handler();
        }
      }
    },

    simulateReconnect() {
      connected = true;
      const set = listeners.get("connect");
      if (set) {
        for (const handler of set) {
          handler();
        }
      }
    },

    getEmittedEvents() {
      return [...emittedEvents];
    },

    getEmittedByEvent(event: string) {
      return emittedEvents.filter((e) => e.event === event);
    },

    getListeners(event: string) {
      return listeners.get(event) ?? new Set();
    },

    clearEmitted() {
      emittedEvents.length = 0;
    },

    reset() {
      listeners.clear();
      emittedEvents.length = 0;
      connected = true;
    },
  };

  return socket;
}
