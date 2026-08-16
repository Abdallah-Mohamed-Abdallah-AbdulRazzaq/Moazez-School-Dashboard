import { beforeEach, describe, expect, it, vi } from "vitest";
import { structureApiAdapter } from "../structureApiAdapter";
import { fetchAcademicYears, fetchTermsByYear } from "../structureService";
import type { AcademicYear, Term } from "../structureService";

vi.mock("../structureApiAdapter", () => ({
  structureApiAdapter: {
    fetchAcademicYears: vi.fn(),
    fetchTermsByYear: vi.fn(),
  },
}));

const mockedFetchTermsByYear = vi.mocked(structureApiAdapter.fetchTermsByYear);
const mockedFetchAcademicYears = vi.mocked(structureApiAdapter.fetchAcademicYears);

const academicYear: AcademicYear = {
  id: "year-1",
  name: "2026-2027",
  startDate: "2026-09-01",
  endDate: "2027-06-30",
  isActive: true,
};

const term: Term = {
  id: "term-1",
  name: "Term 1",
  yearId: "year-1",
  status: "open",
  startDate: "2026-09-01",
  endDate: "2027-01-31",
};

describe("structureService", () => {
  beforeEach(() => {
    mockedFetchAcademicYears.mockReset();
    mockedFetchTermsByYear.mockReset();
  });

  it("shares concurrent academic year requests", async () => {
    let resolveYears: (years: AcademicYear[]) => void = () => undefined;
    mockedFetchAcademicYears.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveYears = resolve;
      }),
    );

    const firstRequest = fetchAcademicYears();
    const secondRequest = fetchAcademicYears();

    expect(mockedFetchAcademicYears).toHaveBeenCalledTimes(1);

    resolveYears([academicYear]);

    await expect(firstRequest).resolves.toEqual([academicYear]);
    await expect(secondRequest).resolves.toEqual([academicYear]);
  });

  it("shares concurrent term requests for the same academic year", async () => {
    let resolveTerms: (terms: Term[]) => void = () => undefined;
    mockedFetchTermsByYear.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveTerms = resolve;
      }),
    );

    const firstRequest = fetchTermsByYear("year-1");
    const secondRequest = fetchTermsByYear("year-1");

    expect(mockedFetchTermsByYear).toHaveBeenCalledTimes(1);

    resolveTerms([term]);

    await expect(firstRequest).resolves.toEqual([term]);
    await expect(secondRequest).resolves.toEqual([term]);
  });

  it("allows a fresh terms request after the previous request settles", async () => {
    mockedFetchTermsByYear
      .mockResolvedValueOnce([term])
      .mockResolvedValueOnce([{ ...term, id: "term-2" }]);

    await expect(fetchTermsByYear("year-1")).resolves.toEqual([term]);
    await expect(fetchTermsByYear("year-1")).resolves.toEqual([
      { ...term, id: "term-2" },
    ]);

    expect(mockedFetchTermsByYear).toHaveBeenCalledTimes(2);
  });
});
