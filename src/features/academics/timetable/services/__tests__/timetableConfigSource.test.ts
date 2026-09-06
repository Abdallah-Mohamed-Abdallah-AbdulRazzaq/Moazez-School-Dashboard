import { describe, expect, it } from "vitest";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { getTimetableConfigSourceName } from "@/features/academics/timetable/services/timetableConfigSource";

const academicTree: StructureTree = {
  stages: [
    {
      id: "stage-1",
      name: "Primary",
      nameAr: "المرحلة الابتدائية",
      nameEn: "Primary",
      order: 1,
    },
  ],
  grades: [
    {
      id: "grade-1",
      name: "Grade 1",
      nameAr: "الصف الأول",
      nameEn: "Grade 1",
      stageId: "stage-1",
      capacity: 30,
      order: 1,
    },
  ],
  sections: [
    {
      id: "section-1",
      name: "A",
      nameAr: "أ",
      nameEn: "A",
      gradeId: "grade-1",
      capacity: 30,
      order: 1,
    },
  ],
  classrooms: [
    {
      id: "classroom-1",
      name: "1A",
      nameAr: "1أ",
      nameEn: "1A",
      sectionId: "section-1",
      capacity: 30,
      order: 1,
    },
  ],
};

describe("getTimetableConfigSourceName", () => {
  it.each([
    ["GRADE", "grade-1", "الصف الأول", "Grade 1"],
    ["SECTION", "section-1", "أ", "A"],
    ["CLASSROOM", "classroom-1", "1أ", "1A"],
  ] as const)(
    "uses the %s source id to show its exact name from the academic tree",
    (scope, id, arabicName, englishName) => {
      expect(
        getTimetableConfigSourceName({ scope, id }, academicTree, "ar"),
      ).toBe(arabicName);
      expect(
        getTimetableConfigSourceName({ scope, id }, academicTree, "en"),
      ).toBe(englishName);
    },
  );

  it("does not invent a source name when the timetable is term-scoped", () => {
    expect(
      getTimetableConfigSourceName({ scope: "TERM" }, academicTree, "ar"),
    ).toBeNull();
  });
});
