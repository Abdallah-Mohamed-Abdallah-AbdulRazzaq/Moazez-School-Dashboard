import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStudents } from "@/features/students-guardians/students/services/studentsApiService";
import SelectedStudentsPicker, {
  type SelectedCredentialStudent,
} from "../SelectedStudentsPicker";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock(
  "@/features/students-guardians/students/services/studentsApiService",
  () => ({ fetchStudents: vi.fn() }),
);

const studentId = "00000000-0000-4000-8000-000000000001";

function Harness() {
  const [selected, setSelected] = useState<SelectedCredentialStudent[]>([]);
  return <SelectedStudentsPicker selected={selected} onChange={setSelected} />;
}

describe("SelectedStudentsPicker", () => {
  beforeEach(() => {
    vi.mocked(fetchStudents).mockReset().mockResolvedValue([
      {
        id: studentId,
        student_id: "ST-001",
        full_name_en: "Ali Hassan",
        full_name_ar: "علي حسن",
      } as never,
    ]);
  });

  it("searches through the existing students API and retains selected labels", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Students" }));
    await user.type(screen.getByPlaceholderText("Search students..."), "Ali");

    await waitFor(() =>
      expect(fetchStudents).toHaveBeenLastCalledWith({ search: "Ali" }),
    );
    await user.click(await screen.findByRole("button", { name: "Ali Hassan" }));

    expect(screen.getByText("Ali Hassan")).toBeInTheDocument();
    expect(screen.getByText("ST-001")).toBeInTheDocument();
    expect(screen.getAllByText("1 selected")).toHaveLength(1);
  });

  it("prevents duplicates and removes a retained student with the shared button", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Students" }));
    await user.click(await screen.findByRole("button", { name: "Ali Hassan" }));
    await user.click(screen.getByRole("button", { name: "Students" }));
    await user.click(await screen.findByRole("button", { name: "Ali Hassan" }));

    expect(screen.getAllByText("Ali Hassan")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Remove Ali Hassan" }));
    expect(screen.queryByText("Ali Hassan")).not.toBeInTheDocument();
  });
});
