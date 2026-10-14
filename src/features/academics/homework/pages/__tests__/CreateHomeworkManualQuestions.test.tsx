import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.unmock("next-intl");
const boundary = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), search: new URLSearchParams(), context: { academicYearId: "10000000-0000-4000-8000-000000000001", termId: "10000000-0000-4000-8000-000000000002", selectedTerm: { startDate: "2099-01-01", endDate: "2099-12-31" }, termStatus: "open", isInitializing: false } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push, replace: boundary.replace }), useSearchParams: () => boundary.search, usePathname: () => "/en/academics/homework/new" }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "teacher", firstName: "Teacher", lastName: "One", activeMembership: { permissions: ["homework.assignments.manage", "homework.assignments.view"] } }, isLoading: false }) }));
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
import { batchContext, batchIds, batchHttpResponse } from "../../utils/__tests__/homeworkImportBatchFixtures";

let parentNumber = 0;
beforeEach(() => {
  vi.clearAllMocks(); parentNumber = 0; boundary.context.termStatus = "open";
  const context = batchContext(); context.allocations = context.allocations.slice(0, 2);
  vi.mocked(apiWithToken).mockResolvedValue(context.structure);
  vi.mocked(apiGet).mockImplementation(async path => batchHttpResponse(path, context));
  vi.mocked(apiPost).mockImplementation(async path => path === "/homework/assignments" ? { id: `parent-${++parentNumber}` } : { question: { questionId: "q", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Local", sortOrder: 1, points: 1, options: [] } });
  vi.spyOn(window, "open").mockReturnValue(null);
});
function renderPage() {
  return render(<NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><UnsavedChangesProvider><NavigationGuardProvider><ToastProvider><CreateHomeworkPage /></ToastProvider></NavigationGuardProvider></UnsavedChangesProvider></NextIntlClientProvider>);
}
async function selectSingleTarget() {
  const allocation = await screen.findByRole("button", { name: /^Teacher subject allocation/ });
  await waitFor(() => expect(allocation).toBeEnabled()); fireEvent.click(allocation);
  fireEvent.click(await screen.findByText("Math - Room 1")); await screen.findByText("1 eligible student");
  fireEvent.change(screen.getByRole("textbox", { name: /^Title/ }), { target: { value: "Manual practice" } });
}
function writeQuestion() {
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.entry }));
  fireEvent.click(screen.getByRole("button", { name: "Add question" }));
  fireEvent.click(screen.getByRole("button", { name: /^Question Type/ }));
  fireEvent.click(screen.getByRole("button", { name: "True/False", exact: true }));
  fireEvent.click(screen.getByRole("radio", { name: "False", exact: true }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Required question" }));
  fireEvent.change(screen.getByPlaceholderText("Question Text"), { target: { value: "Is three even?" } });
}
it("shows the new choices without changing default single-class creation", async () => {
  renderPage();
  const title = screen.getByRole("textbox", { name: /^Title/ });
  const questionsEntry = screen.getByRole("button", { name: en.academics.homework.manual.entry });
  expect(title.compareDocumentPosition(questionsEntry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("region", { name: en.academics.homework.manual.creationSummary })).toBeVisible();
  expect(screen.getByRole("checkbox", { name: "Assign to multiple classes" })).not.toBeChecked();
  expect(screen.getByRole("button", { name: en.academics.homework.manual.entry })).toBeVisible();
  expect(screen.queryByText(en.academics.homework.manual.localHelp)).not.toBeInTheDocument();
  await selectSingleTarget();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/parent-1?")));
  expect(apiPost).toHaveBeenCalledTimes(1);
  expect(apiPost).toHaveBeenCalledWith("/homework/assignments", expect.objectContaining({ title: "Manual practice", teacherSubjectAllocationId: batchIds.allocationA, targetMode: "classroom", totalMarks: 10 }));
});
it("reveals empty authoring on multi-class opt-in without automatically adding or saving", async () => {
  renderPage(); fireEvent.click(screen.getByRole("checkbox", { name: "Assign to multiple classes" }));
  expect(screen.getByText(en.academics.homework.manual.empty)).toBeInTheDocument();
  expect(screen.queryByPlaceholderText("Question Text")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: /^Target level/ })).toBeEnabled());
  expect(screen.getByRole("button", { name: "Create 0 drafts" })).toBeDisabled();
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Assign to multiple classes" }));
  expect(screen.getByRole("button", { name: "Create draft" })).toBeVisible();
  await waitFor(() => expect(screen.getByRole("button", { name: /^Teacher subject allocation/ })).toBeEnabled());
});
it("saves the last manual edit, explicit false and optional flag under a single draft", async () => {
  renderPage(); await selectSingleTarget(); writeQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/parent-1?")));
  expect(apiPost).toHaveBeenCalledTimes(2);
  expect(apiPost).toHaveBeenLastCalledWith("/homework/assignments/parent-1/questions", expect.objectContaining({ prompt: "Is three even?", sortOrder: 1, isRequired: false, type: "TRUE_FALSE", options: [{ text: "True", sortOrder: 0, isCorrect: false }, { text: "False", sortOrder: 1, isCorrect: true }] }));
  expect(window.open).not.toHaveBeenCalled();
});
it("keeps manual questions through mode changes and saves a whole-class draft per target", async () => {
  renderPage(); await selectSingleTarget(); writeQuestion();
  fireEvent.click(screen.getByRole("checkbox", { name: "Assign to multiple classes" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Assign to multiple classes" }));
  expect(screen.getByPlaceholderText("Question Text")).toHaveValue("Is three even?");
  fireEvent.click(screen.getByRole("checkbox", { name: "Assign to multiple classes" }));
  const level = await screen.findByRole("button", { name: /^Target level/ });
  await waitFor(() => expect(level).toBeEnabled()); fireEvent.click(level);
  fireEvent.click(screen.getByRole("button", { name: "Whole school", exact: true }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(4);
  expect(screen.getByText("2 skipped classes — view reasons")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await screen.findByText("2 of 2 assignments created");
  expect(apiPost).toHaveBeenCalledTimes(4);
  const parents = vi.mocked(apiPost).mock.calls.filter(([path]) => path === "/homework/assignments");
  expect(parents.map(([, payload]) => (payload as { teacherSubjectAllocationId: string }).teacherSubjectAllocationId)).toEqual([batchIds.allocationA, batchIds.allocationB]);
  for (const [, payload] of parents) { expect(payload).toMatchObject({ targetMode: "classroom" }); expect(payload).not.toHaveProperty("studentIds"); expect(payload).not.toHaveProperty("timetableEntryId"); }
  expect(window.open).toHaveBeenCalledTimes(2); expect(boundary.replace).not.toHaveBeenCalled();
  expect(screen.getByPlaceholderText("Question Text")).toBeDisabled();
});
it("preserves cancelled replacements, confirms accepted sources and keeps multiple-class intent", async () => {
  renderPage(); await selectSingleTarget(); writeQuestion();
  const file = await assignmentWorkbookFile();
  fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [file] } });
  const apply = await screen.findByRole("button", { name: "Apply import" });
  await waitFor(() => expect(apply).toBeEnabled());
  expect(screen.getByPlaceholderText("Question Text")).toHaveValue("Is three even?");
  fireEvent.click(apply);
  const confirmation = screen.getByRole("dialog", { name: "Replace current questions?" });
  fireEvent.click(within(confirmation).getByRole("button", { name: "Keep current questions" }));
  expect(screen.getByPlaceholderText("Question Text")).toHaveValue("Is three even?");
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Manual practice"); expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Assign to multiple classes" }));
  fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [file] } });
  const reapply = await screen.findByRole("button", { name: "Apply import" });
  await waitFor(() => expect(reapply).toBeEnabled()); fireEvent.click(reapply);
  fireEvent.click(within(screen.getByRole("dialog", { name: "Replace current questions?" })).getByRole("button", { name: "Replace questions" }));
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Practice");
  expect(screen.getByRole("checkbox", { name: "Assign to multiple classes" })).toBeChecked();
  expect(screen.queryByPlaceholderText("Question Text")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.entry }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Replace current questions?" })).getByRole("button", { name: "Keep current questions" }));
  expect(screen.getByRole("button", { name: "Review import" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.entry }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Replace current questions?" })).getByRole("button", { name: "Replace questions" }));
  expect(screen.getByText(en.academics.homework.manual.empty)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Practice");
  expect(screen.getByRole("checkbox", { name: "Assign to multiple classes" })).toBeChecked();
  expect(apiPost).not.toHaveBeenCalled();
});

it("retains a partially saved manual draft and blocks repeated creation", async () => {
  vi.mocked(apiPost).mockImplementation(async path => {
    if (path === "/homework/assignments") return { id: "partial-parent" };
    throw new Error("Question response lost");
  });
  renderPage(); await selectSingleTarget(); writeQuestion();
  const create = screen.getByRole("button", { name: "Create draft" });
  fireEvent.click(create); fireEvent.click(create);
  const open = await screen.findByRole("button", { name: "Open created draft" });
  expect(create).toBeDisabled(); expect(apiPost).toHaveBeenCalledTimes(2);
  expect(screen.getByPlaceholderText("Question Text")).toBeDisabled();
  fireEvent.click(open);
  expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/partial-parent?"));
});

it("preserves selected-student targeting in manual single creation and guards unsaved questions", async () => {
  renderPage(); await selectSingleTarget(); writeQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Cancel", exact: true }));
  await screen.findByText(en.common.unsavedChangesTitle);
  expect(boundary.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: en.common.stay }));
  fireEvent.click(screen.getByRole("button", { name: /^Target mode/ }));
  fireEvent.click(screen.getByRole("button", { name: "Selected students", exact: true }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Student S1/ }));
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/parent-1?")));
  expect(apiPost).toHaveBeenNthCalledWith(1, "/homework/assignments", expect.objectContaining({ targetMode: "selected_students", studentIds: [batchContext().enrollments[0].studentId] }));
});
