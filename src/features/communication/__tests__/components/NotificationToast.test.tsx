import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NotificationToastContainer,
  type NotificationToastItem,
} from "@/features/communication/components/NotificationToast";

const messageNotification: NotificationToastItem = {
  id: "notification-1",
  conversationId: "conversation-1",
  title: "Teacher",
  body: "Please check this",
  contextLabel: "Grade 5A",
  actionLabel: "Open conversation",
  kind: "message",
  priority: "normal",
  timestamp: Date.now(),
};

describe("NotificationToastContainer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pauses auto-dismiss while the toast is hovered or keyboard-focused", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <NotificationToastContainer
        locale="en"
        notifications={[messageNotification]}
        onDismiss={onDismiss}
        onClick={vi.fn()}
      />,
    );

    const toast = screen.getByRole("article");
    const openConversation = screen.getByRole("button", {
      name: "Open conversation: Teacher",
    });

    fireEvent.mouseEnter(toast);
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toast);
    fireEvent.focus(openConversation);
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.blur(openConversation);
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).toHaveBeenCalledWith("notification-1");
  });
});
