// FILE: src/components/students-guardians/profile-tabs/GuardiansTab.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Phone,
  Mail,
  Star,
  Edit2,
  Trash2,
  Search,
  Users,
  Briefcase,
  Building2,
  IdCard,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Student,
  type StudentGuardian,
} from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import AddGuardianModal, {
  GuardianFormData,
} from "@/features/students-guardians/students/components/modals/AddGuardianModal";
import { useTranslations } from "next-intl";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";
import { Button, EmptyState, Input, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

interface GuardiansTabProps {
  student: Student;
}

function errorMessage(failure: unknown, fallback: string) {
  return failure instanceof Error ? failure.message : fallback;
}

export default function GuardiansTab({ student }: GuardiansTabProps) {
  const t = useTranslations("students_guardians.profile.guardians");
  const { showError } = useToast();
  const permissions = usePermissions();
  const { canManageGuardians } =
    getStudentsGuardiansCapabilities(permissions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [guardianSearch, setGuardianSearch] = useState("");
  const [guardianSearchResults, setGuardianSearchResults] = useState<
    StudentGuardian[]
  >([]);
  const [isSearchingGuardians, setIsSearchingGuardians] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState("");
  const [linkAsPrimary, setLinkAsPrimary] = useState(false);
  const [editingGuardian, setEditingGuardian] =
    useState<StudentGuardian | null>(null);
  const [editAsPrimary, setEditAsPrimary] = useState(false);
  const [editCanPickup, setEditCanPickup] = useState(false);
  const [editCanReceiveNotifications, setEditCanReceiveNotifications] =
    useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [primaryGuardian, setPrimaryGuardian] = useState<
    StudentGuardian | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [guardiansData, primaryGuardianData] = await Promise.all([
          studentsService.fetchStudentGuardians(student.id),
          studentsService.fetchPrimaryGuardian(student.id),
        ]);

        if (isCancelled) {
          return;
        }

        setGuardians(guardiansData);
        setPrimaryGuardian(primaryGuardianData);
      } catch (loadError) {
        if (!isCancelled) {
          setGuardians([]);
          setPrimaryGuardian(undefined);
          const message = errorMessage(loadError, "Unable to load guardians.");
          setError(message);
          showError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [showError, student.id]);

  const handleAddGuardian = async (guardianData: GuardianFormData) => {
    if (!canManageGuardians) return;

    setError(null);
    try {
      const { selectedStudents, ...guardianFields } = guardianData;
      const payload = {
        ...guardianFields,
        phone_primary: guardianFields.phone_primary ?? undefined,
        phone_secondary: guardianFields.phone_secondary ?? undefined,
        national_id: guardianFields.national_id ?? undefined,
        job_title: guardianFields.job_title ?? undefined,
        workplace: guardianFields.workplace ?? undefined,
      };
      const guardian = await studentsService.createGuardian(payload);
      await studentsService.linkGuardianToStudent(student.id, {
        guardianId: guardian.guardianId,
        is_primary: guardianData.is_primary,
      });
      const failedLinks: string[] = [];

      for (const selectedStudent of selectedStudents) {
        if (selectedStudent.studentId === student.id) {
          continue;
        }

        try {
          await studentsService.linkGuardianToStudent(
            selectedStudent.studentId,
            {
              guardianId: guardian.guardianId,
              is_primary: selectedStudent.is_primary,
            },
          );
        } catch {
          failedLinks.push(selectedStudent.label);
        }
      }

      const [guardiansData, primaryGuardianData] = await Promise.all([
        studentsService.fetchStudentGuardians(student.id),
        studentsService.fetchPrimaryGuardian(student.id),
      ]);
      setGuardians(guardiansData);
      setPrimaryGuardian(primaryGuardianData);
      if (failedLinks.length > 0) {
        throw new Error(
          t("linking_partial_failure", {
            students: failedLinks.join(", "),
          }),
        );
      }
      setShowAddModal(false);
    } catch (submitError) {
      throw submitError;
    }
  };

  useEffect(() => {
    if (!showLinkModal) {
      return;
    }

    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsSearchingGuardians(true);
      setError(null);

      try {
        const results = await studentsService.fetchAllGuardians({
          search: guardianSearch,
        });
        const linkedIds = new Set(
          guardians.map((guardian) => guardian.guardianId),
        );
        if (!isCancelled) {
          setGuardianSearchResults(
            results.filter((guardian) => !linkedIds.has(guardian.guardianId)),
          );
        }
      } catch (searchError) {
        if (!isCancelled) {
          setGuardianSearchResults([]);
          const message = errorMessage(
            searchError,
            "Unable to search guardians.",
          );
          setError(message);
          showError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingGuardians(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [guardianSearch, guardians, showError, showLinkModal]);

  const refreshStudentGuardians = async () => {
    const [guardiansData, primaryGuardianData] = await Promise.all([
      studentsService.fetchStudentGuardians(student.id),
      studentsService.fetchPrimaryGuardian(student.id),
    ]);
    setGuardians(guardiansData);
    setPrimaryGuardian(primaryGuardianData);
  };

  const handleLinkExistingGuardian = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageGuardians) return;

    if (!selectedGuardianId) {
      setError("Please select a guardian to link.");
      return;
    }

    try {
      setError(null);
      await studentsService.linkGuardianToStudent(student.id, {
        guardianId: selectedGuardianId,
        is_primary: linkAsPrimary,
      });
      await refreshStudentGuardians();
      setShowLinkModal(false);
      setSelectedGuardianId("");
      setGuardianSearch("");
      setLinkAsPrimary(false);
    } catch (linkError) {
      const message = errorMessage(linkError, "Unable to link guardian.");
      setError(message);
      showError(message);
    }
  };

  const handleUnlinkGuardian = async (guardianId: string) => {
    if (!canManageGuardians) return;

    try {
      setError(null);
      await studentsService.unlinkGuardianFromStudent(student.id, guardianId);
      await refreshStudentGuardians();
    } catch (unlinkError) {
      const message = errorMessage(unlinkError, "Unable to unlink guardian.");
      setError(message);
      showError(message);
    }
  };

  const openLinkEditor = (guardian: StudentGuardian) => {
    if (!canManageGuardians) return;

    setEditingGuardian(guardian);
    setEditAsPrimary(guardian.is_primary);
    setEditCanPickup(guardian.can_pickup);
    setEditCanReceiveNotifications(guardian.can_receive_notifications);
    setError(null);
  };

  const saveGuardianLink = async () => {
    if (!canManageGuardians || !editingGuardian) return;

    setIsSavingLink(true);
    setError(null);
    try {
      await Promise.all([
        studentsService.updateStudentGuardianLink(
          student.id,
          editingGuardian.guardianId,
          { is_primary: editAsPrimary },
        ),
        studentsService.updateGuardian(editingGuardian.guardianId, {
          can_pickup: editCanPickup,
          can_receive_notifications: editCanReceiveNotifications,
        }),
      ]);
      await refreshStudentGuardians();
      setEditingGuardian(null);
    } catch (updateError) {
      const message = errorMessage(updateError, t("update_link_failed"));
      setError(message);
      showError(message);
    } finally {
      setIsSavingLink(false);
    }
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    return phone || "N/A";
  };

  if (isLoading) {
    return <StudentTabSkeleton variant="cards" />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {guardians.length === 1
              ? t("registered_count", { count: guardians.length })
              : t("registered_count_plural", { count: guardians.length })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowLinkModal(true)}
            leftIcon={<Search className="w-4 h-4" />}
            disabled={!canManageGuardians}
          >
            {t("link_existing")}
          </Button>
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={!canManageGuardians}
          >
            {t("add_guardian")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {primaryGuardian && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("primary_guardian")}
              </p>
              <p className="text-sm text-gray-600">
                {primaryGuardian.full_name} ({primaryGuardian.relation})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guardians List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {guardians.map((guardian) => (
          <div
            key={guardian.guardianId}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-hover flex items-center justify-center text-white font-bold shrink-0">
                  {getInitials(guardian.full_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {guardian.full_name}
                    </h3>
                    {guardian.is_primary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {getRelationBadge(guardian.relation)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer p-2 text-gray-600"
                  aria-label={t("edit_link")}
                  title={t("edit_link")}
                  onClick={() => openLinkEditor(guardian)}
                  disabled={!canManageGuardians}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                {!guardian.is_primary && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void handleUnlinkGuardian(guardian.guardianId)
                    }
                    className="p-2 text-red-500"
                    title="Unlink guardian from student"
                    disabled={!canManageGuardians}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 font-medium">
                    {formatPhoneNumber(guardian.phone_primary)}
                  </p>
                  {guardian.phone_secondary && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      {t("alt")}: {formatPhoneNumber(guardian.phone_secondary)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700 truncate">{guardian.email}</span>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <IdCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs">{t("national_id")}</p>
                  <p className="text-gray-700 font-mono text-xs">
                    {guardian.national_id}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700">{guardian.job_title}</p>
                  {guardian.workplace && (
                    <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {guardian.workplace}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {t("permissions")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                    guardian.can_pickup
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {guardian.can_pickup ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  <span>{t("can_pickup")}</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                    guardian.can_receive_notifications
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {guardian.can_receive_notifications ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  <span>{t("notifications")}</span>
                </div>
              </div>
            </div>

            {/* Primary Guardian Badge */}
            {guardian.is_primary && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3" />
                  {t("primary_guardian")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {guardians.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={t("no_guardians")}
            message={t("no_guardians_message")}
            action={
              <Button
                type="button"
                onClick={() => setShowAddModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={!canManageGuardians}
              >
                {t("add_guardian")}
              </Button>
            }
          />
        </div>
      )}

      {/* Statistics */}
      {guardians.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {t("guardian_summary")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {guardians.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("total_guardians")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {guardians.filter((g) => g.can_pickup).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("can_pickup")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {guardians.filter((g) => g.can_receive_notifications).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("get_notifications")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {guardians.filter((g) => g.is_primary).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("primary")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Guardian Modal */}
      <AddGuardianModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddGuardian}
      />

      {editingGuardian && (
        <Modal
          isOpen
          onClose={() => setEditingGuardian(null)}
          title={t("edit_link_title")}
          size="sm"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingGuardian(null)}
              >
                {t("add_guardian_modal.cancel")}
              </Button>
              <Button
                type="button"
                loading={isSavingLink}
                onClick={() => void saveGuardianLink()}
              >
                {t("save_link")}
              </Button>
            </>
          }
        >
          <div className="space-y-4 pb-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">
                {editingGuardian.full_name}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {t("edit_link_help")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              aria-pressed={editAsPrimary}
              className={`min-h-11 cursor-pointer justify-start rounded-lg border p-3 text-start transition-colors ${
                editAsPrimary
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200"
              }`}
              onClick={() => setEditAsPrimary((current) => !current)}
            >
              <Star
                className={`h-4 w-4 ${editAsPrimary ? "fill-current" : ""}`}
              />
              {t("mark_as_primary")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              aria-pressed={editCanPickup}
              className={`min-h-11 cursor-pointer justify-start rounded-lg border p-3 text-start transition-colors ${
                editCanPickup
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200"
              }`}
              onClick={() => setEditCanPickup((current) => !current)}
            >
              {t("can_pickup")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              aria-pressed={editCanReceiveNotifications}
              className={`min-h-11 cursor-pointer justify-start rounded-lg border p-3 text-start transition-colors ${
                editCanReceiveNotifications
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200"
              }`}
              onClick={() =>
                setEditCanReceiveNotifications((current) => !current)
              }
            >
              {t("notifications")}
            </Button>
          </div>
        </Modal>
      )}

      {showLinkModal && (
        <Modal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          title={t("link_existing_modal_title")}
          size="md"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLinkModal(false)}
              >
                {t("add_guardian_modal.cancel")}
              </Button>
              <Button
                type="submit"
                form="link-existing-guardian-form"
                disabled={!selectedGuardianId}
              >
                {t("link_guardian")}
              </Button>
            </>
          }
        >
          <form
            id="link-existing-guardian-form"
            onSubmit={handleLinkExistingGuardian}
            className="space-y-4 pb-4"
          >
            <Input
              label={t("search_guardians_label")}
              value={guardianSearch}
              onChange={(event) => setGuardianSearch(event.target.value)}
              placeholder={t("search_guardians_placeholder")}
            />

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {isSearchingGuardians ? (
                <p className="text-sm text-gray-500">{t("searching")}</p>
              ) : guardianSearchResults.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t("no_guardians_found")}
                </p>
              ) : (
                guardianSearchResults.map((guardian) => (
                  <Button
                    key={guardian.guardianId}
                    type="button"
                    variant="ghost"
                    fullWidth
                    className={`justify-start rounded-lg border p-3 text-left ${
                      selectedGuardianId === guardian.guardianId
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedGuardianId(guardian.guardianId)}
                  >
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {guardian.full_name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {guardian.relation} - {guardian.phone_primary}
                      </span>
                    </span>
                  </Button>
                ))
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              fullWidth
              className={`justify-start rounded-lg border p-3 text-left ${
                linkAsPrimary
                  ? "border-primary bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => setLinkAsPrimary((current) => !current)}
            >
              {t("mark_as_primary")}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
