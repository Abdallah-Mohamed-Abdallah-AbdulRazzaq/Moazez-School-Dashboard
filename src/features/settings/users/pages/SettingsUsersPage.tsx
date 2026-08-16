"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Download,
  Loader2,
  MailPlus,
  RefreshCcw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { DataTable, FilterPanel } from "@/components/ui";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import UserEditorModal from "@/features/settings/components/UserEditorModal";
import UserProvisioningModal from "@/features/settings/users/components/UserProvisioningModal";
import SettingsUserActions from "@/features/settings/users/components/SettingsUserActions";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import { fetchAllSettingsRoles } from "@/features/settings/services/settingsRolesService";
import {
  createSettingsUser,
  fetchSettingsUsers,
  type FetchSettingsUsersParams,
  inviteSettingsUser,
  setSettingsUserStatus,
  updateSettingsUser,
} from "@/features/settings/services/settingsUsersService";
import { isApiError } from "@/lib/api-error";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import type {
  RoleDefinition,
  SettingsUserPayloadDto,
  SettingsUserRecord,
} from "@/features/settings/types";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/useDebounce";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";

const USERS_SEARCH_DEBOUNCE_MS = 300;

type UserEditorField =
  | "fullName"
  | "username"
  | "contactEmail"
  | "email"
  | "roleId";

export default function SettingsUsersPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("settings.users");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission("settings.users.manage");
  const canDeliverCredentials = hasPermission(
    "settings.email.credential_deliveries.manage",
  );
  const canViewTeachers = hasPermission("teachers.records.view");
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<SettingsUserRecord[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [rolesLoadFailed, setRolesLoadFailed] = useState(false);
  const [rolesReloadVersion, setRolesReloadVersion] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [modalMode, setModalMode] = useState<
    "create" | "invite" | "edit" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<SettingsUserRecord | null>(
    null,
  );
  const [provisioningUser, setProvisioningUser] =
    useState<SettingsUserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [modalFieldErrors, setModalFieldErrors] = useState<
    Partial<Record<UserEditorField, string>>
  >({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalWorkflowError, setModalWorkflowError] =
    useState<SettingsWorkflowError | null>(null);
  const [pageWorkflowError, setPageWorkflowError] =
    useState<SettingsWorkflowError | null>(null);
  const [listWorkflowError, setListWorkflowError] =
    useState<SettingsWorkflowError | null>(null);
  const [listReloadVersion, setListReloadVersion] = useState(0);
  const [statusUser, setStatusUser] = useState<SettingsUserRecord | null>(null);
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const { values, setValue, replaceValues, reset } = useUrlQueryState<{
    search: string;
    role: string;
    status: string;
  }>({
    defaults: {
      search: "",
      role: "all",
      status: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: (current) => {
      const nextUpdates: Partial<Record<keyof typeof current, string | null>> =
        {};
      const validStatuses = ["all", "active", "invited", "inactive"];

      if (!validStatuses.includes(current.status)) {
        nextUpdates.status = null;
      }

      return Object.keys(nextUpdates).length > 0 ? nextUpdates : null;
    },
  });

  const search = values.search;
  const debouncedSearch = useDebounce(
    search.trim(),
    USERS_SEARCH_DEBOUNCE_MS,
  );
  const roleFilter = values.role;
  const statusFilter = values.status;
  const hasHydratedListRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      setIsRolesLoading(true);
      setRolesLoadFailed(false);
      try {
        const nextRoles = await fetchAllSettingsRoles();
        if (!cancelled) {
          setRoles(nextRoles);
        }
      } catch {
        if (!cancelled) {
          setRolesLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setIsRolesLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [rolesReloadVersion]);

  useEffect(() => {
    if (search.trim() !== debouncedSearch) {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(async () => {
      const isInitialLoad = !hasHydratedListRef.current;
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }
      setListWorkflowError(null);
      try {
        const usersParams: FetchSettingsUsersParams = {
          search: debouncedSearch,
          page,
          limit,
          roleId: roleFilter,
          status: statusFilter as SettingsUserRecord["status"] | "all",
        };
        const usersResult = await fetchSettingsUsers(usersParams);
        if (cancelled) {
          return;
        }
        setUsers(usersResult.items);
        setTotalUsers(usersResult.pagination.total);
        setPage(usersResult.pagination.page);
        setLimit(usersResult.pagination.limit);
        hasHydratedListRef.current = true;
      } catch (error) {
        if (!cancelled) {
          setListWorkflowError(classifySettingsWorkflowError(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    limit,
    listReloadVersion,
    page,
    roleFilter,
    search,
    statusFilter,
  ]);

  const rolesById = useMemo(
    () => new Map(roles.map((role) => [role.id, role])),
    [roles],
  );

  useEffect(() => {
    if (
      !isRolesLoading &&
      !rolesLoadFailed &&
      roleFilter !== "all" &&
      !roles.some((role) => role.id === roleFilter)
    ) {
      replaceValues({ role: null });
    }
  }, [
    isRolesLoading,
    replaceValues,
    roleFilter,
    roles,
    rolesLoadFailed,
  ]);

  const hasActiveFilters =
    search.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";
  const hasAssignableRoles = roles.some((role) => role.key !== "teacher");
  const userEditorUnavailable =
    isRolesLoading || rolesLoadFailed || !hasAssignableRoles;

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: users.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "fullName", label: t("table.name") },
      { key: "username", label: t("table.username") },
      { key: "email", label: t("table.login_email") },
      { key: "contactEmail", label: t("table.contact_email") },
      { key: "role", label: t("table.role") },
      { key: "status", label: t("table.status") },
      { key: "lastActiveAt", label: t("table.last_active") },
      {
        key: "invitedAt",
        label: locale === "ar" ? "تاريخ الدعوة" : "Invited at",
      },
    ];
    const rows = users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username || "",
      email: user.email,
      contactEmail: user.contactEmail || "",
      role: rolesById.get(user.roleId)?.name || user.roleName || user.roleId,
      status: t(`statuses.${user.status}`),
      lastActiveAt: user.lastActiveAt
        ? new Date(user.lastActiveAt).toLocaleString()
        : t("not_available"),
      invitedAt: user.invitedAt
        ? new Date(user.invitedAt).toLocaleString()
        : "",
    }));

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-users",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Users",
        metadata,
        filters: {
          search,
          role: roleFilter,
          status: statusFilter,
        },
        users: users.map((user) => ({
          ...user,
          loginEmail: user.email,
          roleName:
            rolesById.get(user.roleId)?.name || user.roleName || user.roleId,
        })),
      },
    });
  };

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      void Promise.resolve().then(() => setShowFilters(true));
    }
  }, [hasActiveFilters, showFilters]);

  const refresh = async (): Promise<boolean> => {
    setIsFetching(true);
    setListWorkflowError(null);
    try {
      const usersParams: FetchSettingsUsersParams = {
        search: debouncedSearch,
        page,
        limit,
        roleId: roleFilter,
        status: statusFilter as SettingsUserRecord["status"] | "all",
      };
      const result = await fetchSettingsUsers(usersParams);
      setUsers(result.items);
      setTotalUsers(result.pagination.total);
      setPage(result.pagination.page);
      setLimit(result.pagination.limit);
      return true;
    } catch (error) {
      setListWorkflowError(classifySettingsWorkflowError(error));
      return false;
    } finally {
      setIsFetching(false);
    }
  };

  const handleModalSubmit = async (payload: SettingsUserPayloadDto) => {
    try {
      let userToProvision: SettingsUserRecord | null = null;
      if (modalMode === "invite") {
        userToProvision = await inviteSettingsUser({
          fullName: payload.fullName,
          ...(payload.username ? { username: payload.username } : {}),
          ...(payload.email ? { email: payload.email } : {}),
          contactEmail: payload.contactEmail,
          roleId: payload.roleId,
        });
        showSuccess(t("messages.invited"));
      } else if (modalMode === "create") {
        userToProvision = await createSettingsUser({
          fullName: payload.fullName,
          ...(payload.username ? { username: payload.username } : {}),
          ...(payload.email ? { email: payload.email } : {}),
          contactEmail: payload.contactEmail,
          roleId: payload.roleId,
        });
        showSuccess(t("messages.created"));
      } else if (modalMode === "edit" && selectedUser) {
        await updateSettingsUser(selectedUser.id, {
          fullName: payload.fullName,
          roleId: payload.roleId,
        });
        showSuccess(t("messages.updated"));
      }
      setModalMode(null);
      setSelectedUser(null);
      setModalFieldErrors({});
      setModalError(null);
      setModalWorkflowError(null);
      setProvisioningUser(userToProvision);
      if (!(await refresh())) {
        showError(t("messages.refresh_failed_after_save"));
      }
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error);
      if (
        isApiError(error) &&
        [
          "validation.failed",
          "iam.user.email_taken",
          "iam.user.username_taken",
          "iam.user.username_invalid",
          "iam.user.login_email_taken",
          "iam.user.contact_email_invalid",
        ].includes(
          error.code,
        )
      ) {
        setModalWorkflowError(null);
        setModalFieldErrors({
          fullName: fieldErrors.fullName,
          username:
            fieldErrors.username ||
            (error.code === "iam.user.username_invalid"
              ? t("identity.username_invalid")
              : error.code === "iam.user.login_email_taken"
                ? t("identity.username_unavailable")
              : error.code === "iam.user.username_taken"
                ? error.message
                : undefined),
          contactEmail:
            fieldErrors.contactEmail ||
            (error.code === "iam.user.contact_email_invalid"
              ? t("identity.contact_email_invalid")
              : undefined) ||
            (payload.username && error.code === "iam.user.email_taken"
              ? error.message
              : undefined),
          email:
            fieldErrors.email ||
            (!payload.username && error.code === "iam.user.email_taken"
              ? error.message
              : undefined),
          roleId: fieldErrors.roleId,
        });
        setModalError(
          error.code === "validation.failed"
            ? tCommon("validation_failed")
            : error.code === "iam.user.username_invalid"
              ? null
              : error.message,
        );
        return;
      }
      setModalFieldErrors({});
      setModalError(null);
      setModalWorkflowError(classifySettingsWorkflowError(error));
    }
  };

  const handleStatusChange = async () => {
    if (!statusUser) {
      return;
    }

    const user = statusUser;
    setPageWorkflowError(null);
    setIsStatusSaving(true);
    try {
      await setSettingsUserStatus(
        user.id,
        user.status === "inactive" ? "active" : "inactive",
      );
      await refresh();
      showSuccess(
        user.status === "inactive"
          ? t("messages.activated")
          : t("messages.deactivated"),
      );
    } catch (error) {
      setPageWorkflowError(classifySettingsWorkflowError(error));
    } finally {
      setIsStatusSaving(false);
      setStatusUser(null);
    }
  };

  const openCredentials = (user: SettingsUserRecord) => {
    router.push(
      `/${locale}/settings/credentials?search=${encodeURIComponent(user.email)}`,
    );
  };

  const openCredentialDelivery = (user: SettingsUserRecord) => {
    router.push(
      `/${locale}/settings/email/credential-deliveries?userId=${encodeURIComponent(user.id)}&userSearch=${encodeURIComponent(user.email)}`,
    );
  };

  const openTeacherDirectory = (user: SettingsUserRecord) => {
    router.push(`/${locale}/teachers?search=${encodeURIComponent(user.email)}`);
  };

  const columns = [
    {
      key: "fullName",
      label: t("table.name"),
      searchable: true,
      sortable: false,
      render: (value: unknown, row: Record<string, unknown>) => {
        const user = row as unknown as SettingsUserRecord;
        return (
          <div>
            <p className="font-semibold text-gray-900">{String(value)}</p>
            <p className="mt-1 text-xs text-gray-500">
              {user.username || t("not_available")}
            </p>
          </div>
        );
      },
    },
    {
      key: "username",
      label: t("table.username"),
      searchable: true,
      sortable: false,
      render: (value: unknown) => String(value || t("not_available")),
    },
    {
      key: "email",
      label: t("table.login_email"),
      searchable: true,
      sortable: false,
      render: (value: unknown) => (
        <span className="break-all text-gray-700">
          {String(value || t("not_available"))}
        </span>
      ),
    },
    {
      key: "contactEmail",
      label: t("table.contact_email"),
      searchable: true,
      sortable: false,
      render: (value: unknown) => (
        <span className="break-all text-gray-700">
          {String(value || t("not_available"))}
        </span>
      ),
    },
    {
      key: "roleId",
      label: t("table.role"),
      sortable: false,
      render: (value: unknown, row: Record<string, unknown>) => {
        const user = row as unknown as SettingsUserRecord;
        return (
          rolesById.get(String(value))?.name ||
          user.roleName ||
          String(value)
        );
      },
    },
    {
      key: "status",
      label: t("table.status"),
      sortable: false,
      render: (value: unknown) => (
        <SettingsStatusBadge status={value as SettingsUserRecord["status"]} />
      ),
    },
    {
      key: "lastActiveAt",
      label: t("table.last_active"),
      sortable: false,
      render: (value: unknown) =>
        value ? new Date(String(value)).toLocaleString() : t("not_available"),
    },
    {
      key: "id",
      label: t("table.actions"),
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const user = row as unknown as SettingsUserRecord;
        const role = rolesById.get(user.roleId);
        const isTeacher = role?.key === "teacher";
        return (
          <SettingsUserActions
            user={user}
            isTeacher={isTeacher}
            canManageUsers={canManageUsers && Boolean(role)}
            canDeliverCredentials={canDeliverCredentials}
            canViewTeachers={canViewTeachers}
            labels={{
              edit: tCommon("edit"),
              activate: t("activate"),
              deactivate: t("deactivate"),
              openMenu: t("open_actions", { name: user.fullName }),
              manageCredentials: t("manage_credentials"),
              viewCredentials: t("view_credentials"),
              deliverCredentials: t("deliver_credentials"),
              manageTeacher: t("manage_in_teachers"),
            }}
            onEdit={() => {
              setSelectedUser(user);
              setModalMode("edit");
            }}
            onToggleStatus={() => setStatusUser(user)}
            onManageCredentials={() => openCredentials(user)}
            onDeliverCredentials={() => openCredentialDelivery(user)}
            onManageTeacher={() => openTeacherDirectory(user)}
          />
        );
      },
    },
  ];

  return (
    <SettingsAccessGuard permission="settings.users.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            canManageUsers ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => setIsExportModalOpen(true)}
                >
                  {tExport("button")}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<MailPlus className="h-4 w-4" />}
                  disabled={userEditorUnavailable}
                  title={
                    userEditorUnavailable ? t("roles.required") : undefined
                  }
                  onClick={() => {
                    setSelectedUser(null);
                    setModalWorkflowError(null);
                    setModalMode("invite");
                  }}
                >
                  {t("invite_user")}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  disabled={userEditorUnavailable}
                  title={
                    userEditorUnavailable ? t("roles.required") : undefined
                  }
                  onClick={() => {
                    setSelectedUser(null);
                    setModalWorkflowError(null);
                    setModalMode("create");
                  }}
                >
                  {t("create_user")}
                </Button>
              </div>
            ) : null
          }
        />
        {pageWorkflowError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={pageWorkflowError} />
          </div>
        ) : null}
        {rolesLoadFailed || (!isRolesLoading && !hasAssignableRoles) ? (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span>
              {rolesLoadFailed ? t("roles.load_failed") : t("roles.empty")}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setRolesReloadVersion((currentVersion) => currentVersion + 1)
              }
            >
              {t("roles.retry")}
            </Button>
          </div>
        ) : isRolesLoading ? (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center gap-2 text-sm text-gray-600"
          >
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {t("roles.loading")}
          </p>
        ) : null}

        <SettingsSectionCard
          title={t("directory_title")}
          description={t("directory_description")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              loading={isFetching}
              onClick={() => void refresh()}
            >
              {t("refresh")}
            </Button>
          }
        >
          <div className="mb-4">
            <FilterPanel
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((current) => !current)}
              hasActiveFilters={hasActiveFilters}
              toggleTitle={t("filter_button")}
              toggleAriaLabel={t("filter_button")}
              className="bg-transparent p-0 shadow-none"
              clearAction={null}
              searchSlot={
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1">
                    <Input
                      value={search}
                      aria-label={t("search")}
                      leftIcon={<Search className="h-4 w-4" />}
                      rightIcon={
                        isFetching ? (
                          <Loader2
                            className="h-4 w-4 animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                          />
                        ) : undefined
                      }
                      onChange={(event) => {
                        setPage(1);
                        setValue("search", event.target.value, "replace")
                      }}
                      placeholder={t("search")}
                    />
                  </div>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={() => {
                        setPage(1);
                        reset(undefined, "replace");
                      }}
                    >
                      {t("clear_filters")}
                    </Button>
                  ) : null}
                </div>
              }
              filtersSlot={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label={t("filters.role")}
                    value={roleFilter}
                    disabled={isRolesLoading || rolesLoadFailed}
                    onChange={(value) => {
                      setPage(1);
                      setValue("role", value, "push");
                    }}
                    options={[
                      { value: "all", label: tCommon("all") },
                      ...roles.map((role) => ({
                        value: role.id,
                        label: role.name,
                      })),
                    ]}
                  />
                  <Select
                    label={t("filters.status")}
                    value={statusFilter}
                    onChange={(value) => {
                      setPage(1);
                      setValue("status", value, "push");
                    }}
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "active", label: t("statuses.active") },
                      { value: "invited", label: t("statuses.invited") },
                      { value: "inactive", label: t("statuses.inactive") },
                    ]}
                  />
                </div>
              }
            />
          </div>

          <p
            role="status"
            aria-live="polite"
            className="mb-3 min-h-5 text-sm text-gray-600"
          >
            {search.trim() !== debouncedSearch
              ? t("messages.search_waiting")
              : isFetching
                ? t("messages.loading")
                : t("messages.result_count", { count: totalUsers })}
          </p>

          {listWorkflowError ? (
            <div className="mb-4 space-y-3">
              <SettingsWorkflowErrorAlert error={listWorkflowError} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setListReloadVersion(
                    (currentVersion) => currentVersion + 1,
                  )
                }
              >
                {t("messages.retry")}
              </Button>
            </div>
          ) : null}

          {!listWorkflowError || users.length > 0 ? (
            <DataTable
              columns={columns}
              data={users as unknown as Record<string, unknown>[]}
              isLoading={isLoading}
              skeletonRows={limit}
              showPagination
              itemsPerPage={limit}
              searchQuery={search}
              emptyTitle={
                hasActiveFilters ? t("empty.filtered_title") : t("empty.title")
              }
              emptyDescription={
                hasActiveFilters
                  ? t("empty.filtered_description")
                  : t("empty.description")
              }
              serverPagination={{
                enabled: true,
                currentPage: page,
                pageSize: limit,
                totalItems: totalUsers,
                onPageChange: (nextPage) => setPage(nextPage),
                onPageSizeChange: (nextSize) => {
                  setLimit(nextSize);
                  setPage(1);
                },
              }}
            />
          ) : null}
        </SettingsSectionCard>

        <UserEditorModal
          isOpen={modalMode !== null}
          mode={modalMode || "create"}
          user={selectedUser}
          roles={roles}
          errors={modalFieldErrors}
          formError={modalError}
          workflowError={modalWorkflowError}
          onFieldChange={(field) => {
            setModalWorkflowError(null);
            setModalFieldErrors((current) => ({
              ...current,
              [field]: undefined,
            }));
          }}
          onClose={() => {
            setModalMode(null);
            setSelectedUser(null);
            setModalFieldErrors({});
            setModalError(null);
            setModalWorkflowError(null);
          }}
          onSubmit={handleModalSubmit}
        />
        <UserProvisioningModal
          isOpen={Boolean(provisioningUser)}
          user={provisioningUser}
          canGenerate={canManageUsers}
          canDeliver={canDeliverCredentials}
          onDeliver={openCredentialDelivery}
          onClose={() => setProvisioningUser(null)}
        />
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={users.length}
          emptyStateMessage={tExport("errors.noData")}
        />
        <ConfirmDialog
          isOpen={Boolean(statusUser)}
          onClose={() => {
            if (!isStatusSaving) {
              setStatusUser(null);
            }
          }}
          onConfirm={() => void handleStatusChange()}
          title={
            statusUser?.status === "inactive"
              ? t("status_change.activate_title")
              : t("status_change.deactivate_title")
          }
          description={
            statusUser?.status === "inactive"
              ? t("status_change.activate_description", {
                  name: statusUser?.fullName || "",
                })
              : t("status_change.deactivate_description", {
                  name: statusUser?.fullName || "",
                })
          }
          confirmLabel={
            statusUser?.status === "inactive"
              ? t("activate")
              : t("deactivate")
          }
          cancelLabel={tCommon("cancel")}
          loading={isStatusSaving}
          severity={statusUser?.status === "inactive" ? "info" : "danger"}
        />
      </main>
    </SettingsAccessGuard>
  );
}
