import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStructureTree, fetchAcademicYears, fetchTermsByYear } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchRooms } from "@/features/academics/rooms/services/roomsService";
import { fetchSubjectAllocations, fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import { fetchBrandingProfile } from "@/features/settings/services/brandingService";
import { useAuth } from "@/hooks/use-auth";
import { useSetupStatus } from "../hooks/useSetupStatus";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/settings/services/brandingService", () => ({
  fetchBrandingProfile: vi.fn(),
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchAcademicYears: vi.fn(),
  fetchTermsByYear: vi.fn(),
  fetchStructureTree: vi.fn(),
}));

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: vi.fn(),
  fetchSubjectAllocations: vi.fn(),
}));

vi.mock("@/features/academics/rooms/services/roomsService", () => ({
  fetchRooms: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedFetchBrandingProfile = vi.mocked(fetchBrandingProfile);
const mockedFetchAcademicYears = vi.mocked(fetchAcademicYears);
const mockedFetchTermsByYear = vi.mocked(fetchTermsByYear);
const mockedFetchStructureTree = vi.mocked(fetchStructureTree);
const mockedFetchSubjects = vi.mocked(fetchSubjects);
const mockedFetchSubjectAllocations = vi.mocked(fetchSubjectAllocations);
const mockedFetchRooms = vi.mocked(fetchRooms);

const profile = {
  schoolName: "Moazez School",
  shortName: "MS",
  timezone: "Africa/Cairo",
  addressLine: "",
  formattedAddress: "",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "",
  logoUrl: "",
  latitude: null,
  longitude: null,
  mapPlaceLabel: "",
};

const inactiveYear = {
  id: "year-old",
  name: "2025-2026",
  startDate: "2025-09-01",
  endDate: "2026-06-30",
  isActive: false,
};

const activeYear = {
  id: "year-1",
  name: "2026-2027",
  startDate: "2026-09-01",
  endDate: "2027-06-30",
  isActive: true,
};

const closedTerm = {
  id: "term-old",
  name: "Closed",
  yearId: activeYear.id,
  status: "closed" as const,
  startDate: "2026-09-01",
  endDate: "2026-12-31",
};

const openTerm = {
  id: "term-1",
  name: "Open",
  yearId: activeYear.id,
  status: "open" as const,
  startDate: "2027-01-01",
  endDate: "2027-06-30",
};

const stage = { id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", order: 1 };
const grade = {
  id: "grade-1",
  name: "Grade 1",
  nameAr: "الأول",
  nameEn: "Grade 1",
  stageId: stage.id,
  capacity: 30,
  order: 1,
};
const section = {
  id: "section-1",
  name: "A",
  nameAr: "أ",
  nameEn: "A",
  gradeId: grade.id,
  capacity: 30,
  order: 1,
};
const classroom = {
  id: "classroom-1",
  name: "Classroom 1",
  nameAr: "Classroom 1 AR",
  nameEn: "Classroom 1",
  sectionId: section.id,
  capacity: 30,
  order: 1,
};
const subject = {
  id: "subject-1",
  name: "Math",
  nameAr: "رياضيات",
  nameEn: "Math",
  isActive: true,
};
const room = {
  id: "room-1",
  schoolId: "school-1",
  nameAr: "غرفة 1",
  nameEn: "Room 1",
  capacity: 30,
  isActive: true,
};

function mockSuccessfulLoad() {
  mockedFetchBrandingProfile.mockResolvedValue(profile);
  mockedFetchAcademicYears.mockResolvedValue([inactiveYear, activeYear]);
  mockedFetchTermsByYear.mockImplementation(async (yearId) =>
    yearId === activeYear.id ? [closedTerm, openTerm] : [],
  );
  mockedFetchStructureTree.mockResolvedValue({
    stages: [stage],
    grades: [grade],
    sections: [section],
    classrooms: [classroom],
  });
  mockedFetchSubjects.mockResolvedValue([subject]);
  mockedFetchSubjectAllocations.mockResolvedValue([
    { subjectId: subject.id, gradeId: grade.id, weeklyHours: 4 },
  ]);
  mockedFetchRooms.mockResolvedValue([room]);
}

describe("useSetupStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { activeMembership: { schoolId: "school-1" } },
    } as never);
    mockSuccessfulLoad();
  });

  it("starts in loading state and then evaluates the complete real setup chain", async () => {
    const { result } = renderHook(() => useSetupStatus());

    expect(result.current.snapshot.organization.status).toBe("loading");
    expect(result.current.snapshot.rooms.status).toBe("loading");

    await waitFor(() => expect(result.current.evaluation.isComplete).toBe(true));

    expect(mockedFetchAcademicYears).toHaveBeenCalledTimes(1);
    expect(mockedFetchTermsByYear).toHaveBeenCalledWith(inactiveYear.id);
    expect(mockedFetchTermsByYear).toHaveBeenCalledWith(activeYear.id);
    expect(mockedFetchStructureTree).toHaveBeenCalledWith(activeYear.id, openTerm.id);
    expect(mockedFetchSubjects).toHaveBeenCalledWith();
    expect(mockedFetchSubjectAllocations).toHaveBeenCalledWith(openTerm.id);
    expect(mockedFetchRooms).toHaveBeenCalledWith("school-1");
    expect(result.current.selectedYear).toEqual(activeYear);
    expect(result.current.selectedTerm).toEqual(openTerm);
    expect(result.current.schoolId).toBe("school-1");
  });

  it("isolates a rooms load failure and retries only the rooms step", async () => {
    mockedFetchRooms.mockRejectedValueOnce(new Error("rooms failed"));
    const { result } = renderHook(() => useSetupStatus());

    await waitFor(() => expect(result.current.snapshot.rooms.status).toBe("error"));
    expect(result.current.evaluation.completedCount).toBe(4);
    expect(result.current.snapshot.organization.status).toBe("success");

    mockedFetchRooms.mockResolvedValueOnce([room]);
    await act(async () => {
      await result.current.retryStep("rooms");
    });

    expect(mockedFetchRooms).toHaveBeenCalledTimes(2);
    expect(result.current.snapshot.rooms.status).toBe("success");
    expect(result.current.evaluation.isComplete).toBe(true);
  });

  it("refreshes academic context and dependent resources when requested", async () => {
    const { result } = renderHook(() => useSetupStatus());

    await waitFor(() => expect(result.current.selectedTerm?.id).toBe(openTerm.id));

    const nextTerm = { ...openTerm, id: "term-2", name: "Next Open" };
    mockedFetchTermsByYear.mockImplementation(async (yearId) =>
      yearId === activeYear.id ? [nextTerm] : [],
    );
    mockedFetchSubjects.mockResolvedValue([subject]);

    await act(async () => {
      await result.current.refreshStep("academicContext");
    });

    expect(mockedFetchAcademicYears).toHaveBeenCalledTimes(2);
    expect(mockedFetchStructureTree).toHaveBeenLastCalledWith(activeYear.id, nextTerm.id);
    expect(mockedFetchSubjects).toHaveBeenLastCalledWith();
    expect(mockedFetchSubjectAllocations).toHaveBeenLastCalledWith(nextTerm.id);
    expect(result.current.selectedTerm).toEqual(nextTerm);
  });

  it("does not send the active-school fallback when the auth membership has no school id", async () => {
    mockedUseAuth.mockReturnValue({ user: { activeMembership: null } } as never);

    const { result } = renderHook(() => useSetupStatus());

    await waitFor(() => expect(result.current.snapshot.rooms.status).toBe("error"));

    expect(result.current.schoolId).toBe("");
    expect(mockedFetchRooms).not.toHaveBeenCalled();
    expect(result.current.snapshot.rooms.error).toBe("No school selected");
  });

  it("waits for auth to restore before loading setup resources", async () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: true } as never);

    const { result } = renderHook(() => useSetupStatus());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.schoolId).toBe("");
    expect(result.current.snapshot.organization.status).toBe("loading");
    expect(mockedFetchBrandingProfile).not.toHaveBeenCalled();
    expect(mockedFetchAcademicYears).not.toHaveBeenCalled();
    expect(mockedFetchTermsByYear).not.toHaveBeenCalled();
    expect(mockedFetchStructureTree).not.toHaveBeenCalled();
    expect(mockedFetchSubjects).not.toHaveBeenCalled();
    expect(mockedFetchSubjectAllocations).not.toHaveBeenCalled();
    expect(mockedFetchRooms).not.toHaveBeenCalled();
  });
});
