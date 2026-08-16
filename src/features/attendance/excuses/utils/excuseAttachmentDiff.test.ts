import { describe, expect, it } from "vitest";
import { getNewAttachmentFileIds } from "./excuseAttachmentDiff";

describe("getNewAttachmentFileIds", () => {
  it("returns only unique files that were not already linked", () => {
    expect(
      getNewAttachmentFileIds(
        [
          { id: "existing", name: "old.pdf", size: 1, type: "application/pdf" },
          { id: "new", name: "new.pdf", size: 1, type: "application/pdf" },
          { id: "new", name: "new.pdf", size: 1, type: "application/pdf" },
        ],
        [{ id: "existing", name: "old.pdf", size: 1, type: "application/pdf" }],
      ),
    ).toEqual(["new"]);
  });
});
