import { describe, expect, it } from "vitest";
import {
  filterTargetRecordsByParent,
  studentLabel,
} from "../ReinforcementTaskTargetSelector";

describe("filterTargetRecordsByParent", () => {
  const records = [
    { id: "grade-a", stageId: "stage-a", name: "Grade A" },
    { id: "grade-b", stageId: "stage-b", name: "Grade B" },
    { id: "grade-unknown", name: "Grade without relation" },
  ];

  it("keeps only children belonging to the selected parent", () => {
    expect(filterTargetRecordsByParent(records, "stage", "stage-a")).toEqual([
      records[0],
      records[2],
    ]);
  });

  it("returns all records when no parent has been selected", () => {
    expect(filterTargetRecordsByParent(records, "stage")).toEqual(records);
  });

  it("uses the Arabic student name for the Arabic locale", () => {
    expect(
      studentLabel(
        {
          id: "student-1",
          fullNameAr: "أحمد محمد",
          fullNameEn: "Ahmed Mohamed",
        },
        "ar",
      ),
    ).toBe("أحمد محمد");
  });
});
