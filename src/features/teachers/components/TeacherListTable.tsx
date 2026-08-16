"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import { DropdownMenu } from "@/components/ui";
import TeacherCredentialIndicator from "./TeacherCredentialIndicator";
import TeacherProfileCompleteness from "./TeacherProfileCompleteness";
import TeacherStatusBadge from "./TeacherStatusBadge";
import type { TeacherDirectoryListItem } from "@/features/teachers/types/index";

type TeacherRow = TeacherDirectoryListItem & Record<string, unknown>;

interface TeacherListTableProps {
  teachers: TeacherDirectoryListItem[];
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  searchQuery: string;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (teacher: TeacherDirectoryListItem) => void;
  onEdit: (teacher: TeacherDirectoryListItem) => void;
  onDisableAccount: (teacher: TeacherDirectoryListItem) => void;
}

export default function TeacherListTable(props: TeacherListTableProps) {
  const t = useTranslations("teachers");
  const statusLabel = (status: string) => t(`statuses.${status.toLowerCase()}`);
  const credentialLabel = (status: string) =>
    t(`credentials.${status}`);

  const columns: Column<TeacherRow>[] = [
    {
      key: "displayName",
      label: t("columns.full_name"),
      sortable: false,
      searchable: true,
      render: (_, teacher) => (
        <div>
          <p className="font-semibold text-gray-900">{teacher.displayName.fullName}</p>
          <p className="text-xs text-gray-500">{teacher.loginEmail}</p>
        </div>
      ),
    },
    { key: "teacherCode", label: t("columns.code"), sortable: false, searchable: true, render: (value) => String(value ?? "—") },
    { key: "department", label: t("columns.department"), sortable: false, searchable: true, render: (value) => String(value ?? "—") },
    { key: "specialization", label: t("columns.specialization"), sortable: false, render: (value) => String(value ?? "—") },
    { key: "employmentStatus", label: t("columns.employment_status"), sortable: false, render: (_, teacher) => <TeacherStatusBadge status={teacher.employmentStatus} label={statusLabel(teacher.employmentStatus)} /> },
    { key: "accountStatus", label: t("columns.account_status"), sortable: false, render: (_, teacher) => <TeacherStatusBadge status={teacher.accountStatus} label={statusLabel(teacher.accountStatus)} /> },
    { key: "credentialSummary", label: t("columns.credentials"), sortable: false, render: (_, teacher) => <TeacherCredentialIndicator credential={teacher.credentialSummary} label={credentialLabel(teacher.credentialSummary.status)} /> },
    { key: "profileCompleteness", label: t("columns.completeness"), sortable: false, render: (_, teacher) => <TeacherProfileCompleteness completeness={teacher.profileCompleteness} completeLabel={t("completeness.complete")} incompleteLabel={t("completeness.incomplete")} /> },
    {
      key: "actions",
      label: t("columns.actions"),
      sortable: false,
      render: (_, teacher) => (
        <div data-row-action onClick={(event) => event.stopPropagation()}>
          <DropdownMenu
            trigger={<button type="button" aria-label={t("actions.open_menu")} className="rounded-lg p-2 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button>}
            items={[
              { label: t("actions.view_details"), value: "view", onClick: () => props.onView(teacher) },
              ...(props.canManage ? [{ label: t("actions.edit"), value: "edit", onClick: () => props.onEdit(teacher) }] : []),
              ...(props.canManage && teacher.employmentStatus === "ACTIVE" ? [{ label: t("actions.disable_account"), value: "disable-account", onClick: () => props.onDisableAccount(teacher) }] : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={props.teachers as TeacherRow[]}
      getRowKey={(teacher) => teacher.id}
      onRowClick={props.onView}
      isLoading={props.isLoading}
      searchQuery={props.searchQuery}
      showDensityToggle={false}
      serverPagination={{
        enabled: true,
        currentPage: props.page,
        pageSize: props.pageSize,
        totalItems: props.total,
        onPageChange: props.onPageChange,
        onPageSizeChange: props.onPageSizeChange,
      }}
    />
  );
}
