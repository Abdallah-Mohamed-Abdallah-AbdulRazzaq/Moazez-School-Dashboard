import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DocumentViewerModal from "@/features/admissions/applications/components/modals/DocumentViewerModal";

describe("DocumentViewerModal", () => {
  it("renders authenticated blob image previews with a native image element", () => {
    render(
      <DocumentViewerModal
        isOpen
        onClose={vi.fn()}
        document={{
          type: "Passport",
          name: "passport.png",
          url: "blob:http://localhost:3000/image-preview",
          fileType: "image",
        }}
      />,
    );

    const preview = screen.getByAltText("passport.png");

    expect(preview.tagName.toLowerCase()).toBe("img");
    expect(preview).toHaveAttribute(
      "src",
      "blob:http://localhost:3000/image-preview",
    );
  });
});
