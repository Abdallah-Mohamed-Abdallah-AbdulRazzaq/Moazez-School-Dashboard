"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  createBulkRegistration,
  downloadBulkRegistrationTemplate,
  preflightBulkRegistration,
} from "@/features/students-guardians/bulk-registration/api/bulkRegistrationApi";
import type {
  BulkRegistrationPlacementInput,
  BulkRegistrationPreflight,
} from "@/features/students-guardians/bulk-registration/api/bulkRegistrationDtos";
import BulkRegistrationPlacementForm, {
  type BulkRegistrationPlacementState,
} from "@/features/students-guardians/bulk-registration/components/BulkRegistrationPlacementForm";
import BulkRegistrationPreflightSummary from "@/features/students-guardians/bulk-registration/components/BulkRegistrationPreflightSummary";
import BulkRegistrationUploadPanel from "@/features/students-guardians/bulk-registration/components/BulkRegistrationUploadPanel";

const emptyPlacement: BulkRegistrationPlacementState = {
  academicYearId: "",
  termId: "",
  academic: {},
  enrollmentDate: null,
};

const copy = {
  en: {
    eyebrow: "Students and guardians",
    title: "Bulk student registration",
    description:
      "Prepare an academic placement, download the canonical CSV, and start backend validation.",
    milestones: [
      "Placement and preflight",
      "Template and CSV upload",
      "Validation and error review",
      "Confirmation and provisioning",
      "Final result and credential handoff",
    ],
    step: "Step",
    of: "of",
    milestoneState: {
      complete: "Complete",
      current: "Current",
      upcoming: "Upcoming",
    },
    loadError: "Academic options could not be loaded.",
    preflightError: "Placement could not be checked.",
    downloadSuccess: "CSV template downloaded.",
    downloadError: "CSV template could not be downloaded.",
    uploadSuccess: "CSV uploaded. Validation is starting.",
    uploadError: "CSV could not be uploaded.",
  },
  ar: {
    eyebrow: "الطلاب وأولياء الأمور",
    title: "التسجيل الجماعي للطلاب",
    description:
      "جهّز التسكين الأكاديمي، ونزّل ملف CSV المعتمد، ثم ابدأ تحقق الخادم.",
    milestones: [
      "التسكين والتحقق المسبق",
      "القالب ورفع CSV",
      "التحقق ومراجعة الأخطاء",
      "التأكيد وإنشاء السجلات",
      "النتيجة النهائية وإنشاء بيانات الدخول",
    ],
    step: "الخطوة",
    of: "من",
    milestoneState: {
      complete: "مكتملة",
      current: "الحالية",
      upcoming: "القادمة",
    },
    loadError: "تعذر تحميل الخيارات الأكاديمية.",
    preflightError: "تعذر التحقق من التسكين.",
    downloadSuccess: "تم تنزيل قالب CSV.",
    downloadError: "تعذر تنزيل قالب CSV.",
    uploadSuccess: "تم رفع CSV وبدأ التحقق.",
    uploadError: "تعذر رفع ملف CSV.",
  },
} as const;

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function placementInput(
  placement: BulkRegistrationPlacementState,
): BulkRegistrationPlacementInput | null {
  if (
    !placement.academicYearId ||
    !placement.academic.classroomId ||
    !placement.enrollmentDate ||
    Number.isNaN(placement.enrollmentDate.getTime())
  ) {
    return null;
  }
  return {
    academicYearId: placement.academicYearId,
    ...(placement.termId ? { termId: placement.termId } : {}),
    classroomId: placement.academic.classroomId,
    enrollmentDate: formatLocalDate(placement.enrollmentDate),
  };
}

export default function BulkRegistrationStartPage() {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const { showError, showSuccess } = useToast();
  const [placement, setPlacement] =
    useState<BulkRegistrationPlacementState>(emptyPlacement);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [structureTree, setStructureTree] = useState<StructureTree | null>(null);
  const [preflight, setPreflight] = useState<BulkRegistrationPreflight | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [checkingPlacement, setCheckingPlacement] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const preflightRequestId = useRef(0);

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
    if (!placement.academicYearId) {
      setTerms([]);
      return () => {
        active = false;
      };
    }
    setTerms([]);
    setStructureTree(null);
    setLoadingTerms(true);
    fetchTermsByYear(placement.academicYearId)
      .then((nextTerms) => {
        if (active) setTerms(nextTerms);
      })
      .catch(() => {
        if (active) showError(text.loadError);
      })
      .finally(() => {
        if (active) setLoadingTerms(false);
      });
    return () => {
      active = false;
    };
  }, [placement.academicYearId, showError, text.loadError]);

  useEffect(() => {
    let active = true;
    const structureTermId =
      placement.termId ||
      terms.find((term) => term.status === "open")?.id ||
      terms[0]?.id;
    if (!placement.academicYearId || !structureTermId) {
      setStructureTree(null);
      return () => {
        active = false;
      };
    }
    setLoadingStructure(true);
    fetchStructureTree(placement.academicYearId, structureTermId)
      .then((tree) => {
        if (active) setStructureTree(tree);
      })
      .catch(() => {
        if (active) showError(text.loadError);
      })
      .finally(() => {
        if (active) setLoadingStructure(false);
      });
    return () => {
      active = false;
    };
  }, [placement.academicYearId, placement.termId, showError, terms, text.loadError]);

  const academicOptions = useMemo<AcademicStudentCascadeOptions>(
    () => ({
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
    }),
    [structureTree],
  );
  const validPreflight = Boolean(
    preflight?.valid && preflight.placement && preflight.studentSeat,
  );
  const loadingOptions = loadingTerms || loadingStructure;

  const changePlacement = (nextPlacement: BulkRegistrationPlacementState) => {
    preflightRequestId.current += 1;
    setPlacement(nextPlacement);
    setPreflight(null);
    setSelectedFile(null);
    setCheckingPlacement(false);
  };

  const checkPlacement = async () => {
    const input = placementInput(placement);
    if (!input) return;
    const requestId = ++preflightRequestId.current;
    setCheckingPlacement(true);
    try {
      const nextPreflight = await preflightBulkRegistration(input);
      if (requestId === preflightRequestId.current) {
        setPreflight(nextPreflight);
      }
    } catch {
      if (requestId === preflightRequestId.current) {
        showError(text.preflightError);
      }
    } finally {
      if (requestId === preflightRequestId.current) {
        setCheckingPlacement(false);
      }
    }
  };

  const downloadTemplate = async () => {
    if (!validPreflight) return;
    setDownloadingTemplate(true);
    try {
      await downloadBulkRegistrationTemplate();
      showSuccess(text.downloadSuccess);
    } catch {
      showError(text.downloadError);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const uploadCsv = async () => {
    const input = placementInput(placement);
    if (!validPreflight || !input || !selectedFile) return;
    setUploading(true);
    try {
      const batch = await createBulkRegistration(input, selectedFile);
      showSuccess(text.uploadSuccess);
      const lang = typeof params.lang === "string" ? params.lang : locale;
      router.replace(
        `/${lang}/students-guardians/bulk-registration/${batch.id}`,
      );
    } catch {
      showError(text.uploadError);
    } finally {
      setUploading(false);
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

        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {text.milestones.map((milestone, index) => {
            const activeMilestone = validPreflight ? 1 : 0;
            const state =
              index < activeMilestone
                ? "complete"
                : index === activeMilestone
                  ? "current"
                  : "upcoming";
            return (
              <li
                key={milestone}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`${text.step} ${index + 1} ${text.of} ${text.milestones.length}: ${milestone}. ${text.milestoneState[state]}`}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${
                  state === "complete"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : state === "current"
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                <span aria-hidden="true">{state === "complete" ? "✓" : `${index + 1}.`}</span>
                <span>{milestone}</span>
                <span className="ms-auto text-xs" aria-hidden="true">
                  {text.milestoneState[state]}
                </span>
              </li>
            );
          })}
        </ol>

        {loadingYears ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <PartialLoader />
          </div>
        ) : (
          <BulkRegistrationPlacementForm
            placement={placement}
            academicYears={academicYears}
            terms={terms}
            academicOptions={academicOptions}
            loadingOptions={loadingOptions}
            checkingPlacement={checkingPlacement}
            onChange={changePlacement}
            onCheckPlacement={checkPlacement}
          />
        )}

        <BulkRegistrationPreflightSummary
          preflight={preflight}
          retrying={checkingPlacement}
          onRetry={checkPlacement}
        />

        <BulkRegistrationUploadPanel
          key={[
            placement.academicYearId,
            placement.termId,
            placement.academic.stageId,
            placement.academic.gradeId,
            placement.academic.sectionId,
            placement.academic.classroomId,
            placement.enrollmentDate?.getTime(),
          ].join(":")}
          enabled={validPreflight}
          selectedFile={selectedFile}
          downloadingTemplate={downloadingTemplate}
          uploading={uploading}
          onDownloadTemplate={downloadTemplate}
          onFileChange={setSelectedFile}
          onUpload={uploadCsv}
        />
      </div>
    </div>
  );
}
