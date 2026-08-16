"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import Select from "@/components/ui/input/Select";
import TimetableSlotSelect from "@/features/academics/lesson-plans/components/TimetableSlotSelect";
import { dashboardDaysForScope } from "@/features/academics/lesson-plans/services/lessonPlanTimetable";
import { getDashboardTimetable } from "@/features/academics/timetable/services/timetableApiAdapter";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  type Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import type {
  Student,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import { createHomeworkAssignment } from "@/features/academics/homework/services/homeworkService";
import type { CreateHomeworkAssignmentRequest } from "@/features/academics/homework/services/homeworkApi.types";
import { getHomeworkErrorMessage } from "@/features/academics/homework/services/homeworkErrors";
import { validateHomeworkAssignmentContract } from "@/features/academics/homework/utils/homeworkValidation";
import type { ValidationErrors } from "@/features/academics/curriculum/types/types";
import type { SelectOption } from "@/components/ui/input/Select";

interface AllocationSelectOption extends SelectOption {
  allocation: TeacherAllocation;
  teacherLabel: string;
  subjectLabel: string;
  classroomLabel: string;
  gradeId: string;
}

interface EligibleHomeworkStudent {
  id: string;
  name: string;
  studentNumber: string;
  enrollmentId: string;
}

function localizedName(
  locale: string,
  item?: { nameAr?: string; nameEn?: string; name?: string } | null,
) {
  if (!item) return "";
  return locale === "ar"
    ? item.nameAr || item.nameEn || item.name || ""
    : item.nameEn || item.nameAr || item.name || "";
}

function teacherNameForLocale(locale: string, teacher?: Teacher) {
  return locale === "ar"
    ? teacher?.nameAr || teacher?.nameEn || ""
    : teacher?.nameEn || teacher?.nameAr || "";
}

function allocationOptionSearchText(input: {
  allocation: TeacherAllocation;
  teacher?: Teacher;
  subject?: Subject;
  classroom?: StructureTree["classrooms"][number];
  section?: StructureTree["sections"][number];
  grade?: StructureTree["grades"][number];
}) {
  return [
    input.teacher?.nameAr,
    input.teacher?.nameEn,
    input.subject?.nameAr,
    input.subject?.nameEn,
    input.classroom?.nameAr,
    input.classroom?.nameEn,
    input.section?.nameAr,
    input.section?.nameEn,
    input.grade?.nameAr,
    input.grade?.nameEn,
    input.allocation.id,
  ]
    .filter(Boolean)
    .join(" ");
}

function studentNameForLocale(locale: string, student: Student) {
  return locale === "ar"
    ? student.full_name_ar || student.full_name_en || student.name || student.id
    : student.full_name_en ||
        student.full_name_ar ||
        student.name ||
        student.id;
}

function formatLocalDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDateOnly(dateOnlyValue?: string) {
  return dateOnlyValue ? new Date(`${dateOnlyValue}T00:00:00`) : null;
}

function isDateOnlyWithinRange(
  dateOnlyValue: string,
  startDate?: string,
  endDate?: string,
) {
  return Boolean(
    startDate &&
      endDate &&
      dateOnlyValue >= startDate &&
      dateOnlyValue <= endDate,
  );
}

function buildEligibleStudents(input: {
  enrollments: Array<StudentEnrollment & { id: string }>;
  students: Student[];
  classroomId?: string;
  locale: string;
}): EligibleHomeworkStudent[] {
  return input.enrollments
    .filter((enrollment) => enrollment.status === "active")
    .filter((enrollment) => enrollment.classroomId === input.classroomId)
    .map((enrollment) => {
      const student = input.students.find(
        (item) => item.id === enrollment.studentId,
      );
      return {
        id: enrollment.studentId,
        name: student
          ? studentNameForLocale(input.locale, student)
          : enrollment.studentId,
        studentNumber: student?.student_id || enrollment.studentId,
        enrollmentId: enrollment.enrollmentId || enrollment.id,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, input.locale));
}

function buildAllocationOptions(input: {
  allocations: TeacherAllocation[];
  teachers: Teacher[];
  subjects: Subject[];
  structure: StructureTree;
  locale: string;
}): AllocationSelectOption[] {
  return input.allocations
    .filter((allocation) => Boolean(allocation.teacherId))
    .map((allocation) => {
      const teacher = input.teachers.find(
        (item) => item.id === allocation.teacherId,
      );
      const subject = input.subjects.find(
        (item) => item.id === allocation.subjectId,
      );
      const classroom = input.structure.classrooms.find(
        (item) => item.id === allocation.classroomId,
      );
      const section = input.structure.sections.find(
        (item) => item.id === allocation.sectionId,
      );
      const grade = input.structure.grades.find(
        (item) => item.id === section?.gradeId,
      );
      const labelParts = [
        teacherNameForLocale(input.locale, teacher),
        localizedName(input.locale, subject),
        localizedName(input.locale, classroom) ||
          localizedName(input.locale, section),
      ].filter(Boolean);
      const teacherLabel = teacherNameForLocale(input.locale, teacher);
      const subjectLabel = localizedName(input.locale, subject);
      const classroomLabel =
        localizedName(input.locale, classroom) ||
        localizedName(input.locale, section);

      return {
        value: allocation.id,
        label: labelParts.length > 0 ? labelParts.join(" - ") : allocation.id,
        searchText: allocationOptionSearchText({
          allocation,
          teacher,
          subject,
          classroom,
          section,
          grade,
        }),
        allocation,
        teacherLabel,
        subjectLabel,
        classroomLabel,
        gradeId: grade?.id ?? "",
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, input.locale));
}

export default function CreateHomeworkPage() {
  const locale = useLocale();
  const t = useTranslations("academics.homework.create");
  const tHomeworkError = useTranslations("academics.homework.errorMessages");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId, selectedTerm, isInitializing } =
    useAcademicYearTermLayoutContext();
  const canManage = hasPermission("homework.assignments.manage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentErrors, setAssignmentErrors] = useState<ValidationErrors>({});
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
  const [isLoadingEligibleStudents, setIsLoadingEligibleStudents] =
    useState(false);
  const [availableTimetableDays, setAvailableTimetableDays] = useState<
    number[] | null
  >(null);
  const [allocationOptions, setAllocationOptions] = useState<
    AllocationSelectOption[]
  >([]);
  const [eligibleStudents, setEligibleStudents] = useState<
    EligibleHomeworkStudent[]
  >([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedTimetableDate, setSelectedTimetableDate] = useState<
    string | undefined
  >();
  const [draft, setDraft] = useState<CreateHomeworkAssignmentRequest>(() => ({
    academicYearId: academicYearId || "",
    termId: termId || "",
    teacherSubjectAllocationId: "",
    title: "",
    targetMode: "classroom",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    mode: "homework",
    isGraded: true,
    totalMarks: 10,
  }));

  const effectiveDraft = useMemo(
    () => ({
      ...draft,
      academicYearId: academicYearId || draft.academicYearId,
      termId: termId || draft.termId,
    }),
    [academicYearId, draft, termId],
  );

  const selectedAllocation = useMemo(
    () =>
      allocationOptions.find(
        (option) => option.value === draft.teacherSubjectAllocationId,
      ),
    [allocationOptions, draft.teacherSubjectAllocationId],
  );

  const timetableScope = useMemo(
    () => ({
      academicYearId: effectiveDraft.academicYearId,
      termId: effectiveDraft.termId,
      gradeId: selectedAllocation?.gradeId ?? "",
      sectionId: selectedAllocation?.allocation.sectionId ?? "",
      classroomId: selectedAllocation?.allocation.classroomId ?? "",
      teacherUserId: selectedAllocation?.allocation.teacherId ?? "",
      subjectId: selectedAllocation?.allocation.subjectId ?? "",
      teacherSubjectAllocationId: selectedAllocation?.allocation.id ?? "",
    }),
    [effectiveDraft.academicYearId, effectiveDraft.termId, selectedAllocation],
  );

  const filteredEligibleStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();
    if (!normalizedSearch) return eligibleStudents;
    return eligibleStudents.filter((student) =>
      `${student.name} ${student.studentNumber}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [eligibleStudents, studentSearch]);

  useEffect(() => {
    if (!academicYearId || !termId || !canManage || isInitializing) {
      void Promise.resolve().then(() => setAllocationOptions([]));
      return;
    }

    let isActive = true;
    const loadAllocationOptions = async () => {
      setIsLoadingAllocations(true);
      try {
        const [structure, subjects, teachers, allocations] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(),
          fetchTeachers(),
          fetchTeacherAllocations(termId),
        ]);

        if (!isActive) return;

        setAllocationOptions(
          buildAllocationOptions({
            allocations,
            teachers,
            subjects,
            structure,
            locale,
          }),
        );
      } catch {
        showError(t("errors.allocationsLoadFailed"));
      } finally {
        if (isActive) {
          setIsLoadingAllocations(false);
        }
      }
    };

    void loadAllocationOptions();

    return () => {
      isActive = false;
    };
  }, [academicYearId, canManage, isInitializing, locale, showError, t, termId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setEligibleStudents([]);
      setStudentSearch("");
      setDraft((current) => ({ ...current, studentIds: [] }));
    });

    if (!selectedAllocation || !effectiveDraft.academicYearId) {
      return;
    }

    let isActive = true;
    const loadEligibleStudents = async () => {
      setIsLoadingEligibleStudents(true);
      try {
        const [enrollments, students] = await Promise.all([
          fetchEnrollments({
            academicYearId: effectiveDraft.academicYearId,
            status: "active",
          }),
          fetchAllStudents(),
        ]);
        if (!isActive) return;
        setEligibleStudents(
          buildEligibleStudents({
            enrollments,
            students,
            classroomId: selectedAllocation.allocation.classroomId,
            locale,
          }),
        );
      } catch {
        showError(t("errors.studentsLoadFailed"));
      } finally {
        if (isActive) {
          setIsLoadingEligibleStudents(false);
        }
      }
    };

    void loadEligibleStudents();

    return () => {
      isActive = false;
    };
  }, [effectiveDraft.academicYearId, locale, selectedAllocation, showError, t]);

  useEffect(() => {
    let isActive = true;

    if (
      !selectedAllocation ||
      !timetableScope.academicYearId ||
      !timetableScope.termId ||
      !timetableScope.classroomId ||
      !timetableScope.subjectId
    ) {
      queueMicrotask(() => {
        if (isActive) setAvailableTimetableDays(null);
      });
      return () => {
        isActive = false;
      };
    }

    void getDashboardTimetable({
      termId: timetableScope.termId,
      classroomId: timetableScope.classroomId,
    })
      .then((response) => {
        if (isActive) {
          setAvailableTimetableDays(
            dashboardDaysForScope(response, timetableScope),
          );
        }
      })
      .catch(() => {
        if (isActive) {
          setAvailableTimetableDays([]);
          showError(t("messages.timetableSlotsLoadFailed"));
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedAllocation, showError, t, timetableScope]);

  const toggleSelectedStudent = (studentId: string) => {
    setDraft((current) => {
      const currentStudentIds = current.studentIds ?? [];
      const studentIds = currentStudentIds.includes(studentId)
        ? currentStudentIds.filter((id) => id !== studentId)
        : [...currentStudentIds, studentId];
      return { ...current, studentIds };
    });
  };

  const selectAllEligibleStudents = () => {
    setDraft((current) => ({
      ...current,
      studentIds: eligibleStudents.map((student) => student.id),
    }));
  };

  const clearSelectedStudents = () => {
    setDraft((current) => ({ ...current, studentIds: [] }));
  };

  const selectTimetableEntry = useCallback(
    (entry: BackendTimetableEntryDto | null) => {
      const timetableEntryId = entry?.id;
      setDraft((current) =>
        current.timetableEntryId === timetableEntryId &&
        current.scheduleDate ===
          (timetableEntryId ? selectedTimetableDate : undefined)
          ? current
          : {
              ...current,
              timetableEntryId,
              scheduleDate: timetableEntryId
                ? selectedTimetableDate
                : undefined,
            },
      );
    },
    [selectedTimetableDate],
  );

  const handleSubmit = async () => {
    if (!effectiveDraft.academicYearId || !effectiveDraft.termId) {
      showError(t("errors.contextRequired"));
      return;
    }
    if (!effectiveDraft.teacherSubjectAllocationId.trim()) {
      showError(t("errors.allocationRequired"));
      return;
    }
    const contractErrors = validateHomeworkAssignmentContract({
      title: effectiveDraft.title,
      description: effectiveDraft.description,
      dueAt: effectiveDraft.dueAt,
      publishAt: effectiveDraft.publishAt,
      isGraded: effectiveDraft.isGraded ?? false,
      totalMarks: effectiveDraft.totalMarks,
      estimatedMinutes: effectiveDraft.estimatedMinutes,
    }, tValidation);
    setAssignmentErrors(contractErrors);
    const firstContractError = Object.values(contractErrors).find(
      (error): error is string => typeof error === "string",
    );
    if (firstContractError) {
      showError(firstContractError);
      return;
    }
    if (
      effectiveDraft.scheduleDate &&
      !isDateOnlyWithinRange(
        effectiveDraft.scheduleDate,
        selectedTerm?.startDate,
        selectedTerm?.endDate,
      )
    ) {
      showError(t("errors.scheduleDateOutsideTerm"));
      return;
    }
    if (eligibleStudents.length === 0) {
      showError(t("errors.noEligibleStudents"));
      return;
    }
    if (
      effectiveDraft.targetMode === "selected_students" &&
      (effectiveDraft.studentIds ?? []).length === 0
    ) {
      showError(t("errors.selectedStudentsRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateHomeworkAssignmentRequest = {
        ...effectiveDraft,
        title: effectiveDraft.title.trim(),
        description: effectiveDraft.description?.trim() || undefined,
        studentIds:
          effectiveDraft.targetMode === "selected_students"
            ? effectiveDraft.studentIds
            : undefined,
        scheduleDate: effectiveDraft.timetableEntryId
          ? effectiveDraft.scheduleDate
          : undefined,
      };
      const created = await createHomeworkAssignment(payload);
      showSuccess(t("messages.created"));
      const params = new URLSearchParams(searchParams.toString());
      if (academicYearId) params.set("year", academicYearId);
      if (termId) params.set("term", termId);
      router.replace(
        `/${locale}/academics/homework/${created.id}?${params.toString()}`,
      );
    } catch (error) {
      showError(t("errors.createFailed", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="rounded-lg border border-border bg-white p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("sections.assignment")}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t("sections.assignmentDescription")}
              </p>
            </div>
            <Input
              label={t("fields.title")}
              required
              maxLength={180}
              error={assignmentErrors.titleEn}
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <Select
              label={t("fields.teacherSubjectAllocation")}
              required
              searchable
              value={draft.teacherSubjectAllocationId}
              onChange={(teacherSubjectAllocationId) => {
                setSelectedTimetableDate(undefined);
                setDraft((current) => ({
                  ...current,
                  teacherSubjectAllocationId,
                  studentIds: [],
                  scheduleDate: undefined,
                  timetableEntryId: undefined,
                }));
              }}
              options={allocationOptions}
              placeholder={t("placeholders.teacherSubjectAllocation")}
              searchPlaceholder={t("placeholders.searchAllocation")}
              noOptionsText={
                isLoadingAllocations
                  ? t("messages.loadingAllocations")
                  : t("messages.noAllocations")
              }
              noResultsText={t("messages.noAllocationResults")}
              disabled={
                isLoadingAllocations ||
                !effectiveDraft.academicYearId ||
                !effectiveDraft.termId
              }
              helperText={t("helpers.teacherSubjectAllocation")}
            />
            <Select
              label={t("fields.targetMode")}
              value={draft.targetMode}
              onChange={(targetMode) =>
                setDraft((current) => ({
                  ...current,
                  targetMode,
                  studentIds:
                    targetMode === "selected_students"
                      ? current.studentIds
                      : undefined,
                }))
              }
              options={[
                { value: "classroom", label: t("targetModes.classroom") },
                {
                  value: "selected_students",
                  label: t("targetModes.selectedStudents"),
                },
              ]}
            />
            <Select
              label={t("fields.mode")}
              value={draft.mode}
              onChange={(mode) => setDraft((current) => ({ ...current, mode }))}
              options={[
                { value: "homework", label: t("modes.homework") },
                { value: "worksheet", label: t("modes.worksheet") },
                { value: "writing_task", label: t("modes.writingTask") },
                { value: "quiz", label: t("modes.quiz") },
                { value: "reading", label: t("modes.reading") },
                { value: "project", label: t("modes.project") },
              ]}
            />
            <div className="md:col-span-2 border-t border-gray-200 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("sections.schedule")}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t("sections.scheduleDescription")}
              </p>
            </div>
            <DateTimePicker
              label={t("fields.dueAt")}
              error={assignmentErrors.dueDate}
              value={draft.dueAt ? new Date(draft.dueAt) : null}
              onChange={(date) =>
                setDraft((current) => ({
                  ...current,
                  dueAt: date?.toISOString() || "",
                }))
              }
              minDateTime={new Date()}
            />
            <DatePicker
              label={t("fields.scheduleDate")}
              value={parseLocalDateOnly(selectedTimetableDate)}
              onChange={(date) => {
                setSelectedTimetableDate(
                  date ? formatLocalDateOnly(date) : undefined,
                );
                setDraft((current) => ({
                  ...current,
                  scheduleDate: undefined,
                  timetableEntryId: undefined,
                }));
              }}
              helperText={
                !selectedAllocation
                  ? t("helpers.scheduleDate")
                  : availableTimetableDays === null
                    ? t("messages.loadingTimetableDays")
                    : availableTimetableDays.length === 0
                      ? t("messages.noTimetableDays")
                      : t("helpers.scheduleDate")
              }
              disabled={
                !selectedAllocation ||
                availableTimetableDays === null ||
                availableTimetableDays.length === 0
              }
              minDate={parseLocalDateOnly(selectedTerm?.startDate) ?? undefined}
              maxDate={parseLocalDateOnly(selectedTerm?.endDate) ?? undefined}
              shouldDisableDate={(date) =>
                !availableTimetableDays?.includes(date.getDay())
              }
            />
            {selectedAllocation && selectedTimetableDate && (
              <TimetableSlotSelect
                {...timetableScope}
                plannedDate={selectedTimetableDate}
                value={draft.timetableEntryId ?? ""}
                onChange={selectTimetableEntry}
                label={t("fields.timetableEntry")}
                emptyOptionLabel={t("placeholders.timetableEntry")}
                noSlotsMessage={t("messages.noTimetableSlots")}
                loadingMessage={t("messages.loadingTimetableSlots")}
                loadErrorMessage={t("messages.timetableSlotsLoadFailed")}
              />
            )}
            <div className="md:col-span-2 border-t border-gray-200 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("sections.grading")}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t("sections.gradingDescription")}
              </p>
            </div>
            <Input
              label={t("fields.totalMarks")}
              type="number"
              min={0.01}
              step={0.01}
              value={draft.totalMarks ?? ""}
              error={assignmentErrors.maxScore}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  totalMarks: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
            />
            <Input
              label={t("fields.estimatedMinutes")}
              type="number"
              min={1}
              step={1}
              value={draft.estimatedMinutes ?? ""}
              error={assignmentErrors.expectedTimeMinutes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  estimatedMinutes: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                }))
              }
            />
            <Input
              label={t("fields.description")}
              maxLength={4000}
              value={draft.description ?? ""}
              error={assignmentErrors.descriptionEn}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {t("sections.recipients")}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedAllocation
                    ? t("targets.classroomSummary", {
                        classroom:
                          selectedAllocation.classroomLabel ||
                          selectedAllocation.allocation.classroomId ||
                          t("targets.unknownClassroom"),
                        subject:
                          selectedAllocation.subjectLabel ||
                          t("targets.unknownSubject"),
                        teacher:
                          selectedAllocation.teacherLabel ||
                          t("targets.unknownTeacher"),
                      })
                    : t("targets.selectAllocationFirst")}
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                {isLoadingEligibleStudents
                  ? t("targets.loading")
                  : t("targets.eligibleCount", {
                      count: eligibleStudents.length,
                    })}
              </div>
            </div>

            {selectedAllocation &&
              eligibleStudents.length === 0 &&
              !isLoadingEligibleStudents && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t("targets.noEligibleStudents")}
                </div>
              )}

            {draft.targetMode === "selected_students" && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder={t("targets.searchStudents")}
                    disabled={eligibleStudents.length === 0}
                  />
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={selectAllEligibleStudents}
                      disabled={eligibleStudents.length === 0}
                    >
                      {t("targets.selectAll")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={clearSelectedStudents}
                      disabled={(draft.studentIds ?? []).length === 0}
                    >
                      {t("targets.clear")}
                    </Button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-white">
                  {filteredEligibleStudents.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {eligibleStudents.length === 0
                        ? t("targets.noStudents")
                        : t("targets.noStudentResults")}
                    </div>
                  ) : (
                    filteredEligibleStudents.map((student) => (
                      <label
                        key={student.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 last:border-border hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={(draft.studentIds ?? []).includes(
                            student.id,
                          )}
                          onChange={() => toggleSelectedStudent(student.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-gray-900">
                            {student.name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {student.studentNumber}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  {t("targets.selectedCount", {
                    count: (draft.studentIds ?? []).length,
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                const params = searchParams.toString();
                router.push(
                  `/${locale}/academics/homework${params ? `?${params}` : ""}`,
                );
              }}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button onClick={() => void handleSubmit()} loading={isSubmitting}>
              {t("actions.createDraft")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
