import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import EventDialog from "../EventDialog";
import type { AcademicEvent } from "../../services/calendarService";

const intlMock = vi.hoisted(() => ({
  locale: "en",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => intlMock.locale,
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(
    () => new Promise(() => undefined)
  ),
}));

describe("EventDialog", () => {
  beforeEach(() => {
    intlMock.locale = "en";
  });

  const existingEvent: AcademicEvent = {
    id: "e1",
    termId: "t1",
    title: "Event",
    type: "OTHER",
    allDay: true,
    startDate: "2024-01-01",
    endDate: "2024-01-01",
    scopeType: "SCHOOL",
    createdAt: "2024-01-01T00:00:00Z",
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    event: null,
    academicYearId: "y1",
    termId: "t1",
    prefilledDate: null,
    isReadOnly: false,
    stages: [],
    grades: [
      {
        id: "grade-1",
        name: "Grade 1",
        nameAr: "الصف الأول",
        nameEn: "Grade 1",
      },
    ],
    sections: [],
  };

  const renderComponent = (props = {}) => {
    return render(
      <EventDialog {...defaultProps} {...props} />
    );
  };

  it("Read-only disables create/update/delete", () => {
    renderComponent({ isReadOnly: true, event: existingEvent });
    // Save button should not be present
    expect(screen.queryByText("save")).not.toBeInTheDocument();
    // Delete button should not be present
    expect(screen.queryByText("delete")).not.toBeInTheDocument();
  });

  it("Create event renders Add Event", () => {
    renderComponent();
    expect(screen.getByText("add_event")).toBeInTheDocument();
  });

  it("localizes the selected scope target label for Arabic", async () => {
    intlMock.locale = "ar";
    renderComponent({
      event: {
        ...existingEvent,
        scopeType: "GRADE",
        scopeId: "grade-1",
      },
    });

    expect(await screen.findByText("الصف الأول")).toBeInTheDocument();
  });

  it("shows separate description and notes fields when editing", async () => {
    renderComponent({
      event: {
        ...existingEvent,
        description: "Public event details",
        notes: "Internal planning notes",
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("description (optional)")).toHaveValue(
        "Public event details",
      );
      expect(screen.getByLabelText("notes (optional)")).toHaveValue(
        "Internal planning notes",
      );
    });
  });
});
