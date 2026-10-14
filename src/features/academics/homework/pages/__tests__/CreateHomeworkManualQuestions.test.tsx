import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.unmock("next-intl");
const boundary = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), search: new URLSearchParams(), permissions: ["homework.assignments.manage", "homework.assignments.view"], context: { academicYearId: "10000000-0000-4000-8000-000000000001", termId: "10000000-0000-4000-8000-000000000002", selectedTerm: { startDate: "2099-01-01", endDate: "2099-12-31" }, termStatus: "open", isInitializing: false } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push, replace: boundary.replace }), useSearchParams: () => boundary.search, usePathname: () => "/en/academics/homework/new" }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "teacher", firstName: "Teacher", lastName: "One", activeMembership: { permissions: boundary.permissions } }, isLoading: false }) }));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({ useAcademicYearTermLayoutContext: () => boundary.context }));
vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn(), apiWithToken: vi.fn(), apiPatch: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { apiGet, apiPost, apiWithToken } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import CreateHomeworkPage from "../CreateHomeworkPage";
import { assignmentWorkbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { batchContext, batchIds, batchHttpResponse } from "../../utils/__tests__/homeworkImportBatchFixtures";

let parentNumber = 0;
let allocationContext = batchContext();
beforeEach(() => {
  vi.clearAllMocks(); parentNumber = 0; boundary.context.termStatus = "open";
  boundary.permissions = ["homework.assignments.manage", "homework.assignments.view"];
  boundary.context.academicYearId = batchIds.year; boundary.context.termId = batchIds.term;
  allocationContext = batchContext(); allocationContext.allocations = allocationContext.allocations.slice(0, 2);
  vi.mocked(apiWithToken).mockImplementation(async () => allocationContext.structure);
  vi.mocked(apiGet).mockImplementation(async path => batchHttpResponse(path, allocationContext));
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
async function chooseStructureLevel(label: string, option: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}\\s`) }));
  fireEvent.click(await screen.findByRole("button", { name: option, exact: true }));
}
async function chooseFirstClass() {
  await chooseStructureLevel("Stage", "Stage 1");
  await chooseStructureLevel("Grade", "Grade 1");
  await chooseStructureLevel("Section", "Section 1");
  await chooseStructureLevel("Class", "Room 1");
  await chooseStructureLevel("Subject", "Math");
}
it("filters assigned school paths, clears dependent selections and saves the resolved allocation with questions", async () => {
  renderPage(); await selectSingleTarget(); writeQuestion();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.picker.browseStructure }));
  expect(screen.getByText("Teacher 1", { exact: true })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /^Stage\s/ }));
  expect(screen.queryByRole("button", { name: "Stage 2", exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Stage 1", exact: true }));
  expect(screen.getByRole("button", { name: /^Section\s/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /^Class\s/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /^Subject\s/ })).toBeDisabled();
  await waitFor(() => expect(screen.queryByText("1 eligible student")).not.toBeInTheDocument());
  await chooseStructureLevel("Grade", "Grade 1");
  await chooseStructureLevel("Section", "Section 2");
  await chooseStructureLevel("Class", "Room 2");
  await chooseStructureLevel("Subject", "Math");
  await screen.findByText("1 eligible student");
  expect(screen.getByText("Teacher 2", { exact: true })).toBeVisible();
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Manual practice");
  expect(screen.getByPlaceholderText("Question Text")).toHaveValue("Is three even?");
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalled());
  expect(apiPost).toHaveBeenNthCalledWith(1, "/homework/assignments", expect.objectContaining({ teacherSubjectAllocationId: batchIds.allocationB }));
  expect(apiPost).toHaveBeenLastCalledWith("/homework/assignments/parent-1/questions", expect.objectContaining({ prompt: "Is three even?" }));
});
it("requires an explicit teacher when multiple allocations match the selected subject and class", async () => {
  const alternateId = "10000000-0000-4000-8000-000000000099";
  allocationContext.allocations.push({ ...allocationContext.allocations[0], id: alternateId, teacherId: batchIds.teacherB, teacherName: "Second teacher" });
  renderPage();
  const browse = screen.getByRole("button", { name: en.academics.homework.create.picker.browseStructure });
  await waitFor(() => expect(browse).toBeEnabled()); fireEvent.click(browse);
  await chooseFirstClass();
  expect(screen.getByText(en.academics.homework.create.picker.chooseTeacher)).toBeVisible();
  expect(screen.getByRole("button", { name: /^Teacher\s/ })).toHaveTextContent(en.academics.homework.create.picker.placeholders.teacher);
  fireEvent.change(screen.getByRole("textbox", { name: /^Title/ }), { target: { value: "Teacher practice" } });
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await screen.findByText(en.academics.homework.create.errors.allocationRequired);
  expect(apiPost).not.toHaveBeenCalled();
  await chooseStructureLevel("Teacher", "Second teacher");
  await screen.findByText("1 eligible student");
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalled());
  expect(apiPost).toHaveBeenCalledWith("/homework/assignments", expect.objectContaining({ teacherSubjectAllocationId: alternateId }));
});
it("retains an allocation with incomplete structure and allows returning to quick search", async () => {
  allocationContext.structure.stages = [];
  renderPage(); await selectSingleTarget();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.picker.browseStructure }));
  expect(screen.getByText(en.academics.homework.create.picker.noPaths)).toBeVisible();
  expect(screen.getByText(en.academics.homework.create.picker.outsideStructure)).toBeVisible();
  expect(screen.getByRole("button", { name: /^Stage\s/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.picker.quickSearch }));
  expect(screen.getByRole("button", { name: /^Teacher subject allocation/ })).toHaveTextContent("Math - Room 1");
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalled());
  expect(apiPost).toHaveBeenCalledWith("/homework/assignments", expect.objectContaining({ teacherSubjectAllocationId: batchIds.allocationA }));
});
it("shows the new choices without changing default single-class creation", async () => {
  renderPage();
  const title = screen.getByRole("textbox", { name: /^Title/ });
  const questionsEntry = screen.getByRole("button", { name: en.academics.homework.manual.entry });
  expect(title.compareDocumentPosition(questionsEntry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("region", { name: en.academics.homework.manual.creationSummary })).toBeVisible();
  expect(screen.getByRole("button", { name: en.academics.homework.manual.draftWorkflow, exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", { name: en.academics.homework.manual.entry })).toBeVisible();
  expect(screen.queryByText(en.academics.homework.manual.localHelp)).not.toBeInTheDocument();
  await selectSingleTarget();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/parent-1?")));
  expect(apiPost).toHaveBeenCalledTimes(1);
  expect(apiPost).toHaveBeenCalledWith("/homework/assignments", expect.objectContaining({ title: "Manual practice", teacherSubjectAllocationId: batchIds.allocationA, targetMode: "classroom", totalMarks: 10 }));
});
it("reveals empty authoring on multi-class opt-in without automatically adding or saving", async () => {
  renderPage(); fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow }));
  expect(screen.getByText(en.academics.homework.manual.empty)).toBeInTheDocument();
  expect(screen.queryByPlaceholderText("Question Text")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: /^Target level/ })).toBeEnabled());
  expect(screen.getByRole("button", { name: "Create 0 drafts" })).toBeDisabled();
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.draftWorkflow, exact: true }));
  expect(screen.getByRole("button", { name: "Create draft" })).toBeVisible();
  expect(screen.queryByText(en.academics.homework.manual.localHelp)).not.toBeInTheDocument();
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
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow }));
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.draftWorkflow, exact: true }));
  expect(screen.queryByPlaceholderText("Question Text")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show questions" }));
  expect(screen.getByPlaceholderText("Question Text")).toHaveValue("Is three even?");
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Manual practice");
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow }));
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
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow }));
  fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [file] } });
  const reapply = await screen.findByRole("button", { name: "Apply import" });
  await waitFor(() => expect(reapply).toBeEnabled()); fireEvent.click(reapply);
  fireEvent.click(within(screen.getByRole("dialog", { name: "Replace current questions?" })).getByRole("button", { name: "Replace questions" }));
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Practice");
  expect(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByPlaceholderText("Question Text")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.entry }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Replace current questions?" })).getByRole("button", { name: "Keep current questions" }));
  expect(screen.getByRole("button", { name: "Review import" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.entry }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Replace current questions?" })).getByRole("button", { name: "Replace questions" }));
  expect(screen.getByText(en.academics.homework.manual.empty)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /^Title/ })).toHaveValue("Practice");
  expect(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow })).toHaveAttribute("aria-pressed", "true");
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

it.each(["legacy", "manual", "excel"] as const)("blocks duplicate %s creation after an unconfirmed save and checks the original context", async origin => {
  const errors = { legacy: ApiError.network(), manual: new ApiError("Response unavailable", 503), excel: new Error("Response lost") };
  vi.mocked(apiPost).mockRejectedValue(errors[origin]);
  const view = renderPage(); await selectSingleTarget();
  if (origin === "manual") writeQuestion();
  if (origin === "excel") {
    fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
    fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [await assignmentWorkbookFile()] } });
    const apply = await screen.findByRole("button", { name: "Apply import" });
    await waitFor(() => expect(apply).toBeEnabled()); fireEvent.click(apply);
  }
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await screen.findByText(origin === "excel" ? en.academics.excelImport.messages.unknownCreation : en.academics.homework.manual.unknownCreation);
  expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
  expect(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: /^Title/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  expect(apiPost).toHaveBeenCalledTimes(1);
  boundary.context.academicYearId = "10000000-0000-4000-8000-000000000099";
  boundary.context.termId = "10000000-0000-4000-8000-000000000098";
  view.rerender(<NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><UnsavedChangesProvider><NavigationGuardProvider><ToastProvider><CreateHomeworkPage /></ToastProvider></NavigationGuardProvider></UnsavedChangesProvider></NextIntlClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.importBatch.checkListShort }));
  if (origin !== "legacy") {
    await screen.findByText(en.common.unsavedChangesTitle);
    expect(boundary.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: en.common.leave }));
  }
  await waitFor(() => expect(boundary.push).toHaveBeenCalledWith(`/en/academics/homework?year=${batchIds.year}&term=${batchIds.term}`));
  expect(apiPost).toHaveBeenCalledTimes(1);
});

it("keeps an unconfirmed save locked and explains recovery when assignment viewing is unavailable", async () => {
  boundary.permissions = ["homework.assignments.manage"];
  vi.mocked(apiPost).mockRejectedValue(ApiError.network());
  renderPage(); await selectSingleTarget();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await screen.findByText(en.academics.homework.manual.checkListUnavailable);
  expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: en.academics.homework.importBatch.checkListShort })).not.toBeInTheDocument();
  expect(apiPost).toHaveBeenCalledTimes(1);
});

it("allows correcting and retrying a confirmed server rejection", async () => {
  vi.mocked(apiPost).mockRejectedValueOnce(new ApiError("Title rejected", 422, "homework.assignment.validation_failed"));
  renderPage(); await selectSingleTarget(); writeQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await screen.findAllByText(en.academics.homework.create.errors.createFailed.replace("{message}", en.academics.homework.errorMessages.validationFailed));
  expect(screen.getByRole("button", { name: "Create draft" })).toBeEnabled();
  fireEvent.change(screen.getByRole("textbox", { name: /^Title/ }), { target: { value: "Corrected practice" } });
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/parent-1?")));
  expect(apiPost).toHaveBeenCalledTimes(3);
  expect(apiPost).toHaveBeenNthCalledWith(2, "/homework/assignments", expect.objectContaining({ title: "Corrected practice" }));
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
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.picker.browseStructure }));
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.create.picker.quickSearch }));
  expect(screen.getByRole("checkbox", { name: /Student S1/ })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.replace).toHaveBeenCalledWith(expect.stringContaining("/homework/parent-1?")));
  expect(apiPost).toHaveBeenNthCalledWith(1, "/homework/assignments", expect.objectContaining({ targetMode: "selected_students", studentIds: [batchContext().enrollments[0].studentId] }));
});
