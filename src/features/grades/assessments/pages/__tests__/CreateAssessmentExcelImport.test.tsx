import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.unmock("next-intl");
const boundary = vi.hoisted(() => ({ push: vi.fn(), search: new URLSearchParams(), permissions: ["grades.assessments.manage", "grades.questions.manage"], context: { academicYearId: "10000000-0000-4000-8000-000000000001", termId: "10000000-0000-4000-8000-000000000002", selectedTerm: { startDate: "2099-01-01", endDate: "2099-12-31" }, termStatus: "open", isInitializing: false } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push, replace: vi.fn() }), useSearchParams: () => boundary.search, usePathname: () => "/en/grades/assessments/new" }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "user", firstName: "Teacher", lastName: "One", activeMembership: { permissions: boundary.permissions } }, isLoading: false }) }));
vi.mock("@/features/grades/hooks/GradesYearTermLayoutContext", () => ({ useGradesYearTermLayoutContext: () => boundary.context }));
vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn(), apiPatch: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { apiGet, apiPost } from "@/lib/api";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import CreateAssessmentPage from "../CreateAssessmentPage";
import { fixtureWorkbook, setSheetRow, workbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";

const parentId = "10000000-0000-4000-8000-000000000003";
const subjectId = "10000000-0000-4000-8000-000000000004";
beforeEach(() => {
  vi.clearAllMocks();
  boundary.permissions = ["grades.assessments.manage", "grades.questions.manage"];
  boundary.context.termStatus = "open";
  vi.mocked(apiGet).mockImplementation(async (path) => path === "/grades/bootstrap"
    ? { supportedScopes: ["school"], subjects: [{ id: subjectId, nameEn: "Math", nameAr: "رياضيات" }] }
    : { items: [{ id: "allocation", gradeId: "grade", subjectId }] });
  vi.mocked(apiPost).mockImplementation(async (path) => path === "/grades/assessments/question-based" ? { id: parentId } : { id: "question", assessmentId: parentId });
});
function renderPage() {
  render(<NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><UnsavedChangesProvider><NavigationGuardProvider><ToastProvider><CreateAssessmentPage /></ToastProvider></NavigationGuardProvider></UnsavedChangesProvider></NextIntlClientProvider>);
}
async function applyWorkbook(file?: File) {
  fireEvent.click(await screen.findByRole("button", { name: "Import Excel" }));
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [file ?? await workbookFile(await fixtureWorkbook("assessment"))] } });
  const apply = await screen.findByRole("button", { name: "Apply import" });
  await waitFor(() => expect(apply).toBeEnabled());
  fireEvent.click(apply);
}

it("applies without mutation then creates through the real bilingual service", async () => {
  renderPage();
  await applyWorkbook();
  expect(apiPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Review import" }));
  await screen.findByText("Assessment");
  expect(screen.queryByText(boundary.context.termId)).not.toBeInTheDocument();
  expect(screen.queryByText(subjectId)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Apply import" }));
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  await waitFor(() => expect(boundary.push).toHaveBeenCalledWith(expect.stringContaining(`${parentId}/questions?`)));
  expect(apiPost).toHaveBeenNthCalledWith(1, "/grades/assessments/question-based", expect.objectContaining({ titleEn: "Assessment", titleAr: "اختبار", weight: 0.5, subjectId, termId: boundary.context.termId }));
  expect(apiPost).toHaveBeenNthCalledWith(2, `/grades/assessments/${parentId}/questions`, expect.objectContaining({ promptAr: "هل ٢ زوجي؟", prompt: "Is 2 even?", correctAnswer: false, sortOrder: 1 }));
});
it("blocks import without question permission while leaving score-only creation available", async () => {
  boundary.permissions = ["grades.assessments.manage"];
  renderPage();
  expect(await screen.findByRole("button", { name: "Import Excel" })).toBeDisabled();
  expect(screen.getByRole("button", { name: en.academics.grades.dialogs.createAssessment.save })).toBeEnabled();
  expect(apiPost).not.toHaveBeenCalled();
});
it("retains the parent on partial failure and prevents a second create", async () => {
  const workbook = await fixtureWorkbook("assessment");
  setSheetRow(workbook.getWorksheet("Questions")!, 3, { questionNumber: 2, questionType: "ESSAY", questionTextAr: "اشرح إجابتك", questionTextEn: "Explain your answer", points: 2 });
  const file = await workbookFile(workbook);
  let questionRequests = 0;
  vi.mocked(apiPost).mockImplementation(async (path) => {
    if (path === "/grades/assessments/question-based") return { id: parentId };
    if (++questionRequests === 1) return { id: "question", assessmentId: parentId };
    throw new Error("Response lost");
  });
  renderPage();
  await applyWorkbook(file);
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  const open = await screen.findByRole("button", { name: "Open created draft" });
  expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
  fireEvent.click(open);
  expect(boundary.push).toHaveBeenCalledWith(expect.stringContaining("recovery=question-save-failed"));
  expect(boundary.push).toHaveBeenCalledWith(expect.stringContaining("failedQuestionNumber=2"));
  expect(apiPost).toHaveBeenCalledTimes(3);
});
it("rejects a title edited past the backend limit after preview", async () => {
  renderPage();
  await applyWorkbook();
  fireEvent.change(screen.getByLabelText((label) => label.startsWith(en.academics.grades.dialogs.createAssessment.titleEn)), { target: { value: "x".repeat(256) } });
  fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
  expect(apiPost).not.toHaveBeenCalled();
  await screen.findByText("Text exceeds 255 characters.");
});

it.each(["leave", "remove"] as const)("warns before losing pending questions and allows navigation after %s", async (decision) => {
  renderPage();
  await applyWorkbook();
  fireEvent.click(screen.getByRole("button", { name: en.common.cancel }));
  await screen.findByText(en.common.unsavedChangesTitle);
  expect(boundary.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: en.common.stay }));
  expect(screen.getByRole("button", { name: "Remove import" })).toBeEnabled();
  if (decision === "remove") fireEvent.click(screen.getByRole("button", { name: "Remove import" }));
  fireEvent.click(screen.getByRole("button", { name: en.common.cancel }));
  if (decision === "leave") fireEvent.click(await screen.findByRole("button", { name: en.common.leave }));
  await waitFor(() => expect(boundary.push).toHaveBeenCalledTimes(1));
  expect(apiPost).not.toHaveBeenCalled();
});

it("creates only one parent when Create Draft is clicked again during its request", async () => {
  let resolveParent!: (parent: { id: string }) => void;
  const parentRequest = new Promise<{ id: string }>((resolve) => { resolveParent = resolve; });
  vi.mocked(apiPost).mockImplementation(async (path) => path === "/grades/assessments/question-based" ? parentRequest : { id: "question", assessmentId: parentId });
  renderPage();
  await applyWorkbook();
  const create = screen.getByRole("button", { name: "Create draft" });
  fireEvent.click(create);
  fireEvent.click(create);
  expect(apiPost).toHaveBeenCalledTimes(1);
  resolveParent({ id: parentId });
  await waitFor(() => expect(boundary.push).toHaveBeenCalledTimes(1));
  expect(apiPost).toHaveBeenCalledTimes(2);
});
