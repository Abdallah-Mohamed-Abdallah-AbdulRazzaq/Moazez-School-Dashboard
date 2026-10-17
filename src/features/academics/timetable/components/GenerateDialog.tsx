"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Circle, ListChecks, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import GenerationResult from "./GenerationResult";
import type { TimetableGenerationViewModel } from "@/features/academics/timetable/services/timetableGenerationPresentation";

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: () => Promise<unknown>;
  configName: string;
  scopeName: string;
  classroomCount: number | null;
  activeDayCount?: number;
  instructionalPeriodCount?: number;
  blockingReason?: string | null;
  isGenerating: boolean;
  phase?: "generating" | "refreshing" | null;
  result: TimetableGenerationViewModel | null;
  error: string | null;
  refreshFailed?: boolean;
  onRetryRefresh?: () => Promise<void>;
  onOpenValidation: () => void;
}

const actionClassName = "min-h-11 min-w-0 flex-1 sm:flex-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none";

export default function GenerateDialog(props: GenerateDialogProps) {
  const t = useTranslations("academics.timetable.generate");
  const { open, onClose, isGenerating, result, refreshFailed, error, blockingReason } = props;
  return (
    <Modal

      isOpen={open}
      onClose={onClose}
      title={t(result ? "resultTitle" : "title")}
      description={result || isGenerating ? undefined : t("description")}
      icon={result ? <ListChecks className="h-6 w-6" aria-hidden="true" /> : <Sparkles className="h-6 w-6" aria-hidden="true" />}
      variant="confirm"
      size="lg"
      className="motion-reduce:animate-none! motion-reduce:transition-none"
      showCloseButton={!isGenerating}
      closeOnEscape={!isGenerating}
      closeOnOverlayClick={false}
      footer={<GenerationActions {...props} />}
    >
      <div className="space-y-5 pb-4 text-start">
        <GenerationScope {...props} />
        {isGenerating ? (
          <GenerationProgress phase={props.phase ?? "generating"} />
        ) : result ? (
          <>
            {refreshFailed && <GenerationNotice tone="warning" title={t("refreshFailedTitle")} message={t("refreshFailedDescription")} />}
            <GenerationResult result={result} />
          </>
        ) : (
          <>
            <GenerationExpectations />
            {blockingReason && <GenerationNotice tone="warning" title={t("beforeGenerating")} message={blockingReason} />}
            {error && <GenerationNotice tone="error" title={t("failedTitle")} message={error} />}
          </>
        )}
      </div>
    </Modal>
  );
}

function GenerationActions({ onClose, onGenerate, onOpenValidation, onRetryRefresh, isGenerating, result, refreshFailed, blockingReason, error }: GenerateDialogProps) {
  const t = useTranslations("academics.timetable.generate");
  return (
    <div className="flex w-full flex-wrap justify-end gap-3">
      <Button className={actionClassName} onClick={onClose} variant="secondary" disabled={isGenerating}>
        {result ? t("close") : blockingReason ? t("backToTimetable") : t("cancel")}
      </Button>
      {result && refreshFailed ? (
        <Button className={actionClassName} onClick={() => void onRetryRefresh?.()} loading={isGenerating} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
          {t("retryRefresh")}
        </Button>
      ) : result ? (
        <Button className={actionClassName} onClick={onOpenValidation} disabled={isGenerating} leftIcon={<ListChecks className="h-4 w-4" aria-hidden="true" />}>
          {t("openValidation")}
        </Button>
      ) : (
        <Button className={actionClassName} onClick={() => void onGenerate()} disabled={Boolean(blockingReason)} loading={isGenerating} leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
          {error ? t("retryGeneration") : t("generate")}
        </Button>
      )}
    </div>
  );
}

function GenerationScope({ configName, scopeName, classroomCount, activeDayCount, instructionalPeriodCount, result, isGenerating }: GenerateDialogProps) {
  const t = useTranslations("academics.timetable.generate");
  const locale = useLocale();
  const formatCount = (count: number) => new Intl.NumberFormat(locale).format(count);
  const isCompact = result !== null || isGenerating;
  return (
    <section className="overflow-hidden rounded-2xl border border-primary-200 bg-primary-50" aria-label={t("scopeLabel")}>
      <dl className={`grid gap-4 p-4 sm:grid-cols-2 sm:p-5 ${isCompact ? "grid-cols-2" : ""}`}>
        <ScopeDetail label={t("configLabel")} value={configName} />
        <ScopeDetail label={t("scopeLabel")} value={scopeName} />
      </dl>
      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-primary-200 px-4 py-3 text-sm sm:px-5">
        {classroomCount !== null && <ScopeDetail label={t("classroomCount")} value={formatCount(classroomCount)} />}
        {!isCompact && activeDayCount !== undefined && <ScopeDetail label={t("activeDays")} value={formatCount(activeDayCount)} />}
        {!isCompact && instructionalPeriodCount !== undefined && <ScopeDetail label={t("instructionalPeriods")} value={formatCount(instructionalPeriodCount)} />}
      </dl>
    </section>
  );
}

function ScopeDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function GenerationExpectations() {
  const t = useTranslations("academics.timetable.generate");
  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("whatToExpect")}</h3>
      <ul className="space-y-3 text-sm leading-relaxed text-gray-700">
        {["preserveLessons", "useWholeScope", "reviewBeforePublish"].map((key) => (
          <li key={key} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
      <p className="rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-600">{t("persistenceWarning")}</p>
    </section>
  );
}

function GenerationProgress({ phase }: { phase: "generating" | "refreshing" }) {
  const t = useTranslations("academics.timetable.generate");
  const progressRef = useRef<HTMLElement>(null);
  useEffect(() => progressRef.current?.focus(), []);
  return (
    <section ref={progressRef} tabIndex={0} className="rounded-2xl border border-primary-200 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" role="status" aria-live="polite" aria-atomic="true">
      <h3 className="font-semibold text-gray-900">{t(phase === "refreshing" ? "refreshing" : "generating")}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{t("progressDescription")}</p>
      <ol className="mt-5 space-y-3 text-sm">
        {["generating", "refreshing"].map((step) => {
          const isFinished = step === "generating" && phase === "refreshing";
          const isCurrent = step === phase;
          const StepIcon = isFinished ? CheckCircle2 : isCurrent ? LoaderCircle : Circle;
          return (
            <li key={step} className={`flex items-center gap-3 ${isCurrent || isFinished ? "text-primary-700" : "text-gray-500"}`} aria-current={isCurrent ? "step" : undefined}>
              <StepIcon className={`h-5 w-5 shrink-0 ${isCurrent ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
              <span>{t(`steps.${step}`)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function GenerationNotice({ title, message, tone }: { title: string; message: string; tone: "warning" | "error" }) {
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-xl border p-4 ${tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 break-words text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
