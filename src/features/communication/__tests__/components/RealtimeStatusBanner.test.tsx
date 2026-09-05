import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RealtimeStatusBanner from "@/features/communication/conversations_redesign/components/RealtimeStatusBanner";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("RealtimeStatusBanner", () => {
  it("hides the banner while live updates are reconnecting", () => {
    render(
      <RealtimeStatusBanner
        connectionError={null}
        isConnected={false}
        labels={conversationRedesignLabels.en}
        onRetry={() => undefined}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
