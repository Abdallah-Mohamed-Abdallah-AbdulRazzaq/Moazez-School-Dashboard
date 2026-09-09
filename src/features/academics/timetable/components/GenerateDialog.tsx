"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import type { TimetableGenerationViewModel } from "@/features/academics/timetable/services/timetableGenerationPresentation";

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: () => Promise<unknown>;
  configName: string;
  scopeName: string;
  classroomCount: number | null;
  isGenerating: boolean;
  result: TimetableGenerationViewModel | null;
  error: string | null;
  onOpenValidation: () => void;
}

export default function GenerateDialog({
  open,
  onClose,
  onGenerate,
  configName,
  scopeName,
  classroomCount,
  isGenerating,
  result,
  error,
  onOpenValidation,
}: GenerateDialogProps) {
  const t = useTranslations("academics.timetable.generate");
  const isResultVisible = result !== null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("title")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isGenerating}>
            {isResultVisible ? t("close") : t("cancel")}
          </Button>
          {isResultVisible ? (
            <Button onClick={onOpenValidation} variant="primary">
              {t("openValidation")}
            </Button>
          ) : (
            <Button onClick={() => void onGenerate()} loading={isGenerating}>
              {t("generate")}
            </Button>
          )}
        </>
      }
    >
      {isResultVisible ? (
        <GenerationResult result={result} />
      ) : (
        <GenerationConfirmation
          configName={configName}
          scopeName={scopeName}
          classroomCount={classroomCount}
          isGenerating={isGenerating}
          error={error}
        />
      )}
    </Modal>
  );
}

function GenerationConfirmation({
  configName,
  scopeName,
  classroomCount,
  isGenerating,
  error,
}: Pick<
  GenerateDialogProps,
  "configName" | "scopeName" | "classroomCount" | "isGenerating" | "error"
>) {
  const t = useTranslations("academics.timetable.generate");
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">{t("description")}</p>
      <dl className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">
        <ScopeDetail label={t("configLabel")} value={configName} />
        <ScopeDetail label={t("scopeLabel")} value={scopeName} />
        {classroomCount !== null && (
          <ScopeDetail label={t("classroomCount")} value={String(classroomCount)} />
        )}
      </dl>
      <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("persistenceWarning")}</span>
      </div>
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-gray-700" role="status">
          <Clock3 className="h-4 w-4 animate-pulse" aria-hidden="true" />
          {t("generating")}
        </div>
      )}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}

function ScopeDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-gray-500">{label}</dt><dd className="font-medium text-gray-900">{value}</dd></div>;
}

function GenerationResult({ result }: { result: TimetableGenerationViewModel }) {
  const t = useTranslations("academics.timetable.generate");
  const isComplete = result.status === "complete";
  return (
    <div className="space-y-4">
      <div className={`flex gap-2 rounded-lg border p-3 text-sm ${isComplete ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-900"}`} role="status">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t(`result.${result.status}`)}</span>
      </div>
      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-4 text-sm">
        <ScopeDetail label={t("result.createdCount")} value={String(result.createdCount)} />
        <ScopeDetail label={t("result.existingCount")} value={String(result.existingCount)} />
        <ScopeDetail label={t("result.remainingDemandCount")} value={String(result.remainingDemandCount)} />
      </dl>
      {result.groups.map((group) => (
        <section key={group.classroomId ?? "unassigned"} className="rounded-lg border border-gray-200 p-3">
          <h3 className="font-semibold text-gray-900">{group.classroomName}</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {group.items.map((unresolved) => (
              <li key={`${unresolved.code}:${unresolved.subjectId ?? "unassigned"}`} className="rounded bg-amber-50 p-2">
                <p className="font-medium">{unresolved.subjectName}</p>
                <p>{t(`unresolved.${unresolved.messageKey}`)}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
