import { describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import CreateConversationDialog, {
  getConversationTypeOptions,
  shouldShowConversationSelector,
} from "@/features/communication/components/conversations/CreateConversationDialog";
import type {
  CreateConversationDialogLabels,
  CreateConversationDialogProps,
} from "@/features/communication/components/conversations/CreateConversationDialog";
import { createConversation } from "../utils/test-data-generators";

vi.mock("@/features/communication/api/communication-selectors.service", () => ({
  searchAcademicYears: vi.fn().mockResolvedValue([]),
  searchTerms: vi.fn().mockResolvedValue([]),
  searchStages: vi.fn().mockResolvedValue([]),
  searchGrades: vi.fn().mockResolvedValue([]),
  searchSections: vi.fn().mockResolvedValue([]),
  searchClassrooms: vi.fn().mockResolvedValue([]),
  searchSubjects: vi.fn().mockResolvedValue([]),
}));

const labels: CreateConversationDialogLabels = {
  createTitle: "Create Conversation",
  editTitle: "Edit Conversation",
  title: "Title",
  type: "Type",
  description: "Description",
  academicYearId: "Academic year",
  termId: "Term",
  stageId: "Stage",
  gradeId: "Grade",
  sectionId: "Section",
  classroomId: "Classroom",
  subjectId: "Subject",
  avatarFileId: "Avatar",
  isReadOnly: "Read only",
  isPinned: "Pinned",
  group: "Group Option",
  classroom: "Classroom Option",
  direct: "Direct Option",
  directUnavailable:
    "Direct conversations cannot be started here yet. Existing direct conversations remain available.",
  grade: "Grade Option",
  section: "Section Option",
  stage: "Stage Option",
  schoolWide: "School-wide Option",
  support: "Support Option",
  system: "System Option",
  cancel: "Cancel",
  create: "Create",
  save: "Save",
  titleRequired: "Enter a title.",
  errorScopeInvalid: "Communication scope is invalid.",
  errorValidationFailed: "Request validation failed.",
  errorGeneric: "Something went wrong. Please try again.",
};

describe("CreateConversationDialog helpers", () => {
  it("omits direct creation because no recipient workflow is exposed", () => {
    expect(getConversationTypeOptions(labels).map((option) => option.value)).toEqual([
      "group",
      "classroom",
      "grade",
      "section",
      "stage",
      "school_wide",
      "support",
      "system",
    ]);
  });

  it("shows only the selectors that match the selected conversation type", () => {
    expect(shouldShowConversationSelector("stage", "stageId")).toBe(true);
    expect(shouldShowConversationSelector("stage", "gradeId")).toBe(false);
    expect(shouldShowConversationSelector("section", "gradeId")).toBe(true);
    expect(shouldShowConversationSelector("section", "sectionId")).toBe(true);
    expect(shouldShowConversationSelector("school_wide", "academicYearId")).toBe(
      false,
    );
  });
});

describe("CreateConversationDialog component validation", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  const defaultProps: CreateConversationDialogProps = {
    open: true,
    labels: {
      ...labels,
      classroomRequired: "Select a classroom.",
    },
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it("shows validation error when title exceeds 255 characters", async () => {
    const onSubmit = vi.fn();
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const inputs = screen.getAllByRole("textbox");
    const titleInput = inputs[0];
    fireEvent.change(titleInput, { target: { value: "a".repeat(256) } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Title must be 255 characters or less.")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("explains why direct conversation creation is unavailable", () => {
    render(React.createElement(CreateConversationDialog, defaultProps));

    expect(screen.getByText(labels.directUnavailable)).toBeInTheDocument();
  });

  it("preserves the type when editing an existing direct conversation", () => {
    render(
      React.createElement(CreateConversationDialog, {
        ...defaultProps,
        conversation: createConversation({
          id: "direct-conversation",
          title: "Existing direct conversation",
          type: "direct",
        }),
      }),
    );

    const typeSelect = screen.getByRole("button", { name: labels.type });
    expect(typeSelect).toBeDisabled();
    expect(typeSelect).toHaveTextContent(labels.direct);
    expect(screen.queryByText(labels.directUnavailable)).not.toBeInTheDocument();
  });

  it("shows validation error when description exceeds 4000 characters", async () => {
    const onSubmit = vi.fn();
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const inputs = screen.getAllByRole("textbox");
    const descInput = inputs[1];
    fireEvent.change(descInput, { target: { value: "a".repeat(4001) } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Description must be 4000 characters or less.")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when classroom type is selected but classroomId is missing", async () => {
    const onSubmit = vi.fn();
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const typeSelect = screen.getByRole("button", { name: labels.type });
    fireEvent.click(typeSelect);
    const classroomOption = await screen.findByText("Classroom Option");
    fireEvent.click(classroomOption);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test Title" } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Select a classroom.")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when stage type is selected but stageId is missing", async () => {
    const onSubmit = vi.fn();
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const typeSelect = screen.getByRole("button", { name: labels.type });
    fireEvent.click(typeSelect);
    const stageOption = await screen.findByText("Stage Option");
    fireEvent.click(stageOption);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test Title" } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Communication scope is invalid.")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when grade type is selected but gradeId is missing", async () => {
    const onSubmit = vi.fn();
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const typeSelect = screen.getByRole("button", { name: labels.type });
    fireEvent.click(typeSelect);
    const gradeOption = await screen.findByText("Grade Option");
    fireEvent.click(gradeOption);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test Title" } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Communication scope is invalid.")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when section type is selected but sectionId is missing", async () => {
    const onSubmit = vi.fn();
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const typeSelect = screen.getByRole("button", { name: labels.type });
    fireEvent.click(typeSelect);
    const sectionOption = await screen.findByText("Section Option");
    fireEvent.click(sectionOption);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test Title" } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Communication scope is invalid.")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("displays backend validation errors inline", async () => {
    const mockBackendError = {
      response: {
        status: 422,
        data: {
          error: {
            code: "validation.failed",
            message: "Request validation failed.",
            details: {
              fields: {
                title: ["Title has invalid format"],
                description: ["Description contains bad words"],
              },
            },
          },
        },
      },
    };

    const onSubmit = vi.fn().mockRejectedValue(mockBackendError);
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test Title" } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Title has invalid format/i)).toBeInTheDocument();
      expect(screen.getByText(/Description contains bad words/i)).toBeInTheDocument();
      expect(screen.getByText(/Request validation failed/i)).toBeInTheDocument();
    });
  });

  it("displays backend scope errors inline", async () => {
    const mockBackendError = {
      response: {
        status: 422,
        data: {
          error: {
            code: "communication.scope.invalid",
            message: "Communication scope is invalid.",
            details: {
              field: "classroomId",
            },
          },
        },
      },
    };

    const onSubmit = vi.fn().mockRejectedValue(mockBackendError);
    render(React.createElement(CreateConversationDialog, { ...defaultProps, onSubmit }));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test Title" } });

    const submitBtn = screen.getByRole("button", { name: labels.create });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Communication scope is invalid/i).length).toBeGreaterThan(0);
    });
  });
});
