import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.unmock("next-intl");
const boundary = vi.hoisted(() => ({ replace: vi.fn(), search: new URLSearchParams(), context: { academicYearId: "10000000-0000-4000-8000-000000000001", termId: "10000000-0000-4000-8000-000000000002", selectedTerm: { startDate: "2099-01-01", endDate: "2099-12-31" }, termStatus: "open", isInitializing: false } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: boundary.replace }), useSearchParams: () => boundary.search, usePathname: () => "/en/academics/homework/new" }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "teacher", firstName: "Teacher", lastName: "One", activeMembership: { permissions: ["homework.assignments.manage"] } }, isLoading: false }) }));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({ useAcademicYearTermLayoutContext: () => boundary.context }));
vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn(), apiWithToken: vi.fn(), apiPatch: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { apiGet, apiPost, apiWithToken } from "@/lib/api";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import CreateHomeworkPage from "../CreateHomeworkPage";
import { assignmentWorkbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";

const parentId = "10000000-0000-4000-8000-000000000003";
const allocationId = "10000000-0000-4000-8000-000000000004";
const studentId = "10000000-0000-4000-8000-000000000005";
const structure = { stages: [{ id: "stage", nameAr: "مرحلة", nameEn: "Stage" }], grades: [{ id: "grade", stageId: "stage", nameAr: "صف", nameEn: "Grade" }], sections: [{ id: "section", gradeId: "grade", nameAr: "شعبة", nameEn: "Section" }], classrooms: [{ id: "room", sectionId: "section", nameAr: "فصل", nameEn: "Room" }] };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiWithToken).mockResolvedValue(structure);
  vi.mocked(apiGet).mockImplementation(async (path) => {
    if (path === "/academics/allocations") return { items: [{ id: allocationId, term: { id: boundary.context.termId }, classroom: { id: "room", sectionId: "section" }, subject: { id: "subject" }, teacher: { id: "teacher", fullName: "Teacher" } }] };
    if (path === "/academics/subjects") return [{ id: "subject", nameAr: "رياضيات", nameEn: "Math", isActive: true }];
    if (path.startsWith("/settings/roles")) return { items: [], pagination: { page: 1, limit: 100, total: 0 } };
    if (path.startsWith("/students-guardians/enrollments")) return { items: [{ id: "enrollment", studentId, classroomId: "room", academicYearId: boundary.context.academicYearId, status: "active" }] };
    if (path.startsWith("/students-guardians/students")) return { items: [{ id: studentId, full_name_en: "Student", student_id: "S1" }] };
    if (path.endsWith("/all")) return { entries: [] };
    throw new Error(`Unexpected HTTP GET: ${path}`);
  });
  vi.mocked(apiPost).mockImplementation(async (path) => path === "/homework/assignments" ? { id: parentId } : { question: { questionId: "q", homeworkId: parentId, type: "TRUE_FALSE", prompt: "Is 2 even?", sortOrder: 1, points: 2, options: [] } });
});
function renderPage() {
  render(<NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><UnsavedChangesProvider><NavigationGuardProvider><ToastProvider><CreateHomeworkPage /></ToastProvider></NavigationGuardProvider></UnsavedChangesProvider></NextIntlClientProvider>);
}
async function prepareImport(file: File) {
  const allocation = await screen.findByRole("button", { name: (name) => name.startsWith(en.academics.homework.create.fields.teacherSubjectAllocation) });
  await waitFor(() => expect(allocation).toBeEnabled());
  fireEvent.click(allocation);
  fireEvent.click(await screen.findByText("Math - Room"));
  await screen.findByText("1 eligible student");
  fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [file] } });
  const apply = await screen.findByRole("button", { name: "Apply import" });
  await waitFor(() => expect(apply).toBeEnabled());
  fireEvent.click(apply);
}
it("keeps dashboard targeting and creates all questions only on Create Draft", async () => {
  const file = await assignmentWorkbookFile();
  renderPage();
  await prepareImport(file);
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.actions.createDraft }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining(`/homework/${parentId}?`)));
  expect(apiPost).toHaveBeenNthCalledWith(1, "/homework/assignments", expect.objectContaining({ teacherSubjectAllocationId: allocationId, title: "Practice", totalMarks: 2 }));
  expect(apiPost).toHaveBeenNthCalledWith(2, `/homework/assignments/${parentId}/questions`, expect.objectContaining({ type: "TRUE_FALSE", options: [expect.objectContaining({ isCorrect: false }), expect.objectContaining({ isCorrect: true })] }));
});
it("opens the existing draft after question failure and disables repeat creation", async () => {
  const file = await assignmentWorkbookFile();
  vi.mocked(apiPost).mockImplementation(async (path) => {
    if (path === "/homework/assignments") return { id: parentId };
    throw new Error("Response lost");
  });
  renderPage();
  await prepareImport(file);
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.actions.createDraft }));
  const open = await screen.findByRole("button", { name: "Open created draft" });
  expect(screen.getByRole("button", { name: en.academics.homework.create.actions.createDraft })).toBeDisabled();
  fireEvent.click(open);
  expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining(`/homework/${parentId}?`));
  expect(apiPost).toHaveBeenCalledTimes(2);
});
