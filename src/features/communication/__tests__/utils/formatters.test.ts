import { describe, expect, it } from "vitest";
import { formatTime } from "@/features/communication/conversations_redesign/utils/formatters";

describe("formatTime", () => {
  it("uses a 12-hour clock for conversation timestamps", () => {
    const timestamp = "2026-08-09T13:08:00.000Z";
    const expectedTimestamp = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timestamp));
    const formattedTimestamp = formatTime(timestamp, "en-US");

    expect(formattedTimestamp).toBe(expectedTimestamp);
  });
});
