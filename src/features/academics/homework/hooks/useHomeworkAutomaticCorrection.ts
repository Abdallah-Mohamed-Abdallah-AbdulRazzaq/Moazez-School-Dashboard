"use client";

import { useEffect, useRef, useState } from "react";
import type { HomeworkSubmissionListFilters } from "../services/homeworkApi.types";
import { listHomeworkQuestions } from "../services/homeworkService";
import { collectHomeworkCorrectionTargets, runHomeworkAutomaticCorrectionBatch, type HomeworkCorrectionProgress, type HomeworkCorrectionScope } from "../services/homeworkAutomaticCorrectionBatch";
import type { HomeworkCorrectionContext, HomeworkCorrectionResult, HomeworkCorrectionReviewMode, HomeworkCorrectionStage } from "../services/homeworkAutomaticCorrectionExecution";

export interface HomeworkAutomaticCorrectionOptions {
  context: Omit<HomeworkCorrectionContext, "questions" | "reviewMode">;
  filters: HomeworkSubmissionListFilters;
  blocked: boolean;
  onBusyChange: (busy: boolean) => void;
  onRefresh: () => Promise<void>;
}

export function useHomeworkAutomaticCorrection(options: HomeworkAutomaticCorrectionOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<HomeworkCorrectionScope>("filtered");
  const [singleSubmissionId, setSingleSubmissionId] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<HomeworkCorrectionProgress | null>(null);
  const [outcomes, setOutcomes] = useState<HomeworkCorrectionResult[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const targetRequest = useRef(0);
  const scopeFilters = useRef(options.filters);
  const finalizationTargets = useRef(new Set<string>());

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; targetRequest.current += 1; };
  }, []);
  useEffect(() => {
    if (!isRunning) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isRunning]);

  const loadTargets = async (nextScope: HomeworkCorrectionScope) => {
    const requestId = ++targetRequest.current;
    setScope(nextScope); setIsLoadingTargets(true); setTargets([]); setError(null);
    try {
      const eligible = await collectHomeworkCorrectionTargets(options.context.homeworkId, options.context.assignmentStatus, nextScope, scopeFilters.current);
      if (mounted.current && requestId === targetRequest.current) setTargets(eligible);
    } catch (loadError) {
      if (mounted.current && requestId === targetRequest.current) setError(loadError);
    } finally {
      if (mounted.current && requestId === targetRequest.current) setIsLoadingTargets(false);
    }
  };

  const openCorrection = (submissionId?: string) => {
    if (lock.current || options.blocked) return;
    scopeFilters.current = { ...options.filters };
    finalizationTargets.current.clear();
    setSingleSubmissionId(submissionId ?? null); setOutcomes([]); setProgress(null);
    setError(null); setRefreshFailed(false); setIsOpen(true);
    if (submissionId) { targetRequest.current += 1; setIsLoadingTargets(false); setTargets([submissionId]); }
    else void loadTargets("filtered");
  };

  const refresh = async () => {
    try { await options.onRefresh(); if (mounted.current) setRefreshFailed(false); }
    catch { if (mounted.current) setRefreshFailed(true); }
  };

  const runCorrection = async (retryStages?: Record<string, HomeworkCorrectionStage>) => {
    if (lock.current || options.blocked || isLoadingTargets) return;
    const submissionIds = retryStages ? Object.keys(retryStages) : targets;
    if (!submissionIds.length) return;
    lock.current = true; setIsRunning(true); options.onBusyChange(true);
    setProgress({ processed: 0, total: submissionIds.length }); setError(null);
    try {
      const questions = await listHomeworkQuestions(options.context.homeworkId);
      const completed = await runHomeworkAutomaticCorrectionBatch({
        context: { ...options.context, questions, reviewMode: "review_first" }, submissionIds, retryStages,
        reviewModes: Object.fromEntries(submissionIds.map(submissionId => [submissionId,
          finalizationTargets.current.has(submissionId) ? "finalize" : "review_first"])) as Record<string, HomeworkCorrectionReviewMode>,
        onProgress: nextProgress => { if (mounted.current) setProgress(nextProgress); },
      });
      if (mounted.current) setOutcomes(previous => retryStages
        ? previous.map(previousOutcome => {
          const retried = completed.find(outcome => outcome.submissionId === previousOutcome.submissionId);
          return retried ? { ...retried, plan: retried.plan ?? previousOutcome.plan } : previousOutcome;
        }) : completed);
    } catch (executionError) {
      if (mounted.current) setError(executionError);
    } finally {
      if (mounted.current) await refresh();
      lock.current = false;
      options.onBusyChange(false);
      if (mounted.current) setIsRunning(false);
    }
  };

  const retryFailed = () => {
    const stages = Object.fromEntries(outcomes.filter(outcome => outcome.outcome === "failed" && outcome.failedStage)
      .map(outcome => [outcome.submissionId, outcome.failedStage!])) as Record<string, HomeworkCorrectionStage>;
    void runCorrection(stages);
  };
  const finalizeCorrection = () => {
    const stages = Object.fromEntries(outcomes.filter(outcome => outcome.outcome === "review_pending")
      .map(outcome => [outcome.submissionId, "review"])) as Record<string, HomeworkCorrectionStage>;
    for (const submissionId of Object.keys(stages)) finalizationTargets.current.add(submissionId);
    void runCorrection(stages);
  };
  const close = () => { if (!lock.current) { targetRequest.current += 1; setIsOpen(false); } };
  return { isOpen, scope, singleSubmissionId, targets, isLoadingTargets, isRunning, progress, outcomes, error, refreshFailed,
    openCorrection, loadTargets, runCorrection, finalizeCorrection, retryFailed, refresh, close };
}
