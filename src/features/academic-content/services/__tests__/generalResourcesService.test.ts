import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGeneralResources } from "../generalResourcesService";

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiGet }));

describe("general resources service", () => {
  beforeEach(() => apiGet.mockReset());

  it("returns the list response without requesting each row's details", async () => {
    const listResponse = {
      items: [],
      page: 1,
      limit: 10,
      total: 0,
    };
    apiGet.mockResolvedValue(listResponse);

    await expect(
      listGeneralResources({
        academicYearId: "year-1",
        termId: "term-1",
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual(listResponse);
    expect(apiGet).toHaveBeenCalledOnce();
    expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        page: 1,
        limit: 10,
        type: "GENERAL_RESOURCE",
      },
    });
  });
});
