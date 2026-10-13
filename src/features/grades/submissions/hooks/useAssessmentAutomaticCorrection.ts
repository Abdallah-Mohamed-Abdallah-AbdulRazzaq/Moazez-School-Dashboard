"use client";

import { useEffect, useRef, useState } from "react";
import type { MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";
import type { AssessmentQuestion } from "../../shared/types";
import { mergeAutomaticCorrectionResults, runAutomaticCorrectionBatch, type AutomaticCorrectionBatchProgress, type AutomaticCorrectionBatchResult } from "../services/automaticCorrectionBatch";

interface AssessmentAutomaticCorrectionOptions {
  blocked: boolean;
  loadDefinitions: () => Promise<Record<string, AssessmentQuestion>>;
  onRefresh: () => Promise<void>;
  onError: (error: unknown) => void;
}

export function useAssessmentAutomaticCorrection(options: AssessmentAutomaticCorrectionOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [policy, setPolicy] = useState<MultipleSelectionScoringPolicy | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AutomaticCorrectionBatchProgress | null>(null);
  const [result, setResult] = useState<AutomaticCorrectionBatchResult | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const lock = useRef(false);
  const finalizationTargets = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!isRunning) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isRunning]);

  const open = () => {
    if (lock.current || options.blocked) return;
    finalizationTargets.current.clear();
    setPolicy(null); setResult(null); setProgress(null); setRefreshFailed(false); setIsOpen(true);
  };
  const refresh = async () => {
    try { await options.onRefresh(); if (mounted.current) setRefreshFailed(false); }
    catch { if (mounted.current) setRefreshFailed(true); }
  };
  const run = async (submissionIds: readonly string[]) => {
    if (lock.current || options.blocked || !policy || !submissionIds.length) return;
    lock.current = true; setIsRunning(true); setProgress(null);
    let failure: { error: unknown } | null = null;
    try {
      const definitionsByQuestionId = await options.loadDefinitions();
      const completed = await runAutomaticCorrectionBatch({
        submissionIds: [...new Set(submissionIds)], definitionsByQuestionId, scoringPolicy: policy, reviewMode: "review_first",
        finalizeSubmissionIds: submissionIds.filter(id => finalizationTargets.current.has(id)),
        onProgress: next => { if (mounted.current) setProgress(next); },
      });
      if (mounted.current) setResult(previous => mergeAutomaticCorrectionResults(previous, completed));
    } catch (error) {
      failure = { error };
    } finally {
      if (mounted.current) await refresh();
      if (mounted.current && failure) options.onError(failure.error);
      lock.current = false;
      if (mounted.current) setIsRunning(false);
    }
  };
  const finalize = () => {
    const ids = result?.results.filter(student => student.status === "review_pending").map(student => student.submissionId) ?? [];
    for (const id of ids) finalizationTargets.current.add(id);
    void run(ids);
  };
  const retryFailed = () => { void run(result?.failedSubmissionIds ?? []); };
  const close = () => { if (!lock.current) setIsOpen(false); };
  const selectPolicy = (next: MultipleSelectionScoringPolicy) => { if (!lock.current && !result) setPolicy(next); };
  return { isOpen, policy, isRunning, progress, result, refreshFailed, open, close, selectPolicy, run, finalize, retryFailed, refresh };
}
