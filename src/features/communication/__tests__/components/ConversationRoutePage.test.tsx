import { describe, expect, it, vi } from "vitest";
import { renderWithPermissions } from "@/__tests__/test-utils/renderWithPermissions";

import Page from "@/app/[lang]/(dashboard)/communication/conversations/page";

vi.mock(
  "@/features/communication/conversations_redesign/pages/ConversationPage",
  () => ({
    default: ({
      initialConversationId,
    }: {
      initialConversationId?: string | null;
    }) => (
      <div data-testid="conversation-page">
        {initialConversationId ?? "no-conversation"}
      </div>
    ),
  }),
);

describe("communication conversations route", () => {
  it("does not add an outer full viewport height around the keyboard-aware conversation page", async () => {
    const element = await Page({
      searchParams: Promise.resolve({ conversationId: "conv-1" }),
    });

    const { container } = renderWithPermissions(element, [
      "communication.conversations.view",
      "communication.messages.view",
    ]);
    const routeShell = container.querySelector("main");

    expect(routeShell).toHaveClass("min-w-0", "overflow-x-hidden");
    expect(routeShell).not.toHaveClass("h-screen");
  });
});
