import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import TemporaryPasswordRevealModal from "../TemporaryPasswordRevealModal";

const labels = {
  title: "Temporary password",
  warning: "This password will not be shown again.",
  noPassword: "No password",
  copy: "Copy",
  copied: "Copied",
  close: "Close",
  user: "User",
  password: "Password",
  show: "Show",
  hide: "Hide",
};

function RevealHarness() {
  const [credentials, setCredentials] = useState([
    { userId: "u1", temporaryPassword: "one-time-secret", mustChangePassword: true },
  ]);

  return (
    <TemporaryPasswordRevealModal
      isOpen={credentials.length > 0}
      credentials={credentials}
      labels={labels}
      onClose={() => setCredentials([])}
    />
  );
}

describe("TemporaryPasswordRevealModal Sprint 11 behavior", () => {
  it("does not persist temporary passwords and removes them from UI on close", async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    render(<RevealHarness />);

    expect(screen.getByText("one-time-secret")).toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem("temporaryPassword")).toBeNull();
    expect(sessionStorage.getItem("temporaryPassword")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("one-time-secret")).not.toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
