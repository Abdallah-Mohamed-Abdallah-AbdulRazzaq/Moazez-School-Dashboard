import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConversationPagination from "@/features/communication/conversations_redesign/components/ConversationPagination";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("ConversationPagination", () => {
  it("navigates between pages and disables boundary actions", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <ConversationPagination
        page={1}
        totalPages={3}
        isLoading={false}
        isRTL={false}
        labels={conversationRedesignLabels.en}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(
      <ConversationPagination
        page={3}
        totalPages={3}
        isLoading={false}
        isRTL={false}
        labels={conversationRedesignLabels.en}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("keeps the current page visible and disables navigation while loading", () => {
    render(
      <ConversationPagination
        page={2}
        totalPages={3}
        isLoading
        isRTL={false}
        labels={conversationRedesignLabels.en}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading conversations..." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("does not render pagination when there are no pages", () => {
    const { container } = render(
      <ConversationPagination
        page={1}
        totalPages={0}
        isLoading={false}
        isRTL={false}
        labels={conversationRedesignLabels.en}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Arabic page indicator", () => {
    render(
      <ConversationPagination
        page={2}
        totalPages={4}
        isLoading={false}
        isRTL
        labels={conversationRedesignLabels.ar}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("صفحة 2 من 4")).toBeInTheDocument();
  });
});
