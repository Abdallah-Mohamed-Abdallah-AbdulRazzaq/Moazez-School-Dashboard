import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.unmock("next-intl");
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import ExcelImportDialog from "../ExcelImportDialog";
import { assignmentWorkbookFile, fixtureContext, fixtureWorkbook, setSheetRow, workbookFile } from "./excelImportFixtures";

it("previews the real workbook and applies only after explicit confirmation", async () => {
  const onApply = vi.fn();
  render(<NextIntlClientProvider locale="en" messages={en}><ExcelImportDialog isOpen module="assignment" context={fixtureContext} disabled={false} onClose={vi.fn()} onApply={onApply} /></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [await assignmentWorkbookFile()] } });
  await screen.findByText("Is 2 even?");
  expect(onApply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply import" }));
  expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ module: "assignment", questions: [expect.objectContaining({ correctAnswer: false })] }));
});

it("shows a row error and blocks invalid data without applying", async () => {
  const onApply = vi.fn();
  render(<NextIntlClientProvider locale="en" messages={en}><ExcelImportDialog isOpen module="assignment" context={fixtureContext} disabled={false} onClose={vi.fn()} onApply={onApply} /></NextIntlClientProvider>);
  const workbook = await fixtureWorkbook();
  setSheetRow(workbook.getWorksheet("Questions")!, 2, { correctAnswer: "invalid" });
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [await workbookFile(workbook)] } });
  await screen.findAllByText(/Invalid value/);
  expect(screen.getByRole("button", { name: "Apply import" })).toBeDisabled();
  expect(onApply).not.toHaveBeenCalled();
});

it("supports Arabic preview and cancellation without applying", async () => {
  const onClose = vi.fn();
  const onApply = vi.fn();
  render(<NextIntlClientProvider locale="ar" messages={ar}><ExcelImportDialog isOpen module="assignment" context={fixtureContext} disabled={false} onClose={onClose} onApply={onApply} /></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText("اختر ملف Excel"), { target: { files: [await assignmentWorkbookFile()] } });
  await screen.findByText("Is 2 even?");
  fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(onApply).not.toHaveBeenCalled();
});

it.each(["unsupported", "oversized"])("rejects an %s replacement dropped on the shared upload area and clears the previous preview", async reason => {
  const onApply = vi.fn();
  render(<NextIntlClientProvider locale="en" messages={en}><ExcelImportDialog isOpen module="assignment" context={fixtureContext} disabled={false} onClose={vi.fn()} onApply={onApply} /></NextIntlClientProvider>);
  const uploadArea = screen.getByRole("button", { name: "Drop your Excel workbook here or choose a file" });
  fireEvent.drop(uploadArea, { dataTransfer: { files: [await assignmentWorkbookFile()] } });
  await screen.findByText("Is 2 even?");
  const file = reason === "unsupported" ? new File(["text"], "notes.txt", { type: "text/plain" }) : new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.xlsx");
  fireEvent.drop(uploadArea, { dataTransfer: { files: [file] } });
  expect(screen.getByText(reason === "unsupported" ? "Unsupported file type" : "File is too large")).toBeInTheDocument();
  expect(screen.queryByText("Is 2 even?")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Apply import" })).toBeDisabled();
  expect(onApply).not.toHaveBeenCalled();
});

it("reviews questions as paginated cards without losing questions when applying", async () => {
  const onApply = vi.fn();
  const workbook = await fixtureWorkbook();
  for (let number = 2; number <= 12; number++) setSheetRow(workbook.getWorksheet("Questions")!, number + 1, { questionNumber: number, questionType: "TRUE_FALSE", questionText: `Prompt ${number}`, points: 1, correctAnswer: false });
  render(<NextIntlClientProvider locale="en" messages={en}><ExcelImportDialog isOpen module="assignment" context={fixtureContext} disabled={false} onClose={vi.fn()} onApply={onApply} /></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText("Choose Excel file"), { target: { files: [await workbookFile(workbook)] } });
  const card = await screen.findByRole("article", { name: "Question 1" });
  expect(within(card).getByText("Is 2 even?")).toBeInTheDocument();
  expect(within(card).getByText("False")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(10);
  expect(screen.getByRole("button", { name: "Previous questions" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next questions" }));
  expect(screen.getByRole("article", { name: "Question 11" })).toHaveTextContent("Prompt 11");
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Next questions" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Apply import" }));
  expect(onApply.mock.calls[0][0].questions).toHaveLength(12);
});

it("retains bilingual assessment prompts and false answers in Arabic cards", async () => {
  render(<NextIntlClientProvider locale="ar" messages={ar}><ExcelImportDialog isOpen module="assessment" context={fixtureContext} disabled={false} onClose={vi.fn()} onApply={vi.fn()} /></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText("اختر ملف Excel"), { target: { files: [await workbookFile(await fixtureWorkbook("assessment"))] } });
  const card = await screen.findByRole("article", { name: "السؤال 1" });
  expect(within(card).getByText("هل ٢ زوجي؟")).toBeInTheDocument();
  expect(within(card).getByText("Is 2 even?")).toBeInTheDocument();
  expect(within(card).getByText(ar.academics.excelImport.labels.false)).toBeInTheDocument();
});
