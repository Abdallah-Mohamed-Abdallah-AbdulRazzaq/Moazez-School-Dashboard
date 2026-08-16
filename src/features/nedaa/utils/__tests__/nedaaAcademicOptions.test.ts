import { describe, expect, it } from "vitest";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  getNedaaAcademicOptions,
  reconcileNedaaAcademicSelection,
} from "../nedaaAcademicOptions";

const tree: StructureTree = {
  stages: [
    {
      id: "stage-2",
      name: "Secondary",
      nameAr: "ثانوي",
      nameEn: "Secondary",
      order: 2,
    },
    {
      id: "stage-1",
      name: "Primary",
      nameAr: "ابتدائي",
      nameEn: "Primary",
      order: 1,
    },
  ],
  grades: [
    {
      id: "grade-2",
      name: "Grade 7",
      nameAr: "الصف السابع",
      nameEn: "Grade 7",
      stageId: "stage-2",
      capacity: 30,
      order: 1,
    },
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
      id: "section-2",
      name: "Section B",
      nameAr: "شعبة ب",
      nameEn: "Section B",
      gradeId: "grade-2",
      capacity: 30,
      order: 1,
    },
    {
      id: "section-1",
      name: "Section A",
      nameAr: "شعبة أ",
      nameEn: "Section A",
      gradeId: "grade-1",
      capacity: 30,
      order: 1,
    },
  ],
  classrooms: [
    {
      id: "room-2",
      name: "Room 2",
      nameAr: "فصل ٢",
      nameEn: "Room 2",
      sectionId: "section-2",
      capacity: 30,
      order: 1,
    },
    {
      id: "room-1",
      name: "Room 1",
      nameAr: "فصل ١",
      nameEn: "Room 1",
      sectionId: "section-1",
      capacity: 30,
      order: 1,
    },
  ],
};

describe("getNedaaAcademicOptions", () => {
  it("limits descendants to the selected parent branch", () => {
    const options = getNedaaAcademicOptions(
      tree,
      {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "",
      },
      "en",
    );

    expect(options.stages.map(({ value }) => value)).toEqual([
      "stage-1",
      "stage-2",
    ]);
    expect(options.grades.map(({ value }) => value)).toEqual(["grade-1"]);
    expect(options.sections.map(({ value }) => value)).toEqual(["section-1"]);
    expect(options.classrooms.map(({ value }) => value)).toEqual(["room-1"]);
  });

  it("uses Arabic labels for the Arabic locale", () => {
    const options = getNedaaAcademicOptions(
      tree,
      { stageId: "", gradeId: "", sectionId: "", classroomId: "" },
      "ar",
    );
    expect(options.stages[0].label).toBe("ابتدائي");
  });
});

describe("reconcileNedaaAcademicSelection", () => {
  it("clears descendants outside the selected parent branch", () => {
    expect(
      reconcileNedaaAcademicSelection(tree, {
        stageId: "stage-2",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "room-1",
      }),
    ).toEqual({
      stageId: "stage-2",
      gradeId: "",
      sectionId: "",
      classroomId: "",
    });
  });
});
