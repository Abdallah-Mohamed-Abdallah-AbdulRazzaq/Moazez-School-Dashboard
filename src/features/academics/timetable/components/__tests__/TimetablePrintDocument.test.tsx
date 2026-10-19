import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import TimetablePrintDocument, {
  type TimetablePrintDocumentProps,
} from "../TimetablePrintDocument";
import { lessonTransferFixture } from "../../services/__tests__/fixtures/lessonTransferFixture";

const language = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useTranslations: (namespace: string) =>
      createTranslator({
        locale: language.locale,
        messages: language.locale === "ar" ? ar : en,
        namespace,
      }),
  };
});

function documentProps(): TimetablePrintDocumentProps {
  const fixture = lessonTransferFixture();
  return {
    locale: language.locale,
    schoolName: "School",
    logoUrl: "/logo.svg",
    contextName: "2026 / Term 1",
    configurationName: "Term schedule",
    scopeName: "Term",
    status: "Draft",
    printedAt: "17 October 2026",
    classrooms: fixture.classrooms.map((classroom) => ({
      id: classroom.id,
      label: classroom.nameEn,
    })),
    entries: fixture.entries,
    config: fixture.config,
    layout: "classroom",
    showTeachers: true,
    showRooms: true,
    subjects: [{ id: "math", nameAr: "الرياضيات", nameEn: "Math" }],
    teachers: [{ id: "teacher-1", nameAr: "أحمد", nameEn: "Ahmed" }],
    rooms: fixture.rooms,
  };
}

describe("printable timetable", () => {
  it("prints the saved subject name and a warning after subject deletion", () => {
    language.locale = "en";
    const props = documentProps();
    const savedLesson = props.entries.find((entry) => entry.subjectId)!;
    render(<TimetablePrintDocument {...props} subjects={[]} entries={[{
      ...savedLesson,
      subjectSnapshot: { id: savedLesson.subjectId!, nameAr: "اختبار", nameEn: "Deleted Test" },
    }]} />);
    expect(screen.getByText("Deleted Test")).toBeVisible();
    expect(screen.getByText("Deleted or unavailable subject")).toBeVisible();
  });
  it.each(["en", "ar"])(
    "prints each classroom with active days, times and localized lessons in %s",
    (locale) => {
      language.locale = locale;
      render(<TimetablePrintDocument {...documentProps()} />);
      expect(screen.getAllByRole("table")).toHaveLength(2);
      const first = screen.getByRole("region", { name: "Classroom 1" });
      expect(
        within(first).getByText(locale === "ar" ? "الرياضيات" : "Math"),
      ).toBeVisible();
      expect(
        within(first).getByText(locale === "ar" ? "أحمد" : "Ahmed"),
      ).toBeVisible();
      expect(within(first).getByText("8:00 AM - 8:45 AM")).toBeVisible();
      expect(
        within(first).queryByRole("columnheader", { name: /Friday|الجمعة/ }),
      ).not.toBeInTheDocument();
      expect(within(first).getByText("Draft")).toBeVisible();
      expect(within(first).queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it("omits optional teacher and room details without hiding subjects or break periods", () => {
    language.locale = "en";
    render(
      <TimetablePrintDocument
        {...documentProps()}
        showTeachers={false}
        showRooms={false}
        layout="compact"
      />,
    );
    expect(screen.getByText("Math")).toBeVisible();
    expect(screen.queryByText("Ahmed")).not.toBeInTheDocument();
    expect(screen.queryByText("Room: Room 1")).not.toBeInTheDocument();
    expect(screen.getAllByRole("rowheader", { name: "Break" })).toHaveLength(2);
  });
});
