import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationFilters from "../../components/notifications/NotificationFilters";
import type { NotificationFiltersState } from "../../hooks/useNotifications";

const localeState = vi.hoisted(() => ({ locale: "en" }));
beforeEach(() => { localeState.locale = "en"; });
vi.mock("next-intl", () => ({
  useLocale: () => localeState.locale,
  useTranslations: () => (key: string) => key,
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
  recipientUserId: "Recipient User",
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
  it.each([
    ["en", "communication_announcement", "Announcement"],
    ["ar", "communication_announcement", "إعلان"],
    ["en", "communication_message", "Message"],
    ["ar", "communication_message", "رسالة"],
    ["en", "school_support_message", "School support message"],
    ["ar", "school_support_message", "رسالة دعم المدرسة"],
    ["en", "attendance_absence_submit", "Absence submission"],
    ["ar", "attendance_absence_submit", "تسجيل غياب"],
    ["en", "dismissal_request", "Dismissal request"],
    ["ar", "dismissal_request", "طلب استئذان"],
  ])("localizes %s source type %s without changing the API value", async (locale, sourceType, label) => {
    localeState.locale = locale;
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
    await user.click(screen.getByRole("button", { name: label }));

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      sourceType,
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

});
