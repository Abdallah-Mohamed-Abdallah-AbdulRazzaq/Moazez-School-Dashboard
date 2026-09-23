import { describe, expect, it } from "vitest";
import { runBoundedRequests } from "@/features/communication/hooks/runBoundedRequests";

describe("runBoundedRequests", () => {
  it("reports failed message IDs while continuing the remaining requests", async () => {
    const requested: string[] = [];
    const failures = await runBoundedRequests(["one", "two", "three"], async (messageId) => {
      requested.push(messageId);
      if (messageId === "two") throw new Error("Temporary failure");
    });

    expect(requested).toEqual(["one", "two", "three"]);
    expect(failures).toEqual(["two"]);
  });

  it("limits concurrent message requests across overlapping batches", async () => {
    let active = 0;
    let maximumActive = 0;
    const finishers: Array<() => void> = [];
    const request = async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise<void>((resolve) => finishers.push(resolve));
      active -= 1;
    };

    const first = runBoundedRequests(["1", "2", "3", "4", "5"], request);
    const second = runBoundedRequests(["6", "7", "8", "9", "10"], request);
    await Promise.resolve();
    expect(maximumActive).toBe(4);

    while (finishers.length > 0) {
      finishers.splice(0).forEach((finish) => finish());
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await Promise.all([first, second]);
    expect(maximumActive).toBe(4);
  });
});
