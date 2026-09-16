import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const moderationMocks = vi.hoisted(() => {
  const state = { messageId: "" };

  return {
    state,
    load: vi.fn(),
    setMessageId: vi.fn((messageId: string) => {
      state.messageId = messageId;
    }),
  };
});

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("messageId=message-1"),
}));
vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));
vi.mock("@/features/communication/hooks/useModerationActions", () => ({
  useModerationActions: () => ({
    actions: [],
    conversation: null,
    error: null,
    isLoading: false,
    isMutating: false,
    load: moderationMocks.load,
    loadConversation: vi.fn(),
    message: null,
    messageId: moderationMocks.state.messageId,
    runAction: vi.fn(),
    selectMessage: vi.fn(),
    senderParticipant: null,
    setMessageId: moderationMocks.setMessageId,
  }),
}));
vi.mock("@/features/communication/components/layout/CommunicationErrorState", () => ({ default: () => null }));
vi.mock("@/features/communication/components/layout/CommunicationPageHeader", () => ({ default: () => null }));
vi.mock("@/features/communication/components/layout/CommunicationTabs", () => ({ default: () => null }));
vi.mock("@/features/communication/components/safety/ModerationActionForm", () => ({ default: () => null }));
vi.mock("@/features/communication/components/safety/ModerationActionsPanel", () => ({ default: () => null }));
vi.mock("@/features/communication/components/safety/ModerationHistoryTable", () => ({ default: () => null }));
vi.mock("@/features/communication/components/safety/SafetyNavigation", () => ({ default: () => null }));

import ModerationPage from "@/features/communication/pages/ModerationPage";

describe("ModerationPage", () => {
  beforeEach(() => {
    moderationMocks.load.mockReset();
    moderationMocks.state.messageId = "";
    moderationMocks.setMessageId.mockClear();
  });

  it("loads a message from the URL only once after rerendering", async () => {
    const { rerender } = render(<ModerationPage />);

    await waitFor(() =>
      expect(moderationMocks.load).toHaveBeenCalledWith("message-1"),
    );

    rerender(<ModerationPage />);

    expect(moderationMocks.load).toHaveBeenCalledTimes(1);
  });
});
