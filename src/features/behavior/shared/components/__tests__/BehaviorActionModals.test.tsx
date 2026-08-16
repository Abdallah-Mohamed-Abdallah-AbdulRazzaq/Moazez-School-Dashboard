import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BehaviorActionModals from "../BehaviorActionModals";
import { updateBehaviorRecord } from "@/features/behavior/services/behaviorApiService";
import type { BehaviorCategory, BehaviorRecord } from "@/features/behavior/types";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

vi.mock("@/features/behavior/services/behaviorApiService", () => ({
  createBehaviorCategory: vi.fn(),
  updateBehaviorCategory: vi.fn(),
  listBehaviorCategories: vi.fn().mockResolvedValue({ items: [] }),
  updateBehaviorRecord: vi.fn(),
}));

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchAllStudents: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/behavior/shared/hooks/useBehaviorYearTermContext", () => ({
  useBehaviorYearTermContext: () => ({
    terms: [{ id: "term-1", startDate: "2026-01-01", endDate: "2026-06-30" }],
  }),
}));

describe("BehaviorActionModals", () => {
  it("keeps identity fields editable and offers critical severity", () => {
    const category: BehaviorCategory & { inUse: boolean } = {
      id: "category-1",
      code: "CONDUCT",
      descriptionEn: null,
      descriptionAr: null,
      nameEn: "Conduct",
      nameAr: "السلوك",
      type: "positive",
      defaultSeverity: "high",
      defaultPoints: 5,
      isActive: true,
      sortOrder: 10,
      inUse: true,
    };

    render(
      <BehaviorActionModals
        mode="edit-category"
        target={{ category }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/category\.code/)).toBeEnabled();
    expect(screen.getByLabelText("category.type")).toBeEnabled();

    fireEvent.click(screen.getByLabelText("category.severity"));
    expect(screen.getByRole("button", { name: "Critical" })).toBeInTheDocument();
  });

  it("allows a category-less draft to be edited", async () => {
    const record: BehaviorRecord = {
      id: "record-1",
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      enrollmentId: null,
      categoryId: null,
      category: null,
      term: null,
      enrollment: null,
      type: "negative",
      severity: "medium",
      status: "draft",
      points: -3,
      noteEn: "Needs follow-up",
      occurredAt: "2026-03-01T10:00:00.000Z",
    };

    render(
      <BehaviorActionModals
        mode="edit-record"
        target={{ record }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "modal.save" }));

    await waitFor(() => {
      expect(updateBehaviorRecord).toHaveBeenCalledWith(
        "record-1",
        expect.objectContaining({ noteEn: "Needs follow-up" }),
      );
    });
  });
});
