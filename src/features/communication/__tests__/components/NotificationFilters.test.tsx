import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NotificationFilters from "../../components/notifications/NotificationFilters";
import type { NotificationFiltersState } from "../../hooks/useNotifications";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// Mock the search select components since they are not the focus of this test and might make API calls
vi.mock("../../components/selectors/AnnouncementSearchSelect", () => ({
  default: () => <div data-testid="announcement-select">AnnouncementSelect</div>,
}));
vi.mock("../../components/selectors/ConversationSearchSelect", () => ({
  default: () => <div data-testid="conversation-select">ConversationSelect</div>,
}));
vi.mock("../../components/selectors/MessageSearchSelect", () => ({
  default: () => <div data-testid="message-select">MessageSelect</div>,
}));
vi.mock("../../components/selectors/UserSearchSelect", () => ({
  default: () => <div data-testid="user-select">UserSelect</div>,
}));

const mockLabels = {
  status: "Status",
  all: "All",
  unread: "Unread",
  read: "Read",
  archived: "Archived",
  priority: "Priority",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  type: "Type",
  sourceModule: "Source Module",
  sourceType: "Source Type",
  sourceId: "Source ID",
  recipientUserId: "Recipient User",
  selectSourceTypeFirst: "Select source type first",
  createdFrom: "Created From",
  createdTo: "Created To",
  clear: "Clear",
};

const initialFilters: NotificationFiltersState = {
  status: "all",
  priority: "",
  type: "",
  sourceModule: "",
  sourceType: "",
  sourceId: "",
  recipientUserId: "",
  createdFrom: "",
  createdTo: "",
};

describe("NotificationFilters", () => {
  it("renders with early leave option and allows selecting it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <NotificationFilters
        filters={initialFilters}
        labels={mockLabels}
        onChange={onChange}
      />
    );

    // Find the Type select trigger button
    const typeLabel = screen.getByText("Type");
    const typeContainer = typeLabel.parentElement;
    expect(typeContainer).toBeInTheDocument();
    
    const typeButton = typeContainer?.querySelector("button");
    expect(typeButton).toBeInTheDocument();

    // Click the Type select to open options
    await user.click(typeButton!);

    // Find and click the attendance_early_leave option
    const earlyLeaveOption = screen.getByRole("button", {
      name: "attendance_early_leave",
    });
    expect(earlyLeaveOption).toBeInTheDocument();

    await user.click(earlyLeaveOption);

    // Verify onChange was called with the updated filter
    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      type: "attendance_early_leave",
    });
  });
});
