"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import type { MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";

interface HomeworkCorrectionScoringPolicyProps {
  policy: MultipleSelectionScoringPolicy | null;
  disabled: boolean;
  onSelect: (policy: MultipleSelectionScoringPolicy) => void;
}

export default function HomeworkCorrectionScoringPolicy({ policy, disabled, onSelect }: HomeworkCorrectionScoringPolicyProps) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  return <div role="group" aria-label={t("scoringPolicy")} className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-900">{t("scoringPolicy")}</h3>
    <p className="text-xs text-gray-600">{t("choosePolicy")}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["partial_without_penalty", "partial_with_penalty"] as const).map(choice => <Button key={choice}
        variant="secondary" disabled={disabled} aria-pressed={policy === choice} onClick={() => onSelect(choice)}
        className={`h-auto p-4 text-start whitespace-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${policy === choice ? "!border-primary !bg-primary/5 !text-gray-900" : "!bg-white"}`}>
        <span className="block w-full space-y-2">
          <span className="block font-semibold">{t(`policies.${choice}.title`)}</span>
          <span className="block text-xs font-normal leading-relaxed text-gray-600">{t(`policies.${choice}.description`)}</span>
        </span>
      </Button>)}
    </div>
  </div>;
}
