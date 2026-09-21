import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NotificationFilters from "../../components/notifications/NotificationFilters";
import type { NotificationFiltersState } from "../../hooks/useNotifications";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
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
  it("uses the backend announcement source type for the production filter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <NotificationFilters
        filters={initialFilters}
        labels={mockLabels}
        onChange={onChange}
      />
    );

    const sourceTypeButton = screen
      .getByText("Source Type")
      .parentElement?.querySelector("button");
    expect(sourceTypeButton).toBeInTheDocument();

    await user.click(sourceTypeButton!);
    await user.click(screen.getByRole("button", { name: "announcement" }));

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      sourceType: "communication_announcement",
      sourceId: "",
    });
  });

  it("clears dependent source filters when the source module changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const announcementFilters: NotificationFiltersState = {
      ...initialFilters,
      sourceModule: "announcements",
      sourceType: "communication_announcement",
      sourceId: "announcement-1",
    };

    render(
      <NotificationFilters
        filters={announcementFilters}
        labels={mockLabels}
        onChange={onChange}
      />
    );

    const sourceModuleButton = screen
      .getByText("Source Module")
      .parentElement?.querySelector("button");
    expect(sourceModuleButton).toBeInTheDocument();

    await user.click(sourceModuleButton!);
    await user.click(screen.getByRole("button", { name: "communication" }));

    expect(onChange).toHaveBeenCalledWith({
      ...announcementFilters,
      sourceModule: "communication",
      sourceType: "",
      sourceId: "",
    });
  });

  it("applies a message source ID after the user finishes entering it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const messageFilters: NotificationFiltersState = {
      ...initialFilters,
      sourceModule: "communication",
      sourceType: "communication_message",
    };

    render(
      <NotificationFilters
        filters={messageFilters}
        labels={mockLabels}
        onChange={onChange}
      />
    );

    const sourceId = "2f98396a-36e1-4f4a-bc85-359874fe21e8";
    await user.type(screen.getByLabelText("Source ID"), sourceId);
    await user.tab();

    expect(onChange).toHaveBeenCalledWith({
      ...messageFilters,
      sourceId,
    });
  });
});
