import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import GuardiansTab from "@/features/students-guardians/students/components/tabs/GuardiansTab";
import { renderWithPermissions } from "@/__tests__/test-utils/renderWithPermissions";

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiDelete: apiMocks.apiDelete,
  apiGet: apiMocks.apiGet,
  apiPatch: apiMocks.apiPatch,
  apiPost: apiMocks.apiPost,
}));

const guardian = {
  guardianId: "guardian-1",
  full_name: "Guardian One",
  relation: "father",
  phone_primary: "+201001112233",
  phone_secondary: null,
  email: "guardian@example.com",
  national_id: null,
  job_title: null,
  workplace: null,
  is_primary: false,
  can_pickup: false,
  can_receive_notifications: false,
};

describe("GuardiansTab", () => {
  it("edits whether an existing guardian link is primary", async () => {
    let isPrimary = false;
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.endsWith("/primary"))
        return Promise.resolve(
          isPrimary ? [{ ...guardian, is_primary: true }] : [],
        );
      return Promise.resolve([{ ...guardian, is_primary: isPrimary }]);
    });
    apiMocks.apiPatch.mockImplementation(() => {
      isPrimary = true;
      return Promise.resolve({ ...guardian, is_primary: true });
    });

    const user = userEvent.setup();
    renderWithPermissions(
      <ToastProvider>
        <GuardiansTab student={{ id: "student-1" } as never} />
      </ToastProvider>,
      ["students.guardians.manage"],
    );

    await user.click(await screen.findByRole("button", { name: "edit_link" }));
    await user.click(screen.getByRole("button", { name: "mark_as_primary" }));
    await user.click(screen.getByRole("button", { name: "can_pickup" }));
    await user.click(screen.getByRole("button", { name: "notifications" }));
    await user.click(screen.getByRole("button", { name: "save_link" }));

    await waitFor(() =>
      expect(apiMocks.apiPatch).toHaveBeenCalledWith(
        "/students-guardians/students/student-1/guardians/guardian-1",
        { is_primary: true },
      ),
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/students-guardians/guardians/guardian-1",
      { can_pickup: true, can_receive_notifications: true },
    );
    expect(
      await screen.findByText("Guardian One (father)"),
    ).toBeInTheDocument();
  });

  it("shows unlink failures in an error toast", async () => {
    apiMocks.apiGet.mockResolvedValue([{ ...guardian }]);
    apiMocks.apiDelete.mockRejectedValue(
      new Error("Unable to unlink guardian."),
    );

    const user = userEvent.setup();
    renderWithPermissions(
      <ToastProvider>
        <GuardiansTab student={{ id: "student-1" } as never} />
      </ToastProvider>,
      ["students.guardians.manage"],
    );

    await user.click(await screen.findByTitle("Unlink guardian from student"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to unlink guardian.",
    );
  });

  it("creates an account while adding a guardian", async () => {
    apiMocks.apiGet.mockResolvedValue([]);
    apiMocks.apiPost.mockImplementation((path: string) => {
      if (path === "/students-guardians/guardians") {
        return Promise.resolve({ guardianId: "guardian-new" });
      }
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    renderWithPermissions(
      <ToastProvider>
        <GuardiansTab student={{ id: "student-1" } as never} />
      </ToastProvider>,
      ["students.guardians.manage"],
    );

    await user.click(
      (await screen.findAllByRole("button", { name: "add_guardian" }))[0],
    );
    await user.type(
      screen.getByPlaceholderText("full_name_placeholder"),
      "Mohamed Hassan",
    );
    await user.type(
      screen.getByPlaceholderText("email_placeholder"),
      "parent@example.com",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "create_account" }),
    );
    await user.type(
      screen.getByLabelText("account_username"),
      "mohamed.hassan",
    );
    await user.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() =>
      expect(apiMocks.apiPost).toHaveBeenCalledWith(
        "/students-guardians/guardians/guardian-new/account",
        {
          mode: "create",
          username: "mohamed.hassan",
          contactEmail: "parent@example.com",
          temporaryPasswordMode: "generate",
        },
      ),
    );
  });
});
