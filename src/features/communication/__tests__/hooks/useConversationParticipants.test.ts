import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createParticipant } from "../utils/test-data-generators";

const mockGetParticipants = vi.fn();

vi.mock("@/features/communication/api/communication.service", () => ({
  getParticipants: (...args: unknown[]) => mockGetParticipants(...args),
  addParticipant: vi.fn(),
  updateParticipant: vi.fn(),
  removeParticipant: vi.fn(),
  leaveConversation: vi.fn(),
  promoteParticipant: vi.fn(),
  demoteParticipant: vi.fn(),
}));

vi.mock("@/features/communication/utils/communication-metadata", () => ({
  createCommunicationMetadata: vi.fn().mockReturnValue(null),
}));

describe("useConversationParticipants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockGetParticipants.mockResolvedValue({
      data: { items: [], total: 0 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function importHook() {
    const mod = await import(
      "@/features/communication/hooks/useConversationParticipants"
    );
    return mod.useConversationParticipants;
  }

  it("sorts participants by user.displayName", async () => {
    const p1 = createParticipant({
      actor: undefined,
      user: {
        id: "u-1",
        displayName: "Charlie",
        userType: "student",
      },
    });

    const p2 = createParticipant({
      actor: undefined,
      user: {
        id: "u-2",
        displayName: "Alice",
        userType: "teacher",
      },
    });

    const p3 = createParticipant({
      actor: undefined,
      user: {
        id: "u-3",
        displayName: "Bob",
        userType: "student",
      },
    });

    mockGetParticipants.mockResolvedValue({
      data: { items: [p1, p2, p3], total: 3 },
    });

    const useConversationParticipants = await importHook();
    const { result } = renderHook(() => useConversationParticipants("conv-1"));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const sortedNames = result.current.participants.map(
      (p) => p.user?.displayName
    );
    expect(sortedNames).toEqual(["Alice", "Bob", "Charlie"]);
  });
});
