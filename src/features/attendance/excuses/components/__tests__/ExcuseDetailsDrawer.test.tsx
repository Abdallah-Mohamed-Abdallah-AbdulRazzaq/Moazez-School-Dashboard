import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExcuseDetailsDrawer from "../ExcuseDetailsDrawer";
import type { ExcuseRequest } from "../../types";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const request: ExcuseRequest = {
  id: "excuse-1",
  yearId: "year-1",
  termId: "term-1",
  studentId: "student-1",
  studentNameAr: "سارة علي",
  studentNameEn: "Sara Ali",
  scopeType: "SCHOOL",
  scopeIds: {},
  hasScopeContext: true,
  type: "ABSENCE",
  dateFrom: "2026-02-10",
  dateTo: "2026-02-10",
  reasonAr: "موعد طبي",
  reasonEn: "Medical appointment",
  attachments: [],
  status: "PENDING",
  createdAt: "2026-02-09T10:00:00.000Z",
  updatedAt: "2026-02-09T10:00:00.000Z",
};

describe("ExcuseDetailsDrawer", () => {
  it("allows editing a pending request without backend scope fields", () => {
    const onEdit = vi.fn();
    render(
      <ExcuseDetailsDrawer
        request={request}
        effectivePolicy={null}
        isReadOnly={false}
        canManageExcuses
        canReviewExcuses
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onEdit={onEdit}
      />,
    );

    const editButton = screen.getByRole("button", { name: "edit" });
    expect(editButton).toBeEnabled();
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(request);
  });
});
