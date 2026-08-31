"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import type { AcademicStudentCascadeOptions } from "@/components/ui/academic/AcademicStudentCascade";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAcademicYears,
  fetchStructureTree,
  fetchTermsByYear,
  type AcademicYear,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { usePermissions } from "@/hooks/usePermissions";
import { createCredentialBatch } from "../api/credentialBatchApi";
import CredentialAudienceForm from "../components/CredentialAudienceForm";
import CredentialAudiencePreview, {
  type CredentialAudiencePreviewSnapshot,
} from "../components/CredentialAudiencePreview";
import CredentialModeForm, {
  type CredentialModeSubmission,
} from "../components/CredentialModeForm";
import type { SelectedCredentialStudent } from "../components/SelectedStudentsPicker";
import {
  buildCredentialAudience,
  getCredentialAudienceKey,
  type CredentialAudienceDraft,
} from "../model/credentialAudience";

const copy = {
  en: {
    eyebrow: "Students and guardians",
    title: "Student credentials",
    description:
      "Choose an audience, verify the eligible students, then create temporary credentials.",
    milestones: ["Choose audience", "Preview eligibility", "Create credentials"],
    loadError: "Academic options could not be loaded.",
    createSuccess: "Credential creation started.",
    createError: "Credentials could not be created.",
    viewOnly: "You can preview audiences but cannot create credentials.",
  },
  ar: {
    eyebrow: "الطلاب وأولياء الأمور",
    title: "بيانات دخول الطلاب",
    description:
      "اختر نطاق الطلاب، وتحقق من المؤهلين، ثم أنشئ بيانات دخول مؤقتة.",
    milestones: ["اختيار النطاق", "معاينة المؤهلين", "إنشاء بيانات الدخول"],
    loadError: "تعذر تحميل الخيارات الأكاديمية.",
    createSuccess: "بدأ إنشاء بيانات الدخول.",
    createError: "تعذر إنشاء بيانات الدخول.",
    viewOnly: "يمكنك معاينة النطاقات، لكن لا يمكنك إنشاء بيانات الدخول.",
  },
} as const;

function initialAudienceDraft(
  sourceRegistrationBatchId: string | null,
): CredentialAudienceDraft {
  return sourceRegistrationBatchId
    ? { audienceMode: "import_batch", sourceRegistrationBatchId }
    : { audienceMode: "missing_password" };
}

function toAcademicOptions(
  structureTree: StructureTree | null,
): AcademicStudentCascadeOptions {
  return {
    stages: (structureTree?.stages ?? []).map(
      ({ id, name, nameAr, nameEn }) => ({ id, name, nameAr, nameEn }),
    ),
    grades: (structureTree?.grades ?? []).map(
      ({ id, name, nameAr, nameEn, stageId }) => ({
        id,
        name,
        nameAr,
        nameEn,
        stageId,
      }),
    ),
    sections: (structureTree?.sections ?? []).map(
      ({ id, name, nameAr, nameEn, gradeId }) => ({
        id,
        name,
        nameAr,
        nameEn,
        gradeId,
      }),
    ),
    classrooms: (structureTree?.classrooms ?? []).map(
      ({ id, name, nameAr, nameEn, sectionId }) => ({
        id,
        name,
        nameAr,
        nameEn,
        sectionId,
      }),
    ),
  };
}

export default function CredentialsStartPage() {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const params = useParams<{ lang?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const { hasAllPermissions, isPermissionsReady } = usePermissions();
  const [draft, setDraft] = useState<CredentialAudienceDraft>(() =>
    initialAudienceDraft(searchParams.get("sourceRegistrationBatchId")),
  );
  const [selectedStudents, setSelectedStudents] = useState<
    SelectedCredentialStudent[]
  >([]);
  const [snapshot, setSnapshot] =
    useState<CredentialAudiencePreviewSnapshot | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [structureTree, setStructureTree] = useState<StructureTree | null>(null);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingStructure, setLoadingStructure] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAcademicYears()
      .then((years) => {
        if (active) setAcademicYears(years);
      })
      .catch(() => {
        if (active) showError(text.loadError);
      })
      .finally(() => {
        if (active) setLoadingYears(false);
      });
    return () => {
      active = false;
    };
  }, [showError, text.loadError]);

  useEffect(() => {
    let active = true;
    if (!draft.academicYearId) {
      return () => {
        active = false;
      };
    }

    fetchTermsByYear(draft.academicYearId)
      .then((terms) => {
        const termId =
          terms.find((term) => term.status === "open")?.id ?? terms[0]?.id;
        return termId
          ? fetchStructureTree(draft.academicYearId as string, termId)
          : null;
      })
      .then((tree) => {
        if (active) setStructureTree(tree);
      })
      .catch(() => {
        if (active) {
          setStructureTree(null);
          showError(text.loadError);
        }
      })
      .finally(() => {
        if (active) setLoadingStructure(false);
      });

    return () => {
      active = false;
    };
  }, [draft.academicYearId, showError, text.loadError]);

  const academicOptions = useMemo(
    () => toAcademicOptions(structureTree),
    [structureTree],
  );
  const audience = useMemo(() => buildCredentialAudience(draft), [draft]);
  const previewIsFresh = Boolean(
    audience &&
      snapshot?.audienceKey === getCredentialAudienceKey(audience) &&
      snapshot.result.eligible > 0,
  );
  const canManage =
    isPermissionsReady &&
    hasAllPermissions(["students.records.view", "settings.users.manage"]);
  const activeMilestone = previewIsFresh ? 2 : snapshot ? 1 : 0;

  const changeDraft = (nextDraft: CredentialAudienceDraft) => {
    if (nextDraft.academicYearId !== draft.academicYearId) {
      setStructureTree(null);
      setLoadingStructure(Boolean(nextDraft.academicYearId));
    }
    setDraft(nextDraft);
    setSnapshot(null);
  };

  const createBatch = async (submission: CredentialModeSubmission) => {
    if (!audience || !previewIsFresh || !canManage) return;
    try {
      const batch = await createCredentialBatch({ audience, ...submission });
      showSuccess(text.createSuccess);
      const lang = typeof params.lang === "string" ? params.lang : locale;
      router.replace(`/${lang}/students-guardians/credentials/${batch.id}`);
    } catch (error) {
      showError(text.createError);
      throw error;
    }
  };

  return (
    <div
      className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-primary">{text.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {text.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            {text.description}
          </p>
        </header>

        <ol className="grid gap-2 sm:grid-cols-3">
          {text.milestones.map((milestone, index) => (
            <li
              key={milestone}
              className={`rounded-xl border p-3 text-sm font-medium ${
                index <= activeMilestone
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              <span className="me-2">{index + 1}.</span>
              {milestone}
            </li>
          ))}
        </ol>

        {loadingYears ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <PartialLoader />
          </div>
        ) : (
          <CredentialAudienceForm
            draft={draft}
            selectedStudents={selectedStudents}
            academicYears={academicYears}
            academicOptions={academicOptions}
            loadingOptions={loadingStructure}
            onChange={changeDraft}
            onSelectedStudentsChange={setSelectedStudents}
          />
        )}

        <CredentialAudiencePreview
          audience={audience}
          snapshot={snapshot}
          onChange={setSnapshot}
        />

        {canManage ? (
          <CredentialModeForm enabled={previewIsFresh} onSubmit={createBatch} />
        ) : isPermissionsReady ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {text.viewOnly}
          </p>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <PartialLoader />
          </div>
        )}
      </div>
    </div>
  );
}
