import { describe, expect, test, vi } from "vitest";

import {
  fetchAllAdmissionsPages,
  normalizeDocument,
  unwrapPaginatedResponse,
} from "@/features/admissions/shared/services/admissionsApiUtils";

describe("normalizeDocument", () => {
  test.each([
    ["pending_review", "pending_review"],
    ["PENDING_REVIEW", "pending_review"],
    ["pending-review", "pending_review"],
    ["pending review", "pending_review"],
    ["complete", "complete"],
    ["accepted", "complete"],
    ["approved", "complete"],
    ["missing", "missing"],
    ["rejected", "missing"],
    ["replacement_requested", "missing"],
    ["needs_replacement", "missing"],
    ["unexpected", "missing"],
    [null, "missing"],
  ] as const)("maps backend status %s to %s", (backendStatus, expectedStatus) => {
    expect(
      normalizeDocument({
        id: "doc-1",
        documentType: "Birth Certificate",
        status: backendStatus,
      }).status,
    ).toBe(expectedStatus);
  });
});

describe("Admissions pagination", () => {
  test("unwraps the backend pagination envelope", () => {
    expect(
      unwrapPaginatedResponse(
        {
          items: [{ id: "item-1" }],
          pagination: { page: 1, limit: 20, total: 1 },
        },
        "items",
      ),
    ).toEqual({
      items: [{ id: "item-1" }],
      pagination: { page: 1, limit: 20, total: 1 },
    });
  });

  test("rejects malformed pagination metadata", () => {
    expect(() =>
      unwrapPaginatedResponse(
        {
          items: [],
          pagination: { page: 0, limit: 20, total: -1 },
        },
        "items",
      ),
    ).toThrow("Invalid items pagination metadata");
  });

  test("loads every reported page exactly once", async () => {
    const fetchPage = vi.fn(async (page: number, limit: number) => ({
      items: [{ id: `item-${page}` }],
      pagination: { page, limit, total: 201 },
    }));

    await expect(fetchAllAdmissionsPages(fetchPage)).resolves.toEqual([
      { id: "item-1" },
      { id: "item-2" },
      { id: "item-3" },
    ]);
    expect(fetchPage.mock.calls).toEqual([
      [1, 100],
      [2, 100],
      [3, 100],
    ]);
  });

  test("allows application records to be filtered after every page loads", async () => {
    const fetchPage = vi.fn(async (page: number, limit: number) => ({
      items: [
        {
          id: `test-${page}`,
          applicationId: page === 2 ? "application-target" : "other",
        },
      ],
      pagination: { page, limit, total: 101 },
    }));

    const allItems = await fetchAllAdmissionsPages(fetchPage);

    expect(
      allItems.filter(
        (item) => item.applicationId === "application-target",
      ),
    ).toEqual([{ id: "test-2", applicationId: "application-target" }]);
  });

  test("returns an empty first page without requesting more pages", async () => {
    const fetchPage = vi.fn(async (page: number, limit: number) => ({
      items: [] as Array<{ id: string }>,
      pagination: { page, limit, total: 0 },
    }));

    await expect(fetchAllAdmissionsPages(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  test("accepts total changes and removes duplicate records between pages", async () => {
    const fetchPage = vi.fn(async (page: number, limit: number) => ({
      items:
        page === 1
          ? [{ id: "item-1" }]
          : [{ id: "item-1" }, { id: "item-2" }],
      pagination: { page, limit, total: page === 1 ? 101 : 99 },
    }));

    await expect(fetchAllAdmissionsPages(fetchPage)).resolves.toEqual([
      { id: "item-1" },
      { id: "item-2" },
    ]);
  });
});
