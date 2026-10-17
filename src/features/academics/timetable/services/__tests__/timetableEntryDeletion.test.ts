import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete } from "@/lib/api";
import { deleteTimetableEntries } from "../timetableEntryDeletion";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
}));

function pendingDeletion() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<undefined>((resolvePromise, rejectPromise) => {
    resolve = () => resolvePromise(undefined);
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("timetable entry deletion", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("limits concurrent requests and reports completed deletions before starting the next batch", async () => {
    const requests = Array.from({ length: 6 }, pendingDeletion);
    let started = 0;
    vi.mocked(apiDelete).mockImplementation(() => requests[started++].promise);
    const completed: number[] = [];
    const deleting = deleteTimetableEntries(
      ["1", "2", "3", "4", "5", "6"],
      (count) => completed.push(count),
    );
    expect(started).toBe(4);
    requests.slice(0, 3).forEach((request) => request.resolve());
    await Promise.resolve();
    expect(started).toBe(4);
    requests[3].resolve();
    await vi.waitFor(() => expect(started).toBe(6));
    expect(completed).toEqual([4]);
    requests.slice(4).forEach((request) => request.resolve());
    await deleting;
    expect(completed).toEqual([4, 6]);
  });

  it("waits for in-flight deletions after a failure and never starts another batch", async () => {
    const requests = Array.from({ length: 4 }, pendingDeletion);
    let started = 0;
    vi.mocked(apiDelete).mockImplementation(() => requests[started++].promise);
    const completed: number[] = [];
    const failure = new Error("Deletion failed");
    let finished = false;
    const deleting = deleteTimetableEntries(
      ["1", "2", "3", "4", "5"],
      (count) => completed.push(count),
    );
    const outcome = deleting.catch((error) => {
      finished = true;
      return error;
    });
    requests[0].reject(failure);
    requests[1].resolve();
    requests[2].resolve();
    await Promise.resolve();
    expect(finished).toBe(false);
    expect(completed).toEqual([]);
    requests[3].resolve();
    expect(await outcome).toBe(failure);
    expect(started).toBe(4);
    expect(completed).toEqual([3]);
  });
});
