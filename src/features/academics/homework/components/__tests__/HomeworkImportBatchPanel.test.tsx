import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.unmock("next-intl");
vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiWithToken: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { apiGet, apiWithToken, apiPost } from "@/lib/api";
import HomeworkImportBatchPanel from "../HomeworkImportBatchPanel";
import { batchContext, batchIds, batchHttpResponse } from "../../utils/__tests__/homeworkImportBatchFixtures";
import { assignmentWorkbookFile, fixtureContext } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { readImportWorkbook } from "@/features/academics/shared/excel-import/workbookReader";
import { homeworkImportFromWorkbook } from "../../utils/homeworkExcelImport";

let context = batchContext();
let parentNumber = 0;
beforeEach(() => {
  vi.clearAllMocks();
  context = batchContext(); context.allocations = context.allocations.slice(0, 2); parentNumber = 0;
  vi.mocked(apiWithToken).mockImplementation(async () => context.structure);
  vi.mocked(apiGet).mockImplementation(async path => batchHttpResponse(path, context));
  vi.mocked(apiPost).mockImplementation(async path => path === "/homework/assignments" ? { id: `parent-${++parentNumber}` } : { question: { questionId: "q", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Is 2 even?", sortOrder: 1, points: 2, options: [] } });
  vi.spyOn(window, "open").mockReturnValue(null);
});

async function renderPanel() {
  const workbook = await readImportWorkbook(await assignmentWorkbookFile(), "assignment");
  if (workbook.kind !== "valid") throw new Error("Invalid workbook");
  const imported = homeworkImportFromWorkbook(workbook.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error("Invalid import");
  const onStateChange = vi.fn();
  render(<NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><HomeworkImportBatchPanel importedDraft={imported.draft} metadata={imported.draft.metadata} academicYearId={batchIds.year} termId={batchIds.term} termStart={fixtureContext.termStart} termEnd={fixtureContext.termEnd} writable initialSubjectId={batchIds.subject} onStateChange={onStateChange} onReset={() => {}} /></NextIntlClientProvider>);
  await waitFor(() => expect(screen.getByRole("button", { name: /^Target level/ })).toBeEnabled());
  return onStateChange;
}
async function scope(label: string) {
  fireEvent.click(screen.getByRole("button", { name: /^Target level/ }));
  fireEvent.click(await screen.findByRole("button", { name: label, exact: true }));
}

it.each(["null return", "browser exception"])("preserves selected classes across search and records complete drafts despite %s", async restriction => {
  if (restriction === "browser exception") vi.mocked(window.open).mockImplementation(() => { throw new DOMException("Popup restricted"); });
  const onStateChange = await renderPanel();
  fireEvent.click(screen.getByRole("checkbox", { name: "Room 1" }));
  fireEvent.change(screen.getByLabelText("Search classes"), { target: { value: "Room 2" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Room 2" }));
  expect(screen.getByText("2 classes selected")).toBeInTheDocument();
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await screen.findByText("2 of 2 assignments created");
  expect(window.open).toHaveBeenCalledTimes(2);
  expect(window.open).toHaveBeenNthCalledWith(1, expect.stringContaining(`/parent-1?year=${batchIds.year}&term=${batchIds.term}`), "_blank", "noopener,noreferrer");
  expect(screen.getAllByRole("link", { name: /^Open assignment/ })).toHaveLength(2);
  await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith({ hasStarted: true, isSaving: false, allCreated: true }));
});

it("blocks writes after refresh failure and preserves selections for a successful read-only retry", async () => {
  await renderPanel();
  fireEvent.click(screen.getByRole("checkbox", { name: "Room 1" }));
  vi.mocked(apiWithToken).mockRejectedValueOnce(new Error("Connection lost"));
  fireEvent.click(screen.getByRole("button", { name: "Create 1 drafts" }));
  await screen.findByText(en.academics.homework.importBatch.loadError);
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Create 1 drafts" })).toBeEnabled());
  expect(screen.getByRole("checkbox", { name: "Room 1" })).toBeChecked();
});

it("requires another review after allocation ownership changes and creates only eligible school targets", async () => {
  await renderPanel(); await scope("Whole school");
  expect(screen.getByText("2 eligible classes · 2 skipped")).toBeInTheDocument();
  context.allocations[0] = { ...context.allocations[0], teacherId: batchIds.teacherB, teacherName: "Changed Teacher" };
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await screen.findByText(en.academics.homework.importBatch.changed);
  expect(apiPost).not.toHaveBeenCalled();
  expect(screen.getByText("Changed Teacher")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
  await screen.findByText("2 of 2 assignments created");
  expect(vi.mocked(apiPost).mock.calls.filter(([path]) => path === "/homework/assignments")).toHaveLength(2);
  expect(screen.getAllByText("No subject allocation for this class")).toHaveLength(2);
});

it("blocks creation after a required context read fails and allows a read-only retry", async () => {
  vi.mocked(apiWithToken).mockRejectedValueOnce(new Error("Forbidden"));
  const workbook = await readImportWorkbook(await assignmentWorkbookFile(), "assignment");
  if (workbook.kind !== "valid") throw new Error("Invalid workbook");
  const imported = homeworkImportFromWorkbook(workbook.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error("Invalid import");
  render(<NextIntlClientProvider locale="en" messages={en}><HomeworkImportBatchPanel importedDraft={imported.draft} metadata={imported.draft.metadata} academicYearId={batchIds.year} termId={batchIds.term} termStart={fixtureContext.termStart} termEnd={fixtureContext.termEnd} writable initialSubjectId={batchIds.subject} onStateChange={() => {}} onReset={() => {}} /></NextIntlClientProvider>);
  await screen.findByText(en.academics.homework.importBatch.loadError);
  expect(screen.getByRole("button", { name: "Create 0 drafts" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
  await screen.findByRole("checkbox", { name: "Room 1" });
  expect(apiPost).not.toHaveBeenCalled();
});
