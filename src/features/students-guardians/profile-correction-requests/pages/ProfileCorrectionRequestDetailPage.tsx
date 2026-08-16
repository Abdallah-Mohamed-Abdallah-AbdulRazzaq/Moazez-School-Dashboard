"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";
import type { ProfileCorrectionRequestDetail } from "@/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests";
import {
  approveProfileCorrectionRequest,
  fetchProfileCorrectionRequestById,
  rejectProfileCorrectionRequest,
} from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";
import { Button, TextArea } from "@/components/ui";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import ProfileCorrectionStatusBadge from "@/features/students-guardians/profile-correction-requests/components/ProfileCorrectionStatusBadge";
import { formatDateTime } from "@/utils/formatters/dateTime";

const profileCorrectionFieldTranslationKeys: Record<string, string> = {
  firstName: "field_firstName",
  fatherNameEn: "field_fatherNameEn",
  grandfatherNameEn: "field_grandfatherNameEn",
  lastName: "field_lastName",
  firstNameAr: "field_firstNameAr",
  fatherNameAr: "field_fatherNameAr",
  grandfatherNameAr: "field_grandfatherNameAr",
  familyNameAr: "field_familyNameAr",
  gender: "field_gender",
  birthDate: "field_birthDate",
  nationality: "field_nationality",
  studentPhone: "field_studentPhone",
  studentEmail: "field_studentEmail",
  addressLine: "field_addressLine",
  city: "field_city",
  district: "field_district",
};

interface ProfileCorrectionRequestDetailPageProps {
  requestId: string;
}

export default function ProfileCorrectionRequestDetailPage({
  requestId,
}: ProfileCorrectionRequestDetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const t = useTranslations("students_guardians.profile_correction_requests");
  const permissions = usePermissions();
  const {
    canViewProfileCorrectionRequests,
    canReviewProfileCorrectionRequests,
  } = getStudentsGuardiansCapabilities(permissions);
  const [request, setRequest] = useState<ProfileCorrectionRequestDetail | null>(
    null,
  );
  const [reviewerNote, setReviewerNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (!canViewProfileCorrectionRequests || !requestId) return;

    let isCancelled = false;

    const reloadRequest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProfileCorrectionRequestById(requestId);
        if (!isCancelled) setRequest(data);
      } catch (loadError) {
        if (!isCancelled) {
          setRequest(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load profile correction request.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void reloadRequest();

    return () => {
      isCancelled = true;
    };
  }, [canViewProfileCorrectionRequests, requestId]);

  const handleReview = async (action: "approve" | "reject") => {
    const confirmMessage =
      action === "approve" ? t("confirm_approve") : t("confirm_reject");
    if (!request || !window.confirm(confirmMessage)) return;

    setIsReviewing(true);
    setError(null);
    try {
      const nextRequest =
        action === "approve"
          ? await approveProfileCorrectionRequest(request.id, {
              reviewerNote: reviewerNote.trim() || undefined,
            })
          : await rejectProfileCorrectionRequest(request.id, {
              reviewerNote: reviewerNote.trim() || undefined,
            });
      setRequest(nextRequest);
      setReviewerNote("");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : `Failed to ${action} profile correction request.`,
      );
    } finally {
      setIsReviewing(false);
    }
  };

  if (!canViewProfileCorrectionRequests) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-600">
          {t("no_view_permission")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          router.push(`/${lang}/students-guardians/profile-correction-requests`)
        }
        leftIcon={<ChevronLeft className="h-4 w-4" />}
        className="w-fit"
      >
        {t("action_back")}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          {t("loading")}
        </div>
      ) : !request ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          {t("request_not_found")}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {t("detail_title")}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                  {request.studentName || request.studentId}
                </h1>
              </div>
              <ProfileCorrectionStatusBadge
                status={request.status}
                label={t(`status_${request.status.toLowerCase()}`)}
              />
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">
                  {t("detail_student_number")}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {request.studentNumber || request.studentId}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">
                  {t("detail_submitted_at")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(request.requestedAt, lang)}
                </dd>
              </div>
              {request.reviewedAt && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    {t("detail_resolved_at")}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(request.reviewedAt, lang)}
                  </dd>
                </div>
              )}
              {request.cancelledAt && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    {t("detail_cancelled_at")}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(request.cancelledAt, lang)}
                  </dd>
                </div>
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs font-medium text-gray-500">
                  {t("detail_reason")}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-900">
                  {request.reason || "—"}
                </dd>
              </div>
              {request.reviewerNote && request.status !== "PENDING" && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-xs font-medium text-gray-500">
                    {t("detail_reviewer_note")}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-900">
                    {request.reviewerNote}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
              <h2 className="font-semibold text-gray-900">
                {t("detail_changes")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("detail_changes_count", { count: request.changeCount })}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">{t("table_field")}</th>
                    <th className="px-4 py-3">{t("table_current")}</th>
                    <th className="px-4 py-3">{t("table_requested")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {request.changes.map((change) => (
                    <tr key={change.field}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {profileCorrectionFieldTranslationKeys[change.field]
                          ? t(profileCorrectionFieldTranslationKeys[change.field])
                          : change.label}
                      </td>
                      <td className="bg-red-50/40 px-4 py-3 text-gray-600">
                        {change.currentValue}
                      </td>
                      <td className="bg-emerald-50/50 px-4 py-3 font-medium text-gray-900">
                        {change.requestedValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {request.status === "PENDING" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">
                {t("detail_review_action")}
              </h2>
              <TextArea
                label={t("detail_reviewer_note")}
                rows={3}
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
                disabled={!canReviewProfileCorrectionRequests || isReviewing}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="success"
                  disabled={!canReviewProfileCorrectionRequests || isReviewing}
                  loading={isReviewing}
                  onClick={() => void handleReview("approve")}
                >
                  {t("action_approve")}
                </Button>
                <Button
                  variant="danger"
                  disabled={!canReviewProfileCorrectionRequests || isReviewing}
                  loading={isReviewing}
                  onClick={() => void handleReview("reject")}
                >
                  {t("action_reject")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
