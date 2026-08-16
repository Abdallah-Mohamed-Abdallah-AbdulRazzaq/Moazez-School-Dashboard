import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TeacherFilterBar, { type TeacherFilterValues } from "../TeacherFilterBar";

const values: TeacherFilterValues = {
  search: "",
  employmentStatus: "",
  accountStatus: "",
  membershipStatus: "",
  gender: "",
  profileCompleteness: "",
};

const labels = {
  search: "Search",
  filters: "Filters",
  clear: "Clear",
  employment: "Employment",
  account: "Account",
  membership: "Membership",
  gender: "Gender",
  completeness: "Completeness",
  all: "All",
  active: "Active",
  inactive: "Inactive",
  terminated: "Terminated",
  invited: "Invited",
  suspended: "Suspended",
  disabled: "Disabled",
  transferred: "Transferred",
  male: "Male",
  female: "Female",
  complete: "Complete",
  incomplete: "Incomplete",
};

describe("TeacherFilterBar", () => {
  it("emits search and exact contract enum values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TeacherFilterBar values={values} showFilters onToggleFilters={vi.fn()} onChange={onChange} onClear={vi.fn()} labels={labels} />);

    await user.type(screen.getByPlaceholderText("Search"), "Nour");
    expect(onChange).toHaveBeenLastCalledWith("search", "r");

    await user.click(screen.getByLabelText("Employment"));
    await user.click(screen.getByRole("button", { name: "Terminated" }));
    expect(onChange).toHaveBeenCalledWith("employmentStatus", "TERMINATED");
  });

  it("delegates clearing all filters", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<TeacherFilterBar values={{ ...values, gender: "FEMALE" }} showFilters onToggleFilters={vi.fn()} onChange={vi.fn()} onClear={onClear} labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
