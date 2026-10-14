"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { loadHomeworkBatchContext } from "../services/homeworkImportBatchContext";
import { saveHomeworkImportBatch } from "../services/homeworkImportBatchSave";
import { prepareHomeworkDraftQuestions } from "../utils/homeworkQuestionDraftValidation";
import type { HomeworkDraftValidationContext, HomeworkQuestionDraft } from "../utils/homeworkQuestionDraft.types";
import { homeworkBatchPlan } from "../utils/homeworkImportBatchTargets";
import type { HomeworkBatchContext, HomeworkBatchDraftValidation, HomeworkBatchPageState, HomeworkBatchPlan, HomeworkBatchResult, HomeworkBatchSelection } from "../utils/homeworkImportBatch.types";

export interface HomeworkImportBatchPanelProps {
  questionDraft: HomeworkQuestionDraft; origin: "none" | "manual" | "excel";
  validateDraft: (draft: HomeworkQuestionDraft, context: HomeworkDraftValidationContext) => HomeworkBatchDraftValidation;
  publishAt?: string | null;
  academicYearId: string; termId: string; termStart: string; termEnd: string; writable: boolean;
  initialSubjectId?: string; initialClassroomId?: string;
  onStateChange: (state: HomeworkBatchPageState) => void; onReset: () => void;
  onCancel?: () => void;
  onReturnAfterCompletion?: () => void;
}

export function homeworkBatchEditorUrl(locale: string, plan: HomeworkBatchPlan, homeworkId?: string) {
  const params = new URLSearchParams({ year: plan.academicYearId, term: plan.termId });
  return `/${locale}/academics/homework${homeworkId ? `/${homeworkId}` : ""}?${params}`;
}

function openCreatedAssignment(locale: string, plan: HomeworkBatchPlan, outcome: HomeworkBatchResult) {
  if (outcome.status !== "created") return;
  try { window.open(homeworkBatchEditorUrl(locale, plan, outcome.assignment.id), "_blank", "noopener,noreferrer"); }
  catch { /* Browser restrictions do not change a saved assignment; the results retain its link. */ }
}

export function useHomeworkImportBatch(props: HomeworkImportBatchPanelProps) {
  const locale = useLocale();
  const { onStateChange } = props;
  const [context, setContext] = useState<HomeworkBatchContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<"loadError" | "changed" | null>(null);
  const [draftValidation, setDraftValidation] = useState<{ draft: string; validation: HomeworkBatchDraftValidation } | null>(null);
  const validation: HomeworkBatchDraftValidation = draftValidation?.draft === JSON.stringify(props.questionDraft) ? draftValidation.validation : { kind: "valid" };
  const [subjectId, setSubjectId] = useState(props.initialSubjectId ?? "");
  const [selection, setSelection] = useState<HomeworkBatchSelection>({ type: "classes", classroomIds: props.initialClassroomId ? [props.initialClassroomId] : [] });
  const [outcomes, setOutcomes] = useState<HomeworkBatchResult[]>([]);
  const [frozenPlan, setFrozenPlan] = useState<HomeworkBatchPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [openInNewTabs, setOpenInNewTabs] = useState(true);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  const latestProps = useRef(props);
  latestProps.current = props;
  const started = frozenPlan !== null;
  const plan = useMemo(() => frozenPlan ?? (context ? homeworkBatchPlan({ academicYearId: props.academicYearId, termId: props.termId, subjectId, selection, context, locale }) : null), [frozenPlan, context, props.academicYearId, props.termId, subjectId, selection, locale]);
  const eligibleCount = plan?.rows.filter(row => row.eligible).length ?? 0;
  const allCreated = started && !saving && outcomes.filter(outcome => outcome.status === "created").length === eligibleCount;

  useEffect(() => {
    if (started) return;
    let active = true;
    setLoading(true); setContext(null); setNotice(null);
    void loadHomeworkBatchContext({ academicYearId: props.academicYearId, termId: props.termId })
      .then(loaded => { if (active) setContext(loaded); })
      .catch(() => { if (active) setNotice("loadError"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [props.academicYearId, props.termId, reload, started]);

  useEffect(() => { onStateChange({ hasStarted: started, isSaving: saving, allCreated }); }, [onStateChange, started, saving, allCreated]);

  const start = async () => {
    if (lock.current || started || loading || !props.writable || !plan || !eligibleCount || !props.questionDraft.questions.length) return;
    lock.current = true; setSaving(true); setNotice(null);
    const draft = structuredClone(props.questionDraft);
    const publishAt = props.publishAt;
    try {
      const validated = props.validateDraft(draft, { now: new Date(), termStart: props.termStart, termEnd: props.termEnd, publishAt });
      setDraftValidation({ draft: JSON.stringify(draft), validation: validated });
      if (validated.kind === "invalid") return;
      const refreshed = await refreshedPlan(draft);
      if (!refreshed) return;
      await saveReviewedPlan(refreshed, draft, publishAt);
    } finally { lock.current = false; setSaving(false); }
  };

  async function saveReviewedPlan(reviewed: HomeworkBatchPlan, draft: HomeworkQuestionDraft, publishAt?: string | null) {
    setFrozenPlan(reviewed);
    setOutcomes(reviewed.rows.map(target => ({ target, status: target.eligible ? "queued" : "skipped" })));
    await saveHomeworkImportBatch({ plan: reviewed, draft: { ...draft, questions: prepareHomeworkDraftQuestions(draft.questions) }, publishAt, onResult: outcome => {
      setOutcomes(current => current.map(previous => previous.target.classroomId === outcome.target.classroomId ? outcome : previous));
      if (openInNewTabs) openCreatedAssignment(locale, reviewed, outcome);
    } });
  }

  async function refreshedPlan(draft: HomeworkQuestionDraft) {
    let refreshedContext: HomeworkBatchContext;
    try { refreshedContext = await loadHomeworkBatchContext({ academicYearId: props.academicYearId, termId: props.termId }); }
    catch { setNotice("loadError"); setContext(null); return null; }
    const current = latestProps.current;
    if (!current.writable || current.academicYearId !== props.academicYearId || current.termId !== props.termId
      || current.termStart !== props.termStart || current.termEnd !== props.termEnd || current.publishAt !== props.publishAt
      || JSON.stringify(current.questionDraft) !== JSON.stringify(draft)) return null;
    const checked = current.validateDraft(draft, { now: new Date(), termStart: current.termStart, termEnd: current.termEnd, publishAt: current.publishAt });
    if (checked.kind === "invalid") { setDraftValidation({ draft: JSON.stringify(draft), validation: checked }); return null; }
    setContext(refreshedContext);
    const refreshed = homeworkBatchPlan({ academicYearId: props.academicYearId, termId: props.termId, subjectId, selection, context: refreshedContext, locale });
    if (refreshed.signature !== plan?.signature) { setNotice("changed"); return null; }
    return refreshed;
  }

  return { academicYearId: props.academicYearId, termId: props.termId, context, loading, notice, validation, subjectId, setSubjectId, selection, setSelection, plan, eligibleCount, outcomes, started, saving, allCreated, openInNewTabs, setOpenInNewTabs, start, retry: () => setReload(current => current + 1) };
}
