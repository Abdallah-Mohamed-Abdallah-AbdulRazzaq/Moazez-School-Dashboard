import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import RoleEditorModal from "../RoleEditorModal";

function RoleEditorHarness() {
  const [, setFieldError] = useState<string | null>(null);

  return (
    <RoleEditorModal
      isOpen
      mode="clone"
      sourceRoleName="Administrator"
      errors={{}}
      onFieldChange={(field) => setFieldError(field)}
      onClose={vi.fn()}
      onSubmit={vi.fn().mockResolvedValue(undefined)}
    />
  );
}

describe("RoleEditorModal", () => {
  it("keeps typed values when the parent updates field state", async () => {
    const user = userEvent.setup();
    render(<RoleEditorHarness />);

    const nameInput = screen.getByLabelText("role_name");
    await user.click(nameInput);
    await user.type(nameInput, "-Updated");

    expect(nameInput).toHaveValue("Administrator Copy-Updated");
  });
});
