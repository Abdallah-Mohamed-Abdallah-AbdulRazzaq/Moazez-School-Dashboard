"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { HomeworkImport, HomeworkImportMetadata, ImportIssue } from "@/features/academics/shared/excel-import/types";
import { loadHomeworkBatchContext } from "../services/homeworkImportBatchContext";
import { saveHomeworkImportBatch } from "../services/homeworkImportBatchSave";
import { validateHomeworkImportDraft } from "../utils/homeworkExcelImport";
import { homeworkBatchPlan } from "../utils/homeworkImportBatchTargets";
import type { HomeworkBatchContext, HomeworkBatchPageState, HomeworkBatchPlan, HomeworkBatchResult, HomeworkBatchSelection } from "../utils/homeworkImportBatch.types";

export interface HomeworkImportBatchPanelProps {
  importedDraft: HomeworkImport; metadata: HomeworkImportMetadata; publishAt?: string | null;
  academicYearId: string; termId: string; termStart: string; termEnd: string; writable: boolean;
  initialSubjectId?: string; initialClassroomId?: string;
  onStateChange: (state: HomeworkBatchPageState) => void; onReset: () => void;
}

export function homeworkBatchEditorUrl(locale: string, plan: HomeworkBatchPlan, homeworkId?: string) {
  const params = new URLSearchParams({ year: plan.academicYearId, term: plan.termId });
  return `/${locale}/academics/homework${homeworkId ? `/${homeworkId}` : ""}?${params}`;
}

function openCreatedAssignment(locale: string, plan: HomeworkBatchPlan, outcome: HomeworkBatchResult) {
  if (outcome.status !== "created") return;
  try {
    window.open(homeworkBatchEditorUrl(locale, plan, outcome.assignment.id), "_blank", "noopener,noreferrer");
    // Browsers decide tab activation; request the batch page stay active without delayed focus stealing.
    window.focus();
  }
  catch { /* Browser restrictions do not change a saved assignment; the results retain its link. */ }
}

export function useHomeworkImportBatch(props: HomeworkImportBatchPanelProps) {
  const locale = useLocale();
  const { onStateChange } = props;
  const [context, setContext] = useState<HomeworkBatchContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<"loadError" | "changed" | null>(null);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [subjectId, setSubjectId] = useState(props.initialSubjectId ?? "");
  const [selection, setSelection] = useState<HomeworkBatchSelection>({ type: "classes", classroomIds: props.initialClassroomId ? [props.initialClassroomId] : [] });
  const [outcomes, setOutcomes] = useState<HomeworkBatchResult[]>([]);
  const [frozenPlan, setFrozenPlan] = useState<HomeworkBatchPlan | null>(null);
  const [saving, setSaving] = useState(false);
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
    if (lock.current || started || loading || !props.writable || !plan || !eligibleCount) return;
    lock.current = true; setSaving(true); setNotice(null);
    const draft = structuredClone({ ...props.importedDraft, metadata: props.metadata });
    const publishAt = props.publishAt;
    try {
      const validated = validateHomeworkImportDraft(draft, { now: new Date(), termStart: props.termStart, termEnd: props.termEnd, publishAt });
      if (validated.kind === "invalid") { setIssues(validated.issues); return; }
      setIssues([]);
      const refreshed = await refreshedPlan();
      if (!refreshed) return;
      await saveReviewedPlan(refreshed, draft, publishAt);
    } finally { lock.current = false; setSaving(false); }
  };

  async function saveReviewedPlan(reviewed: HomeworkBatchPlan, draft: HomeworkImport, publishAt?: string | null) {
    setFrozenPlan(reviewed);
    setOutcomes(reviewed.rows.map(target => ({ target, status: target.eligible ? "queued" : "skipped" })));
    await saveHomeworkImportBatch({ plan: reviewed, draft, publishAt, onResult: outcome => {
      setOutcomes(current => current.map(previous => previous.target.classroomId === outcome.target.classroomId ? outcome : previous));
      openCreatedAssignment(locale, reviewed, outcome);
    } });
  }

  async function refreshedPlan() {
    let refreshedContext: HomeworkBatchContext;
    try { refreshedContext = await loadHomeworkBatchContext({ academicYearId: props.academicYearId, termId: props.termId }); }
    catch { setNotice("loadError"); setContext(null); return null; }
    const current = latestProps.current;
    if (!current.writable || current.academicYearId !== props.academicYearId || current.termId !== props.termId) return null;
    setContext(refreshedContext);
    const refreshed = homeworkBatchPlan({ academicYearId: props.academicYearId, termId: props.termId, subjectId, selection, context: refreshedContext, locale });
    if (refreshed.signature !== plan?.signature) { setNotice("changed"); return null; }
    return refreshed;
  }

  return { context, loading, notice, issues, subjectId, setSubjectId, selection, setSelection, plan, eligibleCount, outcomes, started, saving, allCreated, start, retry: () => setReload(current => current + 1) };
}
