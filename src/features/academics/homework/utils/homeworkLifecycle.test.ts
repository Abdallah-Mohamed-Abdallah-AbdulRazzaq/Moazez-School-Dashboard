import { describe, expect, it } from "vitest";
import { homeworkLifecycle } from "./homeworkLifecycle";

describe("homeworkLifecycle", () => {
  it.each([
    ["draft", true, ["publish", "cancel"]],
    ["published", false, ["close", "cancel"]],
    ["closed", false, []],
    ["cancelled", false, []],
    ["archived", false, []],
  ] as const)("maps %s to backend-valid actions", (status, isEditable, actions) => {
    expect(homeworkLifecycle(status)).toEqual({ isEditable, actions });
  });
});
