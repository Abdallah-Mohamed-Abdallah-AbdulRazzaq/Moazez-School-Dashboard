import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CommunicationEntitySelect from "../CommunicationEntitySelect";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("CommunicationEntitySelect", () => {
  it("waits for the user to open the source selector before loading options", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([
      { id: "announcement-1", label: "School announcement" },
    ]);

    render(
      <CommunicationEntitySelect
        label="Source"
        search={search}
        onChange={vi.fn()}
      />,
    );

    expect(search).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Source" }));

    expect(search).toHaveBeenCalledOnce();
    expect(search).toHaveBeenCalledWith("");
    expect(
      await screen.findByRole("button", { name: "School announcement" }),
    ).toBeInTheDocument();
  });
});
