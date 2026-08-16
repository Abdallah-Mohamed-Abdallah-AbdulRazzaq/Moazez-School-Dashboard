/**
 * Render helpers for communication feature tests.
 * Provides a custom render function that wraps components with
 * mocked auth, locale, and communication socket contexts.
 *
 * Validates: Requirements 14.1
 */

import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import type { ReactElement } from "react";
import type { MeResponse } from "@/types/user";
import type { CommunicationRealtimeContextValue } from "@/features/communication/realtime/CommunicationRealtimeProvider";
import type { MockSocket } from "./mock-socket";
import { createMockSocket } from "./mock-socket";

// ─── Default Test User ───────────────────────────────────────────────────────

/**
 * Creates a default test user matching the MeResponse interface.
 * Override individual fields by passing a partial user object.
 */
export function createTestUser(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    id: "user-test-001",
    email: "test@school.edu",
    username: "testuser",
    contactEmail: null,
    firstName: "Test",
    lastName: "User",
    userType: "SCHOOL_USER",
    status: "ACTIVE",
    mustChangePassword: false,
    activeMembership: {
      membershipId: "membership-001",
      organizationId: "org-001",
      schoolId: "school-001",
      roleId: "role-001",
      roleKey: "teacher",
      permissions: ["communication:read", "communication:write"],
    },
    ...overrides,
  };
}

// ─── Render Options ──────────────────────────────────────────────────────────

// ─── Module Mocks ────────────────────────────────────────────────────────────

/**
 * Sets up vi.mock calls for useAuth, useLocale, and useCommunicationSocket.
 * Call this at the top level of your test file (outside describe/it blocks).
 *
 * Returns getter functions that allow tests to configure return values
 * before each render.
 */
export function setupCommunicationMocks() {
  let currentUser: MeResponse | null = createTestUser();
  let currentLocale: "en" | "ar" = "en";
  let currentSocket: MockSocket = createMockSocket();

  // Mock useAuth
  vi.mock("@/hooks/use-auth", () => ({
    useAuth: () => ({
      user: currentUser,
      isAuthenticated: currentUser !== null,
      isLoading: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshCurrentUser: vi.fn(),
      changePassword: vi.fn(),
    }),
  }));

  // Mock next-intl useLocale
  vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => currentLocale,
  }));

  // Mock useCommunicationSocket
  vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
    useCommunicationSocket: (): CommunicationRealtimeContextValue => ({
      socket: currentSocket as unknown as CommunicationRealtimeContextValue["socket"],
      isConnected: currentSocket.connected,
      connectionError: null,
      resyncVersion: 0,
      retryConnection: vi.fn(),
      joinConversation: vi.fn((conversationId: string) => {
        currentSocket.emit("conversation:join", { conversationId });
      }),
      leaveConversation: vi.fn((conversationId: string) => {
        currentSocket.emit("conversation:leave", { conversationId });
      }),
      startTyping: vi.fn((conversationId: string, messageDraftId?: string) => {
        currentSocket.emit("typing:start", { conversationId, messageDraftId });
      }),
      stopTyping: vi.fn((conversationId: string, messageDraftId?: string) => {
        currentSocket.emit("typing:stop", { conversationId, messageDraftId });
      }),
    }),
  }));

  return {
    setUser(user: MeResponse | null) {
      currentUser = user;
    },
    setLocale(locale: "en" | "ar") {
      currentLocale = locale;
    },
    setSocket(socket: MockSocket) {
      currentSocket = socket;
    },
    getUser: () => currentUser,
    getLocale: () => currentLocale,
    getSocket: () => currentSocket,
    /** Reset all mocks to default values */
    reset() {
      currentUser = createTestUser();
      currentLocale = "en";
      currentSocket.reset();
    },
  };
}

// ─── Custom Render ───────────────────────────────────────────────────────────

/**
 * Renders a component with communication-related providers mocked.
 *
 * IMPORTANT: You must call `setupCommunicationMocks()` at the top level of
 * your test file before using this function. Then use the returned setters
 * to configure user/locale/socket before each render.
 *
 * @example
 * ```ts
 * import { setupCommunicationMocks, renderWithProviders, createTestUser } from '../utils/render-helpers';
 * import { createMockSocket } from '../utils/mock-socket';
 *
 * const mocks = setupCommunicationMocks();
 *
 * beforeEach(() => {
 *   mocks.reset();
 * });
 *
 * it('renders for Arabic locale', () => {
 *   mocks.setLocale('ar');
 *   const { container } = renderWithProviders(<MyComponent />);
 *   // assertions...
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  renderOptions: Omit<RenderOptions, "wrapper"> = {},
) {
  return render(ui, renderOptions);
}

// Re-export testing library utilities for convenience
export { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
