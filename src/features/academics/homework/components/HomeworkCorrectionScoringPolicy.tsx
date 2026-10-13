"use client";

import { useTranslations } from "next-intl";
import MultipleSelectionPolicyPicker from "@/components/ui/grading/MultipleSelectionPolicyPicker";
import type { MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";

interface HomeworkCorrectionScoringPolicyProps {
  policy: MultipleSelectionScoringPolicy | null;
  disabled: boolean;
  onSelect: (policy: MultipleSelectionScoringPolicy) => void;
}

export default function HomeworkCorrectionScoringPolicy({ policy, disabled, onSelect }: HomeworkCorrectionScoringPolicyProps) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  return <MultipleSelectionPolicyPicker policy={policy} disabled={disabled} onSelect={onSelect}
    heading={t("scoringPolicy")} hint={t("choosePolicy")} labels={{
      partial_without_penalty: { title: t("policies.partial_without_penalty.title"), description: t("policies.partial_without_penalty.description") },
      partial_with_penalty: { title: t("policies.partial_with_penalty.title"), description: t("policies.partial_with_penalty.description") },
    }} />;
}
