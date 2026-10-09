import { describe, expect, it } from "vitest";
import { academicContentTypeHref } from "../overviewRoutes";

describe("academic content type routes", () => {
  it("opens online sessions in their dedicated list", () => {
    expect(
      academicContentTypeHref({
        locale: "en",
        contentType: "ONLINE_SESSION",
        yearId: "year-1",
        termId: "term-1",
      }),
    ).toBe("/en/academic-content-hub/online-sessions?year=year-1&term=term-1");
  });

  it("opens general resources in their dedicated list", () => {
    expect(
      academicContentTypeHref({
        locale: "ar",
        contentType: "GENERAL_RESOURCE",
        yearId: "year-1",
        termId: "term-1",
      }),
    ).toBe(
      "/ar/academic-content-hub/general-resources?year=year-1&term=term-1",
    );
  });
});
