// FILE: src/components/students-guardians/StudentsList.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useDebounce } from "use-debounce";
import {
  Users,
  UserCheck,
  Search,
  X,
  Eye,
  Edit,
  MessageSquare,
  Download,
  Plus,
  Upload,
  Lock,
} from "lucide-react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterPanel,
  Input,
  Select,
} from "@/components/ui";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import {
  Student,
  StudentStatus,
} from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import {
  getStudentDisplayName,
  getStatusColor,
} from "@/features/students-guardians/students/utils/studentUtils";
import AddNoteModal, {
  NoteFormData,
} from "@/features/students-guardians/students/components/modals/AddNoteModal";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import StudentAccountLinkModal from "@/features/students-guardians/students/components/StudentAccountLinkModal";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatStudentsForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function StudentsList() {
  const t = useTranslations("students_guardians.students");
  const locale = useLocale();
  const router = useRouter();
  const permissions = usePermissions();
  const { hasPermission } = permissions;
  const canManageAccounts = hasPermission("settings.users.manage");
  const { canManageNotes } = getStudentsGuardiansCapabilities(permissions);
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [students, setStudents] = useState<Student[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [accountLinkStudent, setAccountLinkStudent] = useState<Student | null>(
    null,
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const {
    values: queryValues,
    setValue,
    reset,
  } = useUrlQueryState<{
    search: string;
    status: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const searchQuery = queryValues.search;
  const statusFilter = queryValues.status as StudentStatus | "all";
  const dateRange = queryValues.dateRange as DateRangeValue;
  const customStartDate = queryValues.startDate;
  const customEndDate = queryValues.endDate;
  const [debouncedSearch] = useDebounce(searchQuery, 300);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsPageLoading(true);
      setPageError(null);

      try {
        const data = await studentsService.fetchAllStudents({
          ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        });
        if (!isCancelled) {
          setStudents(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setPageError(
            error instanceof Error ? error.message : t("loading_error"),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsPageLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, statusFilter, t]);

  // Filter students
  const filteredStudents = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return students.filter((student) => {
      const matchesDateRange = isDateInRange(
        student.created_at ?? student.submittedDate,
        filterResult,
      );

      return matchesDateRange;
    });
  }, [students, dateRange, customStartDate, customEndDate]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    const studentsInRange = students.filter((s) =>
      isDateInRange(s.created_at ?? s.submittedDate, filterResult),
    );

    const total = studentsInRange.length;
    const active = studentsInRange.filter((s) => s.status === "Active").length;
    const suspended = studentsInRange.filter(
      (s) => s.status === "Suspended",
    ).length;
    const withdrawn = studentsInRange.filter(
      (s) => s.status === "Withdrawn",
    ).length;

    return { total, active, suspended, withdrawn };
  }, [students, dateRange, customStartDate, customEndDate]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleAddNote = async (noteData: NoteFormData) => {
    if (!canManageNotes || !selectedStudent) return;

    try {
      await studentsService.createStudentNote(selectedStudent.id, {
        category: noteData.category,
        note: noteData.note,
        visibility: noteData.visibility,
      });
      setShowAddNoteModal(false);
      setSelectedStudent(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : t("loading_error"));
    }
  };

  const handleAddNoteClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    if (!canManageNotes) return;
    setSelectedStudent(student);
    setShowAddNoteModal(true);
  };

  const handleAccountLinkClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    if (!canManageAccounts) {
      setPageError(t("account_linking.manage_required"));
      return;
    }
    setAccountLinkStudent(student);
  };

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );
    const formattedData = formatStudentsForExport(
      filteredStudents as unknown as Student[],
      exportLocale,
    );

    downloadStudentsGuardiansExport({
      data: formattedData,
      format,
      filenameBase: "students",
      emptyMessage: t("no_students"),
    });
  };

  const handleBulkUploadClick = () => {
    setPageError("Bulk upload is not available yet.");
  };

  const getStatusBadge = (status: StudentStatus) => {
    const statusKey = status.toLowerCase() as
      "active" | "withdrawn" | "suspended";
    const statusDisplay = t(`status.${statusKey}`);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
      >
        {statusDisplay}
      </span>
    );
  };

  const columns = [
    {
      key: "name",
      label: t("columns.name"),
      searchable: true,
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as Student & {
          full_name_en?: string;
          studentName?: string;
          full_name_ar?: string;
          studentNameArabic?: string;
        };
        return locale === "ar"
          ? student.full_name_ar ||
              student.studentNameArabic ||
              student.full_name_en ||
              student.studentName ||
              getStudentDisplayName(student as Student)
          : student.full_name_en ||
              student.studentName ||
              student.full_name_ar ||
              getStudentDisplayName(student as Student);
      },
    },
    {
      key: "dateOfBirth",
      label: t("columns.date_of_birth"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const student = row as unknown as Student;
        const dateOfBirth = student.dateOfBirth || student.date_of_birth || "";
        const grade = dateOfBirth;
        // Translate grade if it's in "Grade X" format
        if (dateOfBirth && dateOfBirth.startsWith("Grade ")) {
          const gradeNumber = dateOfBirth.replace("Grade ", "");
          return locale === "ar" ? `الصف ${gradeNumber}` : grade;
        }
        return dateOfBirth || t("columns.na");
      },
    },
    {
      key: "gender",
      label: t("columns.gender"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        return (row as unknown as Student).gender || t("columns.na");
      },
    },
    {
      key: "nationality",
      label: t("columns.nationality"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        return (row as unknown as Student).nationality || t("columns.na");
      },
    },
    {
      key: "contact",
      label: t("columns.contact"),
      render: (_: unknown, row: { [key: string]: unknown }) => {
        const contact = (row as unknown as Student).contact;
        return (
          contact.student_phone || contact.student_email || t("columns.na")
        );
      },
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (value: unknown) =>
        getStatusBadge(value as "Active" | "Withdrawn" | "Suspended"),
    },
    {
      key: "actions",
      label: t("columns.actions"),
      sortable: false,
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/${lang}/students-guardians/students/${(row as unknown as Student).id}`,
              );
            }}
            className="p-1.5 text-primary"
            title={t("actions.view_profile")}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/${lang}/students-guardians/students/${(row as unknown as Student).id}`,
              );
            }}
            className="p-1.5 text-gray-600"
            title={t("actions.edit")}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) =>
              handleAccountLinkClick(e, row as unknown as Student)
            }
            className={`p-1.5 ${canManageAccounts ? "text-gray-600" : "text-gray-400"}`}
            title={t("actions.link_account")}
            disabled={!canManageAccounts}
          >
            <Lock className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => handleAddNoteClick(e, row as unknown as Student)}
            className={`p-1.5 ${canManageNotes ? "text-gray-600" : "text-gray-400"}`}
            title={t("actions.add_note")}
            disabled={!canManageNotes}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleRowClick = (student: { [key: string]: unknown }) => {
    router.push(
      `/${lang}/students-guardians/students/${(student as unknown as Student).id}`,
    );
  };

  if (pageError && students.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-sm text-red-600">
            {pageError || t("loading_error")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <KPICardV2
          title={
            dateRange === "all"
              ? t("kpis.total_students")
              : t("kpis.students_period", {
                  period:
                    dateRange === "custom"
                      ? t("kpis.custom")
                      : `${dateRange} ${t("kpis.days")}`,
                })
          }
          value={kpis.total}
          subtitle={t("kpis.active_count", { count: kpis.active })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("kpis.active_students")}
          value={kpis.active}
          subtitle={t("kpis.currently_enrolled")}
          icon={UserCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowExportModal(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleBulkUploadClick}
            disabled
            title="Not available yet"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {t("bulk_upload_button")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push(`/${lang}/students-guardians/registration`)
            }
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("add_student")}
          </Button>
        </div>
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
        clearAction={null}
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-[200px] max-w-md flex-1">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => {
                  setValue("search", e.target.value, "replace");
                }}
                leftIcon={<Search className="w-4 h-4" />}
                className={
                  searchQuery ? "border-primary ring-2 ring-primary/20" : ""
                }
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="danger"
                onClick={clearFilters}
                leftIcon={<X className="w-4 h-4" />}
              >
                {t("clear")}
              </Button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Select
              label={t("filter_labels.status")}
              value={statusFilter}
              onChange={(value) => {
                setValue("status", value as StudentStatus | "all", "push");
              }}
              options={[
                { value: "all", label: t("filter_options.all_statuses") },
                { value: "Active", label: t("status.active") },
                { value: "Withdrawn", label: t("status.withdrawn") },
                { value: "Suspended", label: t("status.suspended") },
              ]}
            />
          </div>
        }
      />

      {/* Table */}
      {!isPageLoading && filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_students")}
            action={
              hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  {t("clear_filters")}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={
            filteredStudents as unknown as Array<{ [key: string]: unknown }>
          }
          isLoading={isPageLoading}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          virtualize={true}
          urlState={{
            keyPrefix: "studentsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Add Note Modal */}
      {selectedStudent && (
        <AddNoteModal
          isOpen={showAddNoteModal}
          onClose={() => {
            setShowAddNoteModal(false);
            setSelectedStudent(null);
          }}
          onSubmit={handleAddNote}
          studentName={(() => {
            const studentWithNames = selectedStudent as unknown as Student & {
              full_name_en?: string;
              studentName?: string;
              full_name_ar?: string;
              studentNameArabic?: string;
            };
            return locale === "ar"
              ? studentWithNames.full_name_ar ||
                  studentWithNames.studentNameArabic ||
                  studentWithNames.full_name_en ||
                  studentWithNames.studentName ||
                  getStudentDisplayName(selectedStudent)
              : studentWithNames.full_name_en ||
                  studentWithNames.studentName ||
                  studentWithNames.full_name_ar ||
                  getStudentDisplayName(selectedStudent);
          })()}
        />
      )}

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("subtitle")}
        datasetCount={filteredStudents.length}
        emptyStateMessage={t("no_students")}
      />
      <StudentAccountLinkModal
        isOpen={Boolean(accountLinkStudent)}
        student={accountLinkStudent}
        onClose={() => setAccountLinkStudent(null)}
      />
    </div>
  );
}
