import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BehaviorCategoriesPage from "../BehaviorCategoriesPage";
import {
  listBehaviorCategories,
  deleteBehaviorCategory,
} from "@/features/behavior/services/behaviorApiService";
import type { ModalProps } from "@/components/ui/modal/Modal";
import type { BehaviorCategoryListResponse } from "@/features/behavior/types";

const mockT = vi.fn((key: string) => key);
// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => mockT,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/behavior/categories",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock behavior year context
const mockContext = {
  isReadOnly: false,
  academicYears: [],
  terms: [],
  yearId: "year-1",
  termId: "term-1",
  termStatus: "open" as const,
  isLoading: false,
  error: null,
  setYearId: vi.fn(),
  setTermId: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("@/features/behavior/shared/hooks/useBehaviorYearTermContext", () => ({
  useBehaviorYearTermContext: () => mockContext,
}));

let canManageCategories = true;
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      activeMembership: {
        permissions: canManageCategories ? ["behavior.categories.manage"] : [],
      },
    },
    isLoading: false,
  }),
}));

// Mock toast
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

// Mock api service
vi.mock("@/features/behavior/services/behaviorApiService", () => ({
  listBehaviorCategories: vi.fn(),
  deleteBehaviorCategory: vi.fn(),
}));

// Mock Modal component
vi.mock("@/components/ui/modal/Modal", () => ({
  __esModule: true,
  default: ({ isOpen, title, description, footer, children }: ModalProps) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-modal">
        <h3>{title}</h3>
        <p>{description}</p>
        <div>{children}</div>
        <div>{footer}</div>
      </div>
    );
  },
}));

const mockCategories = [
  {
    id: "cat-1",
    code: "RULE_1",
    nameEn: "Respect Others",
    nameAr: "احترام الآخرين",
    type: "positive",
    defaultSeverity: "low",
    defaultPoints: 5,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "cat-2",
    code: "RULE_2",
    nameEn: "Disruption",
    nameAr: "المقاطعة",
    type: "negative",
    defaultSeverity: "medium",
    defaultPoints: -10,
    isActive: true,
    sortOrder: 2,
  },
];

describe("BehaviorCategoriesPage - Category Deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.isReadOnly = false;
    canManageCategories = true;
    vi.mocked(listBehaviorCategories).mockResolvedValue({
      items: mockCategories,
      total: 2,
    } as unknown as BehaviorCategoryListResponse);
  });

  it("keeps the table visible when there are no categories", async () => {
    vi.mocked(listBehaviorCategories).mockResolvedValue({
      items: [],
      total: 0,
    } as unknown as BehaviorCategoryListResponse);

    render(<BehaviorCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText("no_data_available")).toBeInTheDocument();
    });

    expect(screen.getByText("category.code")).toBeInTheDocument();
  });

  it("falls back to the available category name when the localized name is null", async () => {
    const response: BehaviorCategoryListResponse = {
      items: [{
        ...mockCategories[0],
        nameEn: null,
        nameAr: "السلوك",
        descriptionEn: null,
        descriptionAr: null,
      }],
      total: 1,
    };
    vi.mocked(listBehaviorCategories).mockResolvedValue(response);

    render(<BehaviorCategoriesPage />);

    expect(await screen.findByText("السلوك")).toBeInTheDocument();
  });

  it("renders delete buttons for active categories if not read-only", async () => {
    render(<BehaviorCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText("Respect Others")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("actions.delete");
    expect(deleteButtons).toHaveLength(2);
  });

  it("does not render delete buttons if read-only is true", async () => {
    mockContext.isReadOnly = true;
    render(<BehaviorCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText("Respect Others")).toBeInTheDocument();
    });

    const deleteButtons = screen.queryAllByText("actions.delete");
    expect(deleteButtons).toHaveLength(0);
  });

  it("does not render category actions without the backend manage permission", async () => {
    canManageCategories = false;
    render(<BehaviorCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText("Respect Others")).toBeInTheDocument();
    });

    expect(screen.queryAllByText("actions.delete")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "actions.newCategory" })).not.toBeInTheDocument();
  });

  it("opens confirmation modal when delete is clicked and calls delete api on confirm", async () => {
    vi.mocked(deleteBehaviorCategory).mockResolvedValue(undefined);

    render(<BehaviorCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText("Respect Others")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("actions.delete");
    fireEvent.click(deleteButtons[0]);

    // Check modal is open
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    expect(screen.getByText("modal.deleteCategory")).toBeInTheDocument();
    expect(screen.getByText("modal.confirmDeleteCategory")).toBeInTheDocument();

    // Confirm deletion
    const modal = screen.getByTestId("mock-modal");
    const confirmButton = within(modal).getByRole("button", { name: "actions.delete" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteBehaviorCategory).toHaveBeenCalledWith("cat-1");
      expect(mockShowSuccess).toHaveBeenCalledWith("messages.categoryDeleted");
    });
  });

  it("handles conflict error (category in use) and displays categoryInUse toast", async () => {
    const apiError = {
      code: "behavior.category.in_use",
      message: "Category is in use",
    };
    vi.mocked(deleteBehaviorCategory).mockRejectedValue(apiError);

    render(<BehaviorCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText("Respect Others")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("actions.delete");
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    const modal = screen.getByTestId("mock-modal");
    const confirmButton = within(modal).getByRole("button", { name: "actions.delete" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteBehaviorCategory).toHaveBeenCalledWith("cat-1");
      expect(mockShowError).toHaveBeenCalledWith("errors.categoryInUse");
    });
  });
});
