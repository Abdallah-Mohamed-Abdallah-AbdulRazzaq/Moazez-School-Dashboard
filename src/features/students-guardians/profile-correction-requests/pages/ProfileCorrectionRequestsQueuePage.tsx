"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";
import type {
  ProfileCorrectionRequestListItem,
  ProfileCorrectionRequestStatus,
} from "@/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests";
import { fetchProfileCorrectionRequests } from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";
import { Select, Button, DataTable, type Column } from "@/components/ui";
import { useTranslations } from "next-intl";
import ProfileCorrectionStatusBadge from "@/features/students-guardians/profile-correction-requests/components/ProfileCorrectionStatusBadge";
import { formatDateTime } from "@/utils/formatters/dateTime";

export default function ProfileCorrectionRequestsQueuePage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const t = useTranslations("students_guardians.profile_correction_requests");
  const permissions = usePermissions();
  const { canViewProfileCorrectionRequests } =
    getStudentsGuardiansCapabilities(permissions);
  const [status, setStatus] = useState<ProfileCorrectionRequestStatus | "all">(
    "PENDING",
  );
  const [studentId, setStudentId] = useState("");
  const [requests, setRequests] = useState<ProfileCorrectionRequestListItem[]>(
    [],
  );
  const [allRequests, setAllRequests] = useState<
    ProfileCorrectionRequestListItem[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all requests once on mount to populate student dropdown options
  useEffect(() => {
    if (!canViewProfileCorrectionRequests) {
      return;
    }

    let isCancelled = false;

    const loadAllRequests = async () => {
      try {
        const data = await fetchProfileCorrectionRequests({ status: "all" });
        if (!isCancelled) setAllRequests(data);
      } catch {
        // Ignore background prefetch error for dropdown options
      }
    };

    void loadAllRequests();

    return () => {
      isCancelled = true;
    };
  }, [canViewProfileCorrectionRequests]);

  useEffect(() => {
    if (!canViewProfileCorrectionRequests) {
      return;
    }

    let isCancelled = false;

    const loadRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchProfileCorrectionRequests({
          status,
          studentId: studentId.trim() || undefined,
        });
        if (!isCancelled) setRequests(data);
      } catch (loadError) {
        if (!isCancelled) {
          setRequests([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load profile correction requests.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadRequests();

    return () => {
      isCancelled = true;
    };
  }, [canViewProfileCorrectionRequests, status, studentId]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, string>();
    [...allRequests, ...requests].forEach((req) => {
      if (req.studentId) {
        // Show student name only (fallback to studentId if name is missing)
        map.set(req.studentId, req.studentName || req.studentId);
      }
    });

    const opts = Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: name, // Display name ONLY
    }));

    return [{ value: "all", label: t("status_all") }, ...opts];
  }, [allRequests, requests, t]);

  const pendingCount = useMemo(
    () =>
      allRequests.filter((request) => request.status === "PENDING").length,
    [allRequests],
  );

  const columns: Column<
    ProfileCorrectionRequestListItem & { [key: string]: unknown }
  >[] = [
    {
      key: "student",
      label: t("column_student"),
      render: (_, request) => (
        <div>
          <div className="font-medium text-gray-900">
            {request.studentName || request.studentId}
          </div>
          <div className="text-xs text-gray-500">
            {request.studentNumber || request.studentId}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: t("column_status"),
      render: (_, request) => (
        <ProfileCorrectionStatusBadge
          status={request.status}
          label={t(`status_${request.status.toLowerCase()}`)}
        />
      ),
    },
    {
      key: "changeCount",
      label: t("column_changes"),
    },
    {
      key: "requestedAt",
      label: t("column_requested"),
      render: (_, request) =>
        request.requestedAt ? formatDateTime(request.requestedAt, lang) : "—",
    },
    {
      key: "actions",
      label: t("column_action"),
      render: (_, request) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(
              `/${lang}/students-guardians/profile-correction-requests/${request.id}`,
            );
          }}
        >
          {t("action_open")}
        </Button>
      ),
    },
  ];

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
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">
          {t("students_guardians")}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t("subtitle", { count: pendingCount })}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select
            label={t("status")}
            value={status}
            onChange={(val) =>
              setStatus(val as ProfileCorrectionRequestStatus | "all")
            }
            options={[
              { value: "PENDING", label: t("status_pending") },
              { value: "APPROVED", label: t("status_approved") },
              { value: "REJECTED", label: t("status_rejected") },
              { value: "CANCELLED", label: t("status_cancelled") },
              { value: "all", label: t("status_all") },
            ]}
          />
          <Select
            label={t("student_id")}
            value={studentId || "all"}
            onChange={(val) => setStudentId(val === "all" ? "" : val)}
            options={studentOptions}
            searchable={true}
            placeholder={t("optional")}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable<ProfileCorrectionRequestListItem & { [key: string]: unknown }>
        columns={columns}
        data={
          requests as (ProfileCorrectionRequestListItem & {
            [key: string]: unknown;
          })[]
        }
        isLoading={isLoading}
        onRowClick={(request) =>
          router.push(
            `/${lang}/students-guardians/profile-correction-requests/${request.id}`,
          )
        }
        emptyTitle={t("no_requests_found")}
        emptyDescription={t("no_requests_description")}
      />
    </div>
  );
}
