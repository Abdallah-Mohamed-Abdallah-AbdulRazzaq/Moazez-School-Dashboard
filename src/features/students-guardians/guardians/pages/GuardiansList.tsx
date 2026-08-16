// FILE: src/components/students-guardians/GuardiansList.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import { useRouter, useParams } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  Search,
  X,
  Eye,
  Edit,
  Plus,
  Download,
  Star,
  CheckCircle,
  XCircle,
  Lock,
} from "lucide-react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterPanel,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { StudentGuardian } from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import AddGuardianModal, {
  type GuardianFormData,
} from "@/features/students-guardians/students/components/modals/AddGuardianModal";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import GuardianAccountLinkModal from "@/features/students-guardians/guardians/components/GuardianAccountLinkModal";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatGuardiansForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

const guardianRelationOptions = ["father", "mother", "guardian", "other"];

export default function GuardiansList() {
  const t = useTranslations("students_guardians.guardians_list");
  const locale = useLocale();
  const router = useRouter();
  const permissions = usePermissions();
  const { canLinkGuardianAccount, canManageGuardians } =
    getStudentsGuardiansCapabilities(permissions);
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [accountLinkGuardian, setAccountLinkGuardian] =
    useState<StudentGuardian | null>(null);
  const [showCreateGuardianModal, setShowCreateGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] =
    useState<StudentGuardian | null>(null);
  const [editGuardianForm, setEditGuardianForm] = useState({
    full_name: "",
    relation: "",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    national_id: "",
    job_title: "",
    workplace: "",
    is_primary: false,
    can_pickup: false,
    can_receive_notifications: false,
  });
  const [isSavingGuardian, setIsSavingGuardian] = useState(false);
  const [editGuardianError, setEditGuardianError] = useState<string | null>(
    null,
  );
  const { values, setValue, reset } = useUrlQueryState<{
    search: string;
    relation: string;
  }>({
    defaults: {
      search: "",
      relation: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const searchQuery = values.search;
  const relationFilter = values.relation;
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
        const guardiansData = await studentsService.fetchAllGuardians({
          ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
          ...(relationFilter !== "all" ? { relation: relationFilter } : {}),
        });

        if (!isCancelled) {
          setGuardians(guardiansData);
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
  }, [debouncedSearch, relationFilter, t]);

  const filteredGuardians = guardians;

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = guardians.length;
    const primary = guardians.filter((g) => g.is_primary).length;
    const canPickup = guardians.filter((g) => g.can_pickup).length;
    const receiveNotifications = guardians.filter(
      (g) => g.can_receive_notifications,
    ).length;

    return { total, primary, canPickup, receiveNotifications };
  }, [guardians]);

  const hasActiveFilters = searchQuery !== "" || relationFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const getRelationBadge = (relation: string) => {
    const colors: Record<string, string> = {
      father: "bg-blue-100 text-blue-700",
      mother: "bg-pink-100 text-pink-700",
      guardian: "bg-purple-100 text-purple-700",
      other: "bg-gray-100 text-gray-700",
    };

    const relationLower = relation.toLowerCase();

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[relationLower] || colors.other}`}
      >
        {relation.charAt(0).toUpperCase() + relation.slice(1)}
      </span>
    );
  };

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data: formatGuardiansForExport(filteredGuardians, exportLocale),
      format,
      filenameBase: "guardians",
      emptyMessage: t("no_guardians_message"),
    });
  };

  const handleCreateGuardian = async (guardianData: GuardianFormData) => {
    if (!canManageGuardians) {
      return;
    }

    try {
      setPageError(null);
      const { selectedStudents, ...guardianFields } = guardianData;
      const payload = {
        ...guardianFields,
        phone_primary: guardianFields.phone_primary ?? undefined,
        phone_secondary: guardianFields.phone_secondary ?? undefined,
        national_id: guardianFields.national_id ?? undefined,
        job_title: guardianFields.job_title ?? undefined,
        workplace: guardianFields.workplace ?? undefined,
      };
      const createdGuardian = await studentsService.createGuardian(payload);
      const failedLinks: string[] = [];

      for (const student of selectedStudents) {
        try {
          await studentsService.linkGuardianToStudent(student.studentId, {
            guardianId: createdGuardian.guardianId,
            is_primary: student.is_primary,
          });
        } catch {
          failedLinks.push(student.label);
        }
      }

      setGuardians((currentGuardians) => [
        createdGuardian,
        ...currentGuardians,
      ]);

      if (failedLinks.length > 0) {
        throw new Error(
          t("linking_partial_failure", {
            students: failedLinks.join(", "),
          }),
        );
      }

      setShowCreateGuardianModal(false);
    } catch (error) {
      throw error;
    }
  };

  const handleAccountLinkClick = (
    e: React.MouseEvent,
    guardian: StudentGuardian,
  ) => {
    e.stopPropagation();
    if (!canLinkGuardianAccount) {
      setPageError(t("account_linking.manage_required"));
      return;
    }
    setAccountLinkGuardian(guardian);
  };

  const handleEditGuardianClick = (
    e: React.MouseEvent,
    guardian: StudentGuardian,
  ) => {
    e.stopPropagation();
    if (!canManageGuardians) {
      return;
    }
    setEditingGuardian(guardian);
    setEditGuardianError(null);
    setEditGuardianForm({
      full_name: guardian.full_name || "",
      relation: guardian.relation || "",
      phone_primary: guardian.phone_primary || "",
      phone_secondary: guardian.phone_secondary || "",
      email: guardian.email || "",
      national_id: guardian.national_id || "",
      job_title: guardian.job_title || "",
      workplace: guardian.workplace || "",
      is_primary: Boolean(guardian.is_primary),
      can_pickup: Boolean(guardian.can_pickup),
      can_receive_notifications: Boolean(guardian.can_receive_notifications),
    });
  };

  const handleEditGuardianSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageGuardians || !editingGuardian) {
      return;
    }

    setIsSavingGuardian(true);
    setEditGuardianError(null);

    try {
      const updatedGuardian = await studentsService.updateGuardian(
        editingGuardian.guardianId,
        editGuardianForm,
      );
      setGuardians((currentGuardians) =>
        currentGuardians.map((guardian) =>
          guardian.guardianId === editingGuardian.guardianId
            ? { ...guardian, ...updatedGuardian }
            : guardian,
        ),
      );
      setEditingGuardian(null);
    } catch (error) {
      setEditGuardianError(
        error instanceof Error ? error.message : t("loading_error"),
      );
    } finally {
      setIsSavingGuardian(false);
    }
  };

  const handleRowClick = (guardian: StudentGuardian) => {
    router.push(`/${lang}/students-guardians/guardians/${guardian.guardianId}`);
  };

  const columns = [
    {
      key: "guardianId",
      label: t("columns.guardian_id"),
      searchable: true,
    },
    {
      key: "full_name",
      label: t("columns.name"),
      searchable: true,
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{_ as string}</span>
          {(row as unknown as StudentGuardian).is_primary && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      ),
    },
    {
      key: "relation",
      label: t("columns.relation"),
      render: (value: unknown) => getRelationBadge(value as string),
    },
    {
      key: "phone_primary",
      label: t("columns.phone"),
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value as string}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: t("columns.email"),
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-gray-400" />
          <span className="text-sm truncate max-w-[200px]">
            {value as string}
          </span>
        </div>
      ),
    },
    {
      key: "can_pickup",
      label: t("columns.can_pickup"),
      render: (value: unknown) =>
        value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        ),
    },
    {
      key: "can_receive_notifications",
      label: t("columns.notifications"),
      render: (value: unknown) =>
        value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        ),
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
              handleRowClick(row as unknown as StudentGuardian);
            }}
            className="p-1.5 text-primary hover:bg-primary hover:text-white rounded transition-colors"
            title={t("actions.view_details")}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) =>
              handleEditGuardianClick(e, row as unknown as StudentGuardian)
            }
            className={`p-1.5 rounded transition-colors ${
              canManageGuardians
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title={t("actions.edit")}
            disabled={!canManageGuardians}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) =>
              handleAccountLinkClick(e, row as unknown as StudentGuardian)
            }
            className={`p-1.5 rounded transition-colors ${
              canLinkGuardianAccount
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title={t("actions.link_account")}
            disabled={!canLinkGuardianAccount}
          >
            <Lock className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (pageError && guardians.length === 0) {
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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("kpis.total_guardians")}
          value={kpis.total}
          subtitle={t("kpis.shown", { count: filteredGuardians.length })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("kpis.primary_guardians")}
          value={kpis.primary}
          subtitle={t("kpis.main_contacts")}
          icon={Star}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("kpis.can_pickup")}
          value={kpis.canPickup}
          subtitle={t("kpis.authorized")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
        <KPICardV2
          title={t("kpis.receive_notifications")}
          value={kpis.receiveNotifications}
          subtitle={t("kpis.subscribed")}
          icon={Mail}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
        />
      </div>

      {/* Filters and Actions */}
      <FilterPanel
        searchSlot={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                type="text"
                leftIcon={<Search className="w-5 h-5" />}
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateGuardianModal(true)}
                disabled={!canManageGuardians}
              >
                {t("actions.create_guardian")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportModal(true)}
              >
                {t("export")}
              </Button>
            </div>
          </div>
        }
        filtersSlot={
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label={t("relation")}
                value={relationFilter}
                onChange={(value) => {
                  setValue("relation", value, "push");
                }}
                options={[
                  { value: "all", label: t("all_relations") },
                  ...guardianRelationOptions.map((relation) => ({
                    value: relation,
                    label: relation.charAt(0).toUpperCase() + relation.slice(1),
                  })),
                ]}
              />
            </div>
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t("active_filters")}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<X className="w-3 h-3" />}
              onClick={clearFilters}
            >
              {t("clear_all")}
            </Button>
          </div>
        }
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
      />

      {/* Guardians Table */}
      {!isPageLoading && filteredGuardians.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title={t("no_guardians")}
          message={
            hasActiveFilters ? t("try_adjusting") : t("no_guardians_message")
          }
          action={
            hasActiveFilters ? (
              <Button type="button" onClick={clearFilters}>
                {t("clear_filters")}
              </Button>
            ) : undefined
          }
          className="bg-white rounded-xl shadow-sm"
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredGuardians as unknown as Record<string, unknown>[]}
          isLoading={isPageLoading}
          showPagination={true}
          itemsPerPage={20}
          searchQuery={searchQuery}
          onRowClick={(row) =>
            handleRowClick(row as unknown as StudentGuardian)
          }
          urlState={{
            keyPrefix: "guardiansTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      <Modal
        isOpen={Boolean(editingGuardian)}
        onClose={() => setEditingGuardian(null)}
        title={t("actions.edit")}
        size="lg"
      >
        {editingGuardian && (
          <form onSubmit={handleEditGuardianSubmit} className="space-y-4">
            {editGuardianError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editGuardianError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                {t("columns.name")}
                <Input
                  value={editGuardianForm.full_name}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("columns.relation")}
                <Input
                  value={editGuardianForm.relation}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      relation: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("columns.phone")}
                <Input
                  type="tel"
                  value={editGuardianForm.phone_primary}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      phone_primary: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("fields.phone_secondary")}
                <Input
                  type="tel"
                  value={editGuardianForm.phone_secondary}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      phone_secondary: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("columns.email")}
                <Input
                  type="email"
                  value={editGuardianForm.email}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("fields.national_id")}
                <Input
                  value={editGuardianForm.national_id}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      national_id: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("fields.job_title")}
                <Input
                  value={editGuardianForm.job_title}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      job_title: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t("fields.workplace")}
                <Input
                  value={editGuardianForm.workplace}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      workplace: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Input
                  type="checkbox"
                  checked={editGuardianForm.is_primary}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      is_primary: event.target.checked,
                    }))
                  }
                />
                {t("columns.primary")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Input
                  type="checkbox"
                  checked={editGuardianForm.can_pickup}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      can_pickup: event.target.checked,
                    }))
                  }
                />
                {t("columns.can_pickup")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Input
                  type="checkbox"
                  checked={editGuardianForm.can_receive_notifications}
                  onChange={(event) =>
                    setEditGuardianForm((current) => ({
                      ...current,
                      can_receive_notifications: event.target.checked,
                    }))
                  }
                />
                {t("columns.notifications")}
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingGuardian(null)}
              >
                {t("actions.cancel")}
              </Button>
              <Button type="submit" loading={isSavingGuardian}>
                {t("actions.save")}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <AddGuardianModal
        isOpen={showCreateGuardianModal}
        onClose={() => setShowCreateGuardianModal(false)}
        onSubmit={handleCreateGuardian}
      />

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("subtitle")}
        datasetCount={filteredGuardians.length}
        emptyStateMessage={t("no_guardians_message")}
      />
      <GuardianAccountLinkModal
        isOpen={Boolean(accountLinkGuardian)}
        guardian={accountLinkGuardian}
        onClose={() => setAccountLinkGuardian(null)}
      />
    </div>
  );
}
