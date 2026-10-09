import { describe, expect, it } from "vitest";
import { parseCsvPreview } from "./parseCsvPreview";

describe("CSV preview parsing", () => {
  it("parses quoted commas, escaped quotes, and CRLF rows", () => {
    expect(
      parseCsvPreview(
        'name,note\r\n"Ali, Omar","Said ""hello"""\r\nSara,Ready',
        {
          maxRows: 10,
          maxColumns: 10,
        },
      ),
    ).toEqual({
      rows: [
        ["name", "note"],
        ["Ali, Omar", 'Said "hello"'],
        ["Sara", "Ready"],
      ],
      truncated: false,
    });
  });

  it("caps rows and columns without evaluating cell content", () => {
    expect(
      parseCsvPreview("name,score,formula\nSara,10,=2+2\nOmar,9,=3+3", {
        maxRows: 2,
        maxColumns: 2,
      }),
    ).toEqual({
      rows: [
        ["name", "score"],
        ["Sara", "10"],
      ],
      truncated: true,
    });
  });
});
