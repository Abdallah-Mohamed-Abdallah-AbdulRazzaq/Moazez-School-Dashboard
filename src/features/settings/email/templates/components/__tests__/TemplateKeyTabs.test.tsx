import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TemplateKeyTabs from "../TemplateKeyTabs";

describe("TemplateKeyTabs", () => {
  it("locks template switching while an operation is pending", () => {
    render(
      <TemplateKeyTabs
        keys={["ACCOUNT_CREDENTIALS", "PASSWORD_RESET", "GENERAL_MESSAGE"]}
        selectedKey="ACCOUNT_CREDENTIALS"
        templatesByKey={new Map()}
        onSelect={vi.fn()}
        labels={{
          ACCOUNT_CREDENTIALS: "Account credentials",
          PASSWORD_RESET: "Password reset",
          GENERAL_MESSAGE: "General message",
        }}
        activeLabel="Active"
        inactiveLabel="Inactive"
        disabled
      />,
    );

    expect(screen.getByRole("button", { name: /Account credentials/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Password reset/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /General message/ })).toBeDisabled();
  });
});
