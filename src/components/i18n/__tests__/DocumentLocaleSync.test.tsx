import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocumentLocaleSync from "@/components/i18n/DocumentLocaleSync";

describe("DocumentLocaleSync", () => {
  it("applies Arabic language and direction", async () => {
    render(<DocumentLocaleSync locale="ar" />);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ar");
      expect(document.documentElement.dir).toBe("rtl");
    });
  });

  it("applies English language and direction", async () => {
    render(<DocumentLocaleSync locale="en" />);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
      expect(document.documentElement.dir).toBe("ltr");
    });
  });
});
