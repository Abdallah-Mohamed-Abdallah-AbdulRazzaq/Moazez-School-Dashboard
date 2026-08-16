import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExcuseModal from "../ExcuseModal";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

describe("ExcuseModal", () => {
  it("hides attachments when the correction endpoint does not support them", () => {
    render(
      <ExcuseModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        attachmentMode="UNSUPPORTED"
        isReadOnly={false}
      />,
    );

    expect(screen.getByText("reason")).toBeInTheDocument();
    expect(screen.queryByText("attachments")).not.toBeInTheDocument();
  });
});
