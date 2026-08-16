"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircularProgress, Alert, FormControlLabel, Checkbox } from "@mui/material";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import { GenerationResult } from "@/features/academics/timetable/utils/generator";

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (options: {
    strictMode: boolean;
    distributeEvenly: boolean;
    avoidConsecutive: boolean;
  }) => Promise<GenerationResult>;
  onApply: (result: GenerationResult) => void;
}

export default function GenerateDialog({
  open,
  onClose,
  onGenerate,
  onApply,
}: GenerateDialogProps) {
  const t = useTranslations("academics.timetable.generate");

  const [strictMode, setStrictMode] = useState(false);
  const [distributeEvenly, setDistributeEvenly] = useState(true);
  const [avoidConsecutive, setAvoidConsecutive] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      const generationResult = await onGenerate({
        strictMode,
        distributeEvenly,
        avoidConsecutive,
      });
      setResult(generationResult);
    } catch (error) {
      console.error("Generation failed:", error);
      setResult({
        success: false,
        entries: [],
        unresolved: [],
        conflicts: [],
        message: "Generation failed due to an error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={t("title")}
      size="md"
      footer={
        <>
          <Button onClick={handleClose} variant="secondary">
            {t("cancel")}
          </Button>
          {!result && (
            <Button onClick={handleGenerate} disabled={isGenerating} variant="primary">
              {t("generate")}
            </Button>
          )}
          {result && result.entries.length > 0 && (
            <Button onClick={handleApply} variant="primary">
              {t("apply")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Options */}
        {!result && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">{t("description")}</p>

            <FormControlLabel
              control={
                <Checkbox
                  checked={distributeEvenly}
                  onChange={(e) => setDistributeEvenly(e.target.checked)}
                  disabled={isGenerating}
                />
              }
              label={t("options.distributeEvenly")}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={avoidConsecutive}
                  onChange={(e) => setAvoidConsecutive(e.target.checked)}
                  disabled={isGenerating}
                />
              }
              label={t("options.avoidConsecutive")}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  disabled={isGenerating}
                />
              }
              label={t("options.strictMode")}
            />

            <p className="text-xs text-gray-500 mt-2">{t("options.strictModeHelp")}</p>
          </div>
        )}

        {/* Loading */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8">
            <CircularProgress size={40} />
            <p className="text-sm text-gray-600 mt-4">{t("generating")}</p>
          </div>
        )}

        {/* Result */}
        {result && !isGenerating && (
          <div className="space-y-4">
            <Alert severity={result.success ? "success" : "warning"}>
              {result.success 
                ? t("result.successMessage", { count: result.entries.length })
                : t("result.partialMessage", { 
                    generated: result.entries.length, 
                    unresolved: result.unresolved.length 
                  })
              }
            </Alert>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("result.entriesGenerated")}</span>
                <span className="font-semibold">{result.entries.length}</span>
              </div>
              {result.unresolved.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("result.unresolvedSubjects")}</span>
                  <span className="font-semibold text-orange-600">
                    {result.unresolved.length}
                  </span>
                </div>
              )}
            </div>

            {/* Unresolved subjects */}
            {result.unresolved.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  {t("result.unresolvedTitle")}
                </h4>
                <div className="space-y-1">
                  {result.unresolved.map((item, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 bg-orange-50 rounded px-3 py-2"
                    >
                      {item.subjectName}: {item.placed}/{item.required} {t("result.hours")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            {result.entries.length > 0 && (
              <Alert severity="info">{t("result.applyWarning")}</Alert>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
