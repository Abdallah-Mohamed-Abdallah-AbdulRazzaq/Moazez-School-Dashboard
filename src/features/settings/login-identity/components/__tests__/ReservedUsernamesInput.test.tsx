import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ReservedUsernamesInput from "../ReservedUsernamesInput";

function Harness() {
  const [values, setValues] = useState(["admin"]);
  return (
    <ReservedUsernamesInput
      label="Reserved usernames"
      helperText="Add usernames"
      placeholder="Type a username"
      values={values}
      onChange={setValues}
    />
  );
}

describe("ReservedUsernamesInput", () => {
  it("normalizes and deduplicates reserved usernames", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText("Reserved usernames");
    await user.type(input, "Admin, support{Enter}");

    expect(screen.getAllByText("admin")).toHaveLength(1);
    expect(screen.getByText("support")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Remove admin" })).not.toBeInTheDocument();
    expect(screen.getByText("support")).toBeInTheDocument();
  });
});
