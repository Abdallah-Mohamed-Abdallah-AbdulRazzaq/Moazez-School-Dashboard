"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import Select from "@/components/ui/input/Select";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { ClipboardList, ChevronDown, FileSpreadsheet, PencilLine } from "lucide-react";
import HomeworkCreationBar from "../components/HomeworkCreationBar";
import HomeworkImportBatchPanel from "../components/HomeworkImportBatchPanel";
import type { HomeworkBatchDraftValidation, HomeworkBatchPageState } from "../utils/homeworkImportBatch.types";
import { useHomeworkCreateQuestions } from "../hooks/useHomeworkCreateQuestions";
import HomeworkQuestionAuthoringPanel from "../components/HomeworkQuestionAuthoringPanel";
import HomeworkDraftIssues from "../components/HomeworkDraftIssues";
import { prepareHomeworkDraftQuestions, validateHomeworkQuestionDraft } from "../utils/homeworkQuestionDraftValidation";
import type { HomeworkDraftIssue, HomeworkDraftValidationContext, HomeworkQuestionDraft } from "../utils/homeworkQuestionDraft.types";
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
import { createHomeworkWithQuestions, HomeworkQuestionSaveError } from "../services/homeworkExcelImportSave";
import { validateHomeworkImportDraft } from "../utils/homeworkExcelImport";
import ExcelImportActions from "@/features/academics/shared/excel-import/ExcelImportActions";
import { ImportIssues } from "@/features/academics/shared/excel-import/ExcelImportPreview";
import { useImportNavigation } from "@/features/academics/shared/excel-import/useImportNavigation";
import { uncertainImportCreation } from "@/features/academics/shared/excel-import/importSaveErrors";
import type { ImportedDraft, ImportIssue } from "@/features/academics/shared/excel-import/types";
import type { CreateHomeworkAssignmentRequest } from "@/features/academics/homework/services/homeworkApi.types";
import {
  getHomeworkApiValidationErrors,
  getHomeworkErrorMessage,
} from "@/features/academics/homework/services/homeworkErrors";
import { validateHomeworkAssignmentContract } from "@/features/academics/homework/utils/homeworkValidation";
import type { ValidationErrors } from "@/features/academics/curriculum/types/types";
import type { SelectOption } from "@/components/ui/input/Select";

interface AllocationSelectOption extends SelectOption {
  allocation: TeacherAllocation;
  teacherLabel: string;
  subjectLabel: string;
  classroomLabel: string;
  stageId: string;
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
        stageId: grade?.stageId ?? "",
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
  const tImport = useTranslations("academics.excelImport");
  const tBatch = useTranslations("academics.homework.importBatch");
  const tManual = useTranslations("academics.homework.manual");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId, selectedTerm, termStatus, isInitializing } =
    useAcademicYearTermLayoutContext();
  const canManage = hasPermission("homework.assignments.manage");
  const canView = hasPermission("homework.assignments.view");
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [batchState, setBatchState] = useState<HomeworkBatchPageState>({ hasStarted: false, isSaving: false, allCreated: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentErrors, setAssignmentErrors] = useState<ValidationErrors>({});
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [manualIssues, setManualIssues] = useState<HomeworkDraftIssue[]>([]);
  const [partialImport, setPartialImport] = useState<HomeworkQuestionSaveError | null>(null);
  const submissionLock = useRef(false);
  const creationContext = useRef({ year: "", term: "" });
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
  const importContext = { now: new Date(), termStart: selectedTerm?.startDate ?? "", termEnd: selectedTerm?.endDate ?? "", publishAt: draft.publishAt };
  const canImport = canManage && termStatus !== "closed" && Boolean(selectedTerm);
  const contentLocked = !canImport || isSubmitting || Boolean(partialImport) || batchState.hasStarted || batchState.isSaving;
  const authoring = useHomeworkCreateQuestions({ locked: contentLocked, onExcelAccepted: imported => {
    setImportIssues([]); setManualIssues([]); setAssignmentErrors({});
    const { title, description, mode, dueAt, isGraded, totalMarks, estimatedMinutes } = imported.metadata;
    setDraft(current => ({ ...current, title, description, mode, dueAt, isGraded, totalMarks, estimatedMinutes }));
  } });
  const pendingImport = authoring.content.kind === "excel" ? authoring.content.imported : null;
  const questions = authoring.content.kind === "manual" ? authoring.content.questions : pendingImport?.questions ?? [];
  const { title, description, mode, dueAt, isGraded, totalMarks, estimatedMinutes } = effectiveDraft;
  const questionDraft: HomeworkQuestionDraft = { metadata: { title, description, mode, dueAt, isGraded, totalMarks, estimatedMinutes }, questions };
  const manualValidation = authoring.content.kind === "manual" && questions.length ? validateHomeworkQuestionDraft(questionDraft, importContext) : null;
  const { clearDirty, guardedNavigate } = useImportNavigation({ key: "homework-excel-import", questionCount: batchEnabled && batchState.allCreated ? 0 : questions.length });
  const updateBatchState = useCallback((state: HomeworkBatchPageState) => {
    if (state.allCreated) clearDirty();
    setBatchState(state);
  }, [clearDirty]);
  const resetBatchImport = () => {
    if (isSubmitting || batchState.isSaving || partialImport) return;
    authoring.reset(); setImportIssues([]); setManualIssues([]); setBatchEnabled(false);
    setBatchState({ hasStarted: false, isSaving: false, allCreated: false });
  };
  const validateContentDraft = (candidate: HomeworkQuestionDraft, context: HomeworkDraftValidationContext): HomeworkBatchDraftValidation => {
    if (pendingImport) {
      const checked = validateHomeworkImportDraft({ ...pendingImport, ...candidate }, context);
      return checked.kind === "valid" ? { kind: "valid" } : { kind: "invalid", origin: "excel", issues: checked.issues };
    }
    const checked = validateHomeworkQuestionDraft(candidate, context);
    const issues = checked.kind === "invalid" ? checked.issues : [];
    setManualIssues(issues);
    const firstQuestion = issues.find(issue => issue.scope === "question");
    if (firstQuestion?.scope === "question") { authoring.setEditorOpen(true); authoring.selectQuestion(firstQuestion.questionId); }
    return checked.kind === "valid" ? { kind: "valid" } : { kind: "invalid", origin: "manual", issues: checked.issues };
  };
  const applyImport = (imported: ImportedDraft) => {
    if (imported.module !== "assignment") return;
    authoring.requestExcelImport(imported);
  };
  const openImportedDraft = (id: string) => {
    clearDirty();
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", creationContext.current.year);
    params.set("term", creationContext.current.term);
    router.replace(`/${locale}/academics/homework/${id}?${params}`);
  };

  const timetableScope = useMemo(
    () => ({
      academicYearId: effectiveDraft.academicYearId,
      termId: effectiveDraft.termId,
      stageId: selectedAllocation?.stageId ?? "",
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
    if (batchEnabled) return;
    if (!canManage || submissionLock.current || partialImport) return;
    if (questions.length) {
      const checked = validateContentDraft(questionDraft, { ...importContext, now: new Date() });
      setImportIssues(checked.kind === "invalid" && checked.origin === "excel" ? checked.issues : []);
      if (checked.kind === "invalid") return;
      const selectedIds = effectiveDraft.studentIds ?? [];
      const validStudents = effectiveDraft.targetMode !== "selected_students" || (selectedIds.length > 0 && selectedIds.length <= 500 && new Set(selectedIds).size === selectedIds.length && selectedIds.every((id) => eligibleStudents.some((student) => student.id === id)));
      if (!canImport || !selectedAllocation || !validStudents) { showError(tImport("errors.context")); return; }
    }
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

    submissionLock.current = true;
    creationContext.current = { year: academicYearId, term: termId };
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
      const frozenQuestions = prepareHomeworkDraftQuestions(structuredClone(questions));
      const created = frozenQuestions.length ? await createHomeworkWithQuestions({ assignment: payload, questions: frozenQuestions }) : await createHomeworkAssignment(payload);
      showSuccess(t("messages.created"));
      if (questions.length) { openImportedDraft(created.id); return; }
      const params = new URLSearchParams(searchParams.toString());
      if (academicYearId) params.set("year", academicYearId);
      if (termId) params.set("term", termId);
      router.replace(
        `/${locale}/academics/homework/${created.id}?${params.toString()}`,
      );
    } catch (error) {
      if (questions.length && error instanceof HomeworkQuestionSaveError) { setPartialImport(error); return; }
      const apiValidationErrors = getHomeworkApiValidationErrors(error, tValidation);
      if (Object.keys(apiValidationErrors).length > 0) {
        setAssignmentErrors(apiValidationErrors);
      }
      showError(questions.length && uncertainImportCreation(error) ? (pendingImport ? tImport("messages.unknownCreation") : tManual("unknownCreation")) : t("errors.createFailed", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  const cancelCreation = () => guardedNavigate(() => {
    const params = searchParams.toString();
    router.push(`/${locale}/academics/homework${params ? `?${params}` : ""}`);
  });

  if (isInitializing && !batchState.hasStarted && !batchState.isSaving) {
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
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ClipboardList size={26} aria-hidden="true" /></span>
            <div><h1 className="text-2xl font-semibold text-gray-900">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">{t("description")}</p></div>
          </div>

          <Checkbox label={tBatch("toggle")} description={!canView ? tBatch("permission") : !canImport ? tManual("unavailable") : tBatch("toggleHelp")} checked={batchEnabled} onChange={event => {
            setBatchEnabled(event.target.checked);
            if (event.target.checked && authoring.content.kind === "none") authoring.requestManualAuthoring();
          }} disabled={!canView || contentLocked} className="bg-white" />
          <div className="space-y-6">
          <details open={!batchState.hasStarted} className="group min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-base font-semibold text-gray-900 sm:p-6 [&::-webkit-details-marker]:hidden">
              <span>{tBatch("assignmentDetails")}{batchState.hasStarted && <span className="mt-1 block text-sm font-normal text-gray-600">{draft.title}</span>}</span>
              <ChevronDown size={20} aria-hidden="true" className="shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-gray-100 p-5 sm:p-6">
          {/* Unlayered form styles must not expand controls beyond their grid columns. */}
          <fieldset disabled={isSubmitting || Boolean(partialImport) || batchState.hasStarted || batchState.isSaving} className={`grid min-w-0 gap-5 [&>div]:min-w-0 [&_input]:box-border! [&_input]:min-w-0! [&_input]:max-w-full! [&_[aria-haspopup=listbox]]:box-border! [&_[aria-haspopup=listbox]]:min-w-0! [&_[aria-haspopup=listbox]]:max-w-full! md:grid-cols-2`}>
            <div className="md:col-span-2">
              <p className="mt-1 text-sm text-gray-600">
                {batchEnabled ? tBatch("detailsHelp") : t("sections.assignmentDescription")}
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
            {!batchEnabled && <Select
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
            />}
            {!batchEnabled && <Select
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
            />}
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
                {batchEnabled ? tBatch("dueHelp") : t("sections.scheduleDescription")}
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
            {!batchEnabled && <DatePicker
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
            />}
            {!batchEnabled && <div
              className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800"
              role="note"
            >
              {t("helpers.timetablePublicationRequired")}
            </div>}
            {!batchEnabled && selectedAllocation && selectedTimetableDate && (
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
          </fieldset>

          {!batchEnabled && <fieldset disabled={isSubmitting || Boolean(partialImport)} className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                  <div className="min-w-0 flex-1">
                    <Input
                      aria-label={t("targets.searchStudents")}
                      className="box-border!"
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder={t("targets.searchStudents")}
                      disabled={eligibleStudents.length === 0}
                    />
                  </div>
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
          </fieldset>}
            </div>
          </details>

          <div className="space-y-3">
          <p className="flex items-center gap-2 text-base font-semibold text-gray-900"><FileSpreadsheet size={18} className="text-primary" aria-hidden="true" />{tManual("contentTitle")}</p>
          <div className="[&>div]:my-0 [&>div]:rounded-xl [&>div]:border-primary-100 [&>div]:bg-primary-50/40 [&>div]:p-5 [&_button]:min-h-11 [&_button]:text-sm">
          <ExcelImportActions module="assignment" context={importContext} pendingImport={pendingImport && { ...pendingImport, metadata: effectiveDraft }} disabled={contentLocked} onApply={applyImport} onRemove={resetBatchImport} leadingActions={<Button variant="secondary" disabled={contentLocked} leftIcon={<PencilLine size={16} />} onClick={authoring.requestManualAuthoring}>{tManual("entry")}</Button>} />
          </div>

          </div>
          <ConfirmDialog isOpen={authoring.pendingReplacement !== null} onClose={authoring.cancelReplacement} onConfirm={authoring.acceptReplacement} title={tManual("replaceTitle")} description={tManual("replaceDescription")} confirmLabel={tManual("replace")} cancelLabel={tManual("cancel")} severity="warning" loading={contentLocked} />
          <HomeworkQuestionAuthoringPanel authoring={authoring} locked={contentLocked} issues={manualIssues} />
          {manualValidation?.kind === "valid" && manualValidation.warnings.map((warning, index) => <p key={index} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{tManual("marksMismatch", warning.values)}</p>)}
          {importIssues.length > 0 && <ImportIssues issues={importIssues} />}
          {!batchEnabled && manualIssues.length > 0 && <HomeworkDraftIssues issues={manualIssues} questions={questions} />}
          {partialImport && <div role="alert" className="mb-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm">{pendingImport ? tImport("messages.partialSave", { saved: partialImport.failedQuestionIndex, total: questions.length }) : tManual("partialSave", { saved: partialImport.failedQuestionIndex, total: questions.length })}</p>
            <Button variant="secondary" onClick={() => openImportedDraft(partialImport.homeworkId)}>{tImport("actions.openDraft")}</Button>
          </div>}

          {batchEnabled && <HomeworkImportBatchPanel questionDraft={questionDraft} origin={authoring.content.kind} validateDraft={validateContentDraft} publishAt={draft.publishAt} academicYearId={academicYearId || ""} termId={termId || ""} termStart={selectedTerm?.startDate ?? ""} termEnd={selectedTerm?.endDate ?? ""} writable={canImport && canView && Boolean(academicYearId && termId)} initialSubjectId={selectedAllocation?.allocation.subjectId} initialClassroomId={selectedAllocation?.allocation.classroomId} onStateChange={updateBatchState} onReset={resetBatchImport} onCancel={cancelCreation} />}
          </div>

          {!batchEnabled && <HomeworkCreationBar questionCount={questions.length} points={questions.reduce((sum, question) => sum + Math.round(question.points * 100), 0) / 100} classCount={selectedAllocation && eligibleStudents.length ? 1 : 0} help={questions.length ? undefined : tManual("optionalHelp")}>
            <Button
              variant="secondary"
              onClick={cancelCreation}
              disabled={isSubmitting || batchState.isSaving}
            >
              {t("actions.cancel")}
            </Button>
            <Button onClick={() => void handleSubmit()} loading={isSubmitting} disabled={Boolean(partialImport) || Boolean(questions.length && !canImport)}>
              {t("actions.createDraft")}
            </Button>
          </HomeworkCreationBar>}
        </div>
      </div>
    </div>
  );
}
