import { fireEvent, render, screen } from "@testing-library/react";
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
