import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.unmock("next-intl");
const boundary = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), search: new URLSearchParams(), permissions: ["homework.assignments.manage", "homework.assignments.view"], context: { academicYearId: "10000000-0000-4000-8000-000000000001", termId: "10000000-0000-4000-8000-000000000002", selectedTerm: { startDate: "2099-01-01", endDate: "2099-12-31" }, termStatus: "open", isInitializing: false } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push, replace: boundary.replace }), useSearchParams: () => boundary.search, usePathname: () => "/en/academics/homework/new" }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "teacher", firstName: "Teacher", lastName: "One", activeMembership: { permissions: boundary.permissions } }, isLoading: false }) }));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({ useAcademicYearTermLayoutContext: () => boundary.context }));
vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn(), apiWithToken: vi.fn(), apiPatch: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { apiGet, apiPost, apiWithToken } from "@/lib/api";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import CreateHomeworkPage from "../CreateHomeworkPage";
import { fixtureWorkbook, setSheetRow, workbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { batchContext, batchHttpResponse, batchIds } from "../../utils/__tests__/homeworkImportBatchFixtures";

let parentNumber = 0;
beforeEach(() => {
  vi.clearAllMocks(); parentNumber = 0;
  boundary.permissions = ["homework.assignments.manage", "homework.assignments.view"];
  boundary.context.academicYearId = batchIds.year; boundary.context.termId = batchIds.term; boundary.context.isInitializing = false;
  const context = batchContext(); context.allocations = context.allocations.slice(0, 2);
  vi.mocked(apiWithToken).mockResolvedValue(context.structure);
  vi.mocked(apiGet).mockImplementation(async path => batchHttpResponse(path, context));
  vi.mocked(apiPost).mockImplementation(async path => path === "/homework/assignments" ? { id: `parent-${++parentNumber}` } : { question: { questionId: "q", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Is 2 even?", sortOrder: 1, points: 2, options: [] } });
  vi.spyOn(window, "open").mockReturnValue(null);
});
function pageElement() {
  return <NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><UnsavedChangesProvider><NavigationGuardProvider><ToastProvider><CreateHomeworkPage /></ToastProvider></NavigationGuardProvider></UnsavedChangesProvider></NextIntlClientProvider>;
}
async function prepareImport() {
  const workbook = await fixtureWorkbook();
  setSheetRow(workbook.getWorksheet("Questions")!, 3, { questionNumber: 2, questionType: "TRUE_FALSE", questionText: "Is 3 odd?", points: 0, correctAnswer: true });
  const file = await workbookFile(workbook);
  const view = render(pageElement());
  const allocation = await screen.findByRole("button", { name: name => name.startsWith(en.academics.homework.create.fields.teacherSubjectAllocation) });
  await waitFor(() => expect(allocation).toBeEnabled());
  fireEvent.click(allocation); fireEvent.click(await screen.findByText("Math - Room 1"));
  await screen.findByText("1 eligible student");
  fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [file] } });
  const apply = await screen.findByRole("button", { name: "Apply import" });
  await waitFor(() => expect(apply).toBeEnabled()); fireEvent.click(apply);
  return view;
}
async function chooseGrade() {
  fireEvent.click(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow }));
  const scope = await screen.findByRole("button", { name: /^Target level/ });
  await waitFor(() => expect(scope).toBeEnabled());
  fireEvent.click(scope); fireEvent.click(screen.getByRole("button", { name: "Grade", exact: true }));
  fireEvent.click(screen.getByLabelText("Grade"));
  fireEvent.click(screen.getByRole("button", { name: "Stage 1 / Grade 1", exact: true }));
}

it("creates a grade batch with distinct allocations, locks the workbook and keeps the original page", async () => {
  await prepareImport(); await chooseGrade();
  expect(apiPost).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: en.academics.homework.create.actions.createDraft })).not.toBeInTheDocument();
  const create = screen.getByRole("button", { name: "Create 2 drafts" });
  fireEvent.click(create); fireEvent.click(create);
  await screen.findByText("2 of 2 assignments created");
  const parents = vi.mocked(apiPost).mock.calls.filter(([path]) => path === "/homework/assignments");
  expect(parents.map(([, payload]) => (payload as { teacherSubjectAllocationId: string }).teacherSubjectAllocationId)).toEqual([batchIds.allocationA, batchIds.allocationB]);
  for (const [, payload] of parents) expect(payload).toMatchObject({ targetMode: "classroom", title: "Practice" });
  expect(vi.mocked(apiPost).mock.calls.filter(([path]) => path.endsWith("/questions")).map(([path]) => path)).toEqual(["/homework/assignments/parent-1/questions", "/homework/assignments/parent-1/questions", "/homework/assignments/parent-2/questions", "/homework/assignments/parent-2/questions"]);
  expect(window.open).toHaveBeenCalledTimes(2); expect(boundary.replace).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Remove import" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Import Excel" })).toBeDisabled();
  expect(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow })).toBeDisabled();
  expect(screen.getByRole("button", { name: en.academics.homework.manual.draftWorkflow, exact: true })).toBeDisabled();
  expect(screen.getByLabelText(/^Title/)).toBeDisabled();
  const back = await screen.findByRole("button", { name: "Back to assignments" });
  expect(back).toBeEnabled();
  fireEvent.click(back);
  await waitFor(() => expect(boundary.push).toHaveBeenCalledTimes(1));
  expect(screen.queryByText(en.common.unsavedChangesTitle)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "New import" }));
  expect(screen.queryByRole("link", { name: /^Open assignment/ })).not.toBeInTheDocument();
});

it("keeps single import available without view permission and explains why batching is unavailable", async () => {
  boundary.permissions = ["homework.assignments.manage"];
  await prepareImport();
  expect(screen.getByRole("button", { name: en.academics.homework.manual.multipleWorkflow })).toBeDisabled();
  expect(screen.getByText(en.academics.homework.importBatch.permission)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: en.academics.homework.create.actions.createDraft })).toBeEnabled();
});

it("retains a partially saved draft while continuing and opens only a later completed assignment", async () => {
  let firstQuestions = 0;
  vi.mocked(apiPost).mockImplementation(async path => {
    if (path === "/homework/assignments") return { id: `parent-${++parentNumber}` };
    if (path.includes("parent-1") && ++firstQuestions === 2) throw new Error("Question response lost");
    return { question: { questionId: "q", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Is 2 even?", sortOrder: 1, points: 2, options: [] } };
  });
  await prepareImport(); await chooseGrade();
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await screen.findByText("1 of 2 assignments created");
  expect(screen.getByText("Partially saved")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open assignment for Room 1 (new tab)" })).toHaveAttribute("href", expect.stringContaining("/parent-1?"));
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith(expect.stringContaining("/parent-2?"), "_blank", "noopener,noreferrer");
  expect(boundary.replace).not.toHaveBeenCalled();
  const back = await screen.findByRole("button", { name: "Back to assignments" });
  expect(back).toBeEnabled();
  fireEvent.click(back);
  await screen.findByText(en.common.unsavedChangesTitle);
  expect(boundary.push).not.toHaveBeenCalled();
});

it("revalidates edited metadata before any batch write", async () => {
  await prepareImport(); await chooseGrade();
  fireEvent.change(screen.getByRole("textbox", { name: /^Title/ }), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await screen.findByText(/title is required/i);
  expect(apiPost).not.toHaveBeenCalled();
});

it("freezes payloads and recovery URLs when dashboard context changes during saving", async () => {
  let releaseQuestion!: () => void;
  const questionGate = new Promise<void>(resolve => { releaseQuestion = resolve; });
  vi.mocked(apiPost).mockImplementation(async path => {
    if (path === "/homework/assignments") return { id: `parent-${++parentNumber}` };
    if (path.includes("parent-1")) await questionGate;
    return { question: { questionId: "q", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Is 2 even?", sortOrder: 1, points: 2, options: [] } };
  });
  const view = await prepareImport(); await chooseGrade();
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await waitFor(() => expect(apiPost).toHaveBeenCalledWith("/homework/assignments/parent-1/questions", expect.anything()));
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  boundary.context.academicYearId = "10000000-0000-4000-8000-000000000099";
  boundary.context.termId = "10000000-0000-4000-8000-000000000098";
  boundary.context.isInitializing = true;
  view.rerender(pageElement());
  expect(screen.getByRole("region", { name: "Assignment creation results" })).toBeInTheDocument();
  releaseQuestion();
  await screen.findByText("2 of 2 assignments created");
  for (const [, payload] of vi.mocked(apiPost).mock.calls.filter(([path]) => path === "/homework/assignments")) expect(payload).toMatchObject({ academicYearId: batchIds.year, termId: batchIds.term });
  for (const link of screen.getAllByRole("link", { name: /^Open assignment/ })) expect(link).toHaveAttribute("href", expect.stringContaining(`year=${batchIds.year}&term=${batchIds.term}`));
});
