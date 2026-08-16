import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotificationDeliveryDetailsDrawer, {
  type NotificationDeliveryDetailsDrawerLabels,
} from "../../components/notifications/NotificationDeliveryDetailsDrawer";
import type { NotificationDelivery } from "../../types/notification.types";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));

const labels: NotificationDeliveryDetailsDrawerLabels = {
  title: "Delivery details",
  close: "Close",
  loading: "Loading",
  errorTitle: "Unable to load",
  id: "Delivery ID",
  notificationId: "Notification ID",
  channel: "Channel",
  status: "Status",
  provider: "Provider",
  providerMessageId: "Provider message ID",
  errorCode: "Error code",
  errorMessage: "Error message",
  attemptedAt: "Attempted at",
  sentAt: "Sent at",
  deliveredAt: "Delivered at",
  failedAt: "Failed at",
  createdAt: "Created at",
  updatedAt: "Updated at",
};

const delivery: NotificationDelivery = {
  id: "delivery-1",
  notificationId: "notification-1",
  channel: "push",
  status: "pending",
  provider: "firebase_fcm",
  providerMessageId: null,
  errorCode: null,
  errorMessage: null,
  attemptedAt: null,
  sentAt: null,
  deliveredAt: null,
  failedAt: null,
  createdAt: "2026-06-28T08:45:08.947Z",
  updatedAt: "2026-06-28T08:45:08.947Z",
};

describe("NotificationDeliveryDetailsDrawer", () => {
  it("shows only the 14 delivery response fields", () => {
    render(
      <NotificationDeliveryDetailsDrawer
        open
        delivery={delivery}
        labels={labels}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: labels.title });
    const fieldLabels = within(dialog)
      .getAllByRole("term")
      .map((term) => term.textContent);

    expect(fieldLabels).toEqual([
      labels.id,
      labels.notificationId,
      labels.channel,
      labels.status,
      labels.provider,
      labels.providerMessageId,
      labels.errorCode,
      labels.errorMessage,
      labels.attemptedAt,
      labels.sentAt,
      labels.deliveredAt,
      labels.failedAt,
      labels.createdAt,
      labels.updatedAt,
    ]);
    expect(dialog).toHaveTextContent("firebase_fcm");
    expect(dialog).not.toHaveTextContent(/Recipient|Read at|Metadata|Delivery status/);
  });
});
