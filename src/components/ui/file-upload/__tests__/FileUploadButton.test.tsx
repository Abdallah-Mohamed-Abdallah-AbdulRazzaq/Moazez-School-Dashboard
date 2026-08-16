import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FileUploadButton from "../FileUploadButton";

describe("FileUploadButton", () => {
  it("uses the caller size error formatter", async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();
    render(
      <FileUploadButton
        buttonLabel="Upload image"
        maxSizeBytes={4}
        formatSizeError={() => "Localized size error"}
        onFilesSelected={onFilesSelected}
      />,
    );

    await user.upload(
      screen.getByLabelText("Upload image"),
      new File(["oversized"], "large.png", { type: "image/png" }),
    );

    expect(screen.getByText("Localized size error")).toBeInTheDocument();
    expect(onFilesSelected).not.toHaveBeenCalled();
  });
});
