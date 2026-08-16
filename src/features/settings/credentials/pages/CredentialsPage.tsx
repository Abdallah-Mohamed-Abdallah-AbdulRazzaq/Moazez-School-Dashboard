"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCcw, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { FilterPanel } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import {
  fetchCredentialRoles,
  fetchCredentialStatuses,
  generateBulkCredentials,
  generateUserCredential,
  getBulkCredentialPreviewPayloadKey,
  previewBulkCredentials,
  regenerateUserCredential,
  setUserCredentialPassword,
} from "@/features/settings/credentials/services/credentialsService";
import BulkGenerateCredentialsModal from "@/features/settings/credentials/components/BulkGenerateCredentialsModal";
import CredentialStatusTable from "@/features/settings/credentials/components/CredentialStatusTable";
import GenerateCredentialModal from "@/features/settings/credentials/components/GenerateCredentialModal";
import SetPasswordModal from "@/features/settings/credentials/components/SetPasswordModal";
import TemporaryPasswordRevealModal, {
  type RevealedCredential,
} from "@/features/settings/credentials/components/TemporaryPasswordRevealModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type {
  BulkCredentialPreviewRequest,
  BulkCredentialPreviewResponse,
  CredentialStatusRecord,
  CredentialRoleOption,
  FetchCredentialStatusParams,
} from "@/features/settings/credentials/types";
import { getPasswordPolicyApiFailures } from "@/utils/validation/passwordPolicy";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";

type GenerateModalMode = "generate" | "regenerate";

const ROLE_LOADING_VALUE = "__roles_loading";
const ROLE_ERROR_VALUE = "__roles_error";
const ROLE_EMPTY_VALUE = "__roles_empty";

export default function CredentialsPage() {
  const t = useTranslations("settings.credentials");
  const tCommon = useTranslations("common");
  const tPasswordPolicy = useTranslations("password_policy");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const canManage = hasPermission("settings.users.manage");
  const [records, setRecords] = useState<CredentialStatusRecord[]>([]);
  const [roles, setRoles] = useState<CredentialRoleOption[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [hasLoadedRoles, setHasLoadedRoles] = useState(false);
  const [rolesLoadFailed, setRolesLoadFailed] = useState(false);
  const {
    values: { search },
    setValue: setQueryValue,
    reset: resetQuery,
  } = useUrlQueryState({
    defaults: { search: "" },
    debouncedKeys: ["search"],
    modeByKey: { search: "replace" },
  });
  const [roleFilter, setRoleFilter] = useState("all");
  const [hasPasswordFilter, setHasPasswordFilter] = useState("all");
  const [mustChangePasswordFilter, setMustChangePasswordFilter] =
    useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] =
    useState<CredentialStatusRecord | null>(null);
  const [generateMode, setGenerateMode] = useState<GenerateModalMode | null>(
    null,
  );
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [workflowError, setWorkflowError] =
    useState<SettingsWorkflowError | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkPreview, setBulkPreview] =
    useState<BulkCredentialPreviewResponse | null>(null);
  const [bulkPreviewPayloadKey, setBulkPreviewPayloadKey] = useState<
    string | null
  >(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkPreviewing, setIsBulkPreviewing] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [revealedCredentials, setRevealedCredentials] = useState<
    RevealedCredential[]
  >([]);

  const hasActiveFilters = useMemo(
    () =>
      search.trim() ||
      roleFilter !== "all" ||
      hasPasswordFilter !== "all" ||
      mustChangePasswordFilter !== "all",
    [
      hasPasswordFilter,
      mustChangePasswordFilter,
      roleFilter,
      search,
    ],
  );

  const roleStateOption = useMemo<SelectOption | null>(() => {
    if (isRolesLoading) {
      return {
        value: ROLE_LOADING_VALUE,
        label: t("filters.roles_loading"),
        disabled: true,
      };
    }
    if (rolesLoadFailed) {
      return {
        value: ROLE_ERROR_VALUE,
        label: t("filters.roles_error"),
        disabled: true,
      };
    }
    if (hasLoadedRoles && roles.length === 0) {
      return {
        value: ROLE_EMPTY_VALUE,
        label: t("filters.roles_empty"),
        disabled: true,
      };
    }
    return null;
  }, [hasLoadedRoles, isRolesLoading, roles.length, rolesLoadFailed, t]);

  const roleOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: tCommon("all") },
      ...roles.map((role) => ({
        value: role.key ?? role.id,
        label: role.name,
        searchText: `${role.name} ${role.key ?? ""}`,
        disabled: !role.key,
      })),
      ...(roleStateOption ? [roleStateOption] : []),
    ],
    [roleStateOption, roles, tCommon],
  );

  const loadRoles = useCallback(async () => {
    setIsRolesLoading(true);
    setRolesLoadFailed(false);
    try {
      setRoles(await fetchCredentialRoles());
      setHasLoadedRoles(true);
    } catch {
      setRolesLoadFailed(true);
    } finally {
      setIsRolesLoading(false);
    }
  }, []);

  const buildFetchParams = useCallback(
    (): FetchCredentialStatusParams => {
      const credentialStatus =
        mustChangePasswordFilter === "yes"
          ? "must_change"
          : hasPasswordFilter === "yes"
            ? "set"
            : hasPasswordFilter === "no"
              ? "missing"
              : undefined;

      return {
        search,
        page,
        limit,
        roleKey: roleFilter === "all" ? undefined : roleFilter,
        credentialStatus,
      };
    },
    [
      hasPasswordFilter,
      limit,
      mustChangePasswordFilter,
      page,
      roleFilter,
      search,
    ],
  );

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }
      setPageError(null);
      try {
        const statusResult = await fetchCredentialStatuses(buildFetchParams());
        setRecords(statusResult.items);
        setTotal(statusResult.pagination?.total || statusResult.items.length);
        setPage(statusResult.pagination?.page || page);
        setLimit(statusResult.pagination?.limit || limit);
      } catch (error) {
        setPageError(t("messages.load_failed"));
        setWorkflowError(classifySettingsWorkflowError(error));
        showError(t("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [buildFetchParams, limit, page, showError, t],
  );

  useEffect(() => {
    queueMicrotask(() => void hydrate());
  }, [hydrate]);

  useEffect(() => {
    queueMicrotask(() => void loadRoles());
  }, [loadRoles]);

  const enrichCredential = (
    credential: RevealedCredential,
  ): RevealedCredential => {
    const record = records.find((item) => item.userId === credential.userId);
    return {
      ...credential,
      fullName: record?.fullName,
      username: record?.username ?? credential.username,
      loginEmail: record?.loginEmail || credential.loginEmail,
    };
  };

  const handleSingleGenerate = async () => {
    if (!selectedUser || !generateMode) {
      return;
    }
    setIsSingleSubmitting(true);
    setWorkflowError(null);
    try {
      const credential =
        generateMode === "generate"
          ? await generateUserCredential(selectedUser.userId)
          : await regenerateUserCredential(selectedUser.userId);
      setRevealedCredentials([enrichCredential(credential)]);
      setGenerateMode(null);
      setSelectedUser(null);
      await hydrate("refresh");
      showSuccess(t("messages.generated"));
    } catch (error) {
      setGenerateMode(null);
      setSelectedUser(null);
      setWorkflowError(classifySettingsWorkflowError(error));
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  const handleSetPassword = async (
    password: string,
    mustChangePassword: boolean,
  ) => {
    if (!selectedUser) {
      return;
    }
    setIsSingleSubmitting(true);
    setSetPasswordError(null);
    setWorkflowError(null);
    try {
      await setUserCredentialPassword(selectedUser.userId, {
        password,
        forceResetOnLogin: mustChangePassword,
      });
      setIsSetPasswordOpen(false);
      setSelectedUser(null);
      await hydrate("refresh");
      showSuccess(t("messages.password_set"));
    } catch (error) {
      const policyFailures = getPasswordPolicyApiFailures(error);
      if (policyFailures.length > 0) {
        setSetPasswordError(
          policyFailures.map((reason) => tPasswordPolicy(reason)).join(" "),
        );
      } else {
        setIsSetPasswordOpen(false);
        setSelectedUser(null);
        setWorkflowError(classifySettingsWorkflowError(error));
      }
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  const handleBulkPreview = async (payload: BulkCredentialPreviewRequest) => {
    setIsBulkPreviewing(true);
    setBulkError(null);
    setWorkflowError(null);
    try {
      const response = await previewBulkCredentials(payload);
      setBulkPreview(response);
      setBulkPreviewPayloadKey(getBulkCredentialPreviewPayloadKey(payload));
    } catch (error) {
      setBulkPreview(null);
      setBulkPreviewPayloadKey(null);
      setBulkError(t("messages.preview_failed"));
      setWorkflowError(classifySettingsWorkflowError(error));
    } finally {
      setIsBulkPreviewing(false);
    }
  };

  const handleBulkGenerate = async (payload: BulkCredentialPreviewRequest) => {
    setIsBulkGenerating(true);
    setBulkError(null);
    setWorkflowError(null);
    try {
      const response = await generateBulkCredentials(payload);
      setRevealedCredentials(response.credentials.map(enrichCredential));
      setBulkPreview(null);
      setBulkPreviewPayloadKey(null);
      setIsBulkOpen(false);
      await hydrate("refresh");
      showSuccess(t("messages.bulk_generated"));
    } catch (error) {
      setBulkError(tCommon("save_failed"));
      setWorkflowError(classifySettingsWorkflowError(error));
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const resetFilters = () => {
    resetQuery(undefined, "replace");
    setRoleFilter("all");
    setHasPasswordFilter("all");
    setMustChangePasswordFilter("all");
    setPage(1);
  };

  return (
    <SettingsAccessGuard permission="settings.users.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                loading={isFetching}
                onClick={() => void hydrate("refresh")}
              >
                {t("refresh")}
              </Button>
              {canManage ? (
                <Button
                  variant="primary"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  onClick={() => {
                    setBulkPreview(null);
                    setBulkPreviewPayloadKey(null);
                    setBulkError(null);
                    setIsBulkOpen(true);
                  }}
                >
                  {t("bulk.open")}
                </Button>
              ) : null}
            </div>
          }
        />
        {workflowError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={workflowError} />
          </div>
        ) : null}

        <SettingsSectionCard
          title={t("table.title")}
          description={t("table.description")}
        >
          {pageError ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {pageError}
            </p>
          ) : null}
          <div className="mb-4">
            <FilterPanel
              showFilters={showFilters || Boolean(hasActiveFilters)}
              onToggleFilters={() => setShowFilters((current) => !current)}
              hasActiveFilters={Boolean(hasActiveFilters)}
              toggleTitle={t("filters.button")}
              toggleAriaLabel={t("filters.button")}
              className="bg-transparent p-0 shadow-none"
              clearAction={null}
              searchSlot={
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1">
                    <Input
                      value={search}
                      onChange={(event) => {
                        setQueryValue("search", event.target.value, "replace");
                        setPage(1);
                      }}
                      placeholder={t("filters.search")}
                    />
                  </div>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={resetFilters}
                    >
                      {t("filters.clear")}
                    </Button>
                  ) : null}
                </div>
              }
              filtersSlot={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Select
                    label={t("filters.role")}
                    value={roleFilter}
                    onChange={(role) => {
                      setRoleFilter(role);
                      setPage(1);
                    }}
                    searchable
                    searchPlaceholder={t("filters.role_search")}
                    noResultsText={t("filters.roles_no_results")}
                    helperText={roleStateOption?.label}
                    options={roleOptions}
                    onOpen={() => {
                      if (roles.length === 0 && !isRolesLoading) {
                        void loadRoles();
                      }
                    }}
                  />
                  <Select
                    label={t("filters.has_password")}
                    value={hasPasswordFilter}
                    onChange={(hasPassword) => {
                      setHasPasswordFilter(hasPassword);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "yes", label: t("yes") },
                      { value: "no", label: t("no") },
                    ]}
                  />
                  <Select
                    label={t("filters.must_change")}
                    value={mustChangePasswordFilter}
                    onChange={(mustChangePassword) => {
                      setMustChangePasswordFilter(mustChangePassword);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "yes", label: t("yes") },
                      { value: "no", label: t("no") },
                    ]}
                  />
                </div>
              }
            />
          </div>

          {!isLoading && !isFetching && records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-900">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <CredentialStatusTable
              records={records}
              searchQuery={search}
              page={page}
              limit={limit}
              total={total}
              isLoading={isLoading || isFetching}
              canManage={canManage}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              onGenerate={(record) => {
                setSelectedUser(record);
                setGenerateMode("generate");
              }}
              onSetPassword={(record) => {
                setSelectedUser(record);
                setSetPasswordError(null);
                setIsSetPasswordOpen(true);
              }}
              onRegenerate={(record) => {
                setSelectedUser(record);
                setGenerateMode("regenerate");
              }}
              labels={{
                name: t("table.name"),
                usernameLogin: t("table.username_login"),
                contactEmail: t("table.contact_email"),
                role: t("table.role"),
                status: t("table.status"),
                hasPassword: t("table.has_password"),
                mustChangePassword: t("table.must_change_password"),
                provisionedAt: t("table.provisioned_at"),
                changedAt: t("table.changed_at"),
                version: t("table.version"),
                actions: t("table.actions"),
                yes: t("yes"),
                no: t("no"),
                notAvailable: t("not_available"),
                generate: t("actions.generate"),
                setPassword: t("actions.set_password"),
                regenerate: t("actions.regenerate"),
                credentialStatuses: {
                  missing: t("credential_statuses.missing"),
                  set: t("credential_statuses.set"),
                  temporary_or_must_change: t(
                    "credential_statuses.temporary_or_must_change",
                  ),
                  must_change: t("credential_statuses.must_change"),
                },
              }}
            />
          )}
        </SettingsSectionCard>

        {generateMode ? (
          <GenerateCredentialModal
            isOpen
            mode={generateMode}
            user={selectedUser}
            isSubmitting={isSingleSubmitting}
            onClose={() => {
              setGenerateMode(null);
              setSelectedUser(null);
            }}
            onSubmit={handleSingleGenerate}
            labels={{
              generateTitle: t("generate.title"),
              regenerateTitle: t("generate.regenerate_title"),
              description: t("generate.description"),
              cancel: tCommon("cancel"),
              generate: t("actions.generate"),
              regenerate: t("actions.regenerate"),
              generating: t("generate.generating"),
            }}
          />
        ) : null}
        {isSetPasswordOpen ? (
          <SetPasswordModal
            isOpen
            user={selectedUser}
            isSubmitting={isSingleSubmitting}
            error={setPasswordError}
            onClose={() => {
              setIsSetPasswordOpen(false);
              setSelectedUser(null);
              setSetPasswordError(null);
            }}
            onSubmit={handleSetPassword}
            labels={{
              title: t("set.title"),
              description: t("set.description"),
              password: t("set.password"),
              confirmPassword: t("set.confirm_password"),
              mustChangePassword: t("set.must_change_password"),
              cancel: tCommon("cancel"),
              save: tCommon("save"),
              saving: tCommon("saving"),
              required: t("set.errors.required"),
              mismatch: t("set.errors.mismatch"),
              invalidLength: t("set.errors.invalid_length"),
              show: t("set.show"),
              hide: t("set.hide"),
            }}
          />
        ) : null}
        {isBulkOpen ? (
          <BulkGenerateCredentialsModal
            isOpen
            roles={roles}
            preview={bulkPreview}
            previewPayloadKey={bulkPreviewPayloadKey}
            isPreviewing={isBulkPreviewing}
            isGenerating={isBulkGenerating}
            error={bulkError}
            onClose={() => {
              setIsBulkOpen(false);
              setBulkPreview(null);
              setBulkPreviewPayloadKey(null);
              setBulkError(null);
            }}
            onPreview={handleBulkPreview}
            onGenerate={handleBulkGenerate}
            labels={{
              title: t("bulk.title"),
              description: t("bulk.description"),
              role: t("filters.role"),
              status: t("filters.status"),
              all: tCommon("all"),
              active: t("statuses.active"),
              invited: t("statuses.invited"),
              inactive: t("statuses.inactive"),
              missingOnly: t("bulk.missing_only"),
              mustChangeOnly: t("bulk.must_change_only"),
              forceChange: t("bulk.force_change"),
              preview: t("bulk.preview"),
              previewing: t("bulk.previewing"),
              generate: t("bulk.generate"),
              generating: t("bulk.generating"),
              cancel: tCommon("cancel"),
              totalMatched: t("bulk.total_matched"),
              eligible: t("bulk.eligible"),
              skipped: t("bulk.skipped"),
              skippedReasons: t("bulk.skipped_reasons.title"),
              skipReasonLabels: {
                already_has_password: t(
                  "bulk.skipped_reasons.already_has_password",
                ),
                disabled_user: t("bulk.skipped_reasons.disabled_user"),
              },
              unknownSkipReason: (reason) =>
                t("bulk.skipped_reasons.unknown", {
                  reason: reason.replaceAll("_", " "),
                }),
            }}
          />
        ) : null}
        <TemporaryPasswordRevealModal
          isOpen={revealedCredentials.length > 0}
          credentials={revealedCredentials}
          onClose={() => setRevealedCredentials([])}
          labels={{
            title: t("reveal.title"),
            warning: t("reveal.warning"),
            noPassword: t("reveal.no_password"),
            copy: t("reveal.copy"),
            copied: t("reveal.copied"),
            close: tCommon("close"),
            user: t("reveal.user"),
            password: t("reveal.password"),
            show: t("reveal.show"),
            hide: t("reveal.hide"),
          }}
        />
      </main>
    </SettingsAccessGuard>
  );
}
