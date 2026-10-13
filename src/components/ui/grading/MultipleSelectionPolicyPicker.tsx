"use client";

import Button from "@/components/ui/button/Button";
import type { MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";

interface MultipleSelectionPolicyPickerProps {
  policy: MultipleSelectionScoringPolicy | null;
  disabled: boolean;
  onSelect: (policy: MultipleSelectionScoringPolicy) => void;
  heading: string;
  hint: string;
  labels: Record<MultipleSelectionScoringPolicy, { title: string; description: string }>;
}

export default function MultipleSelectionPolicyPicker({ policy, disabled, onSelect, heading, hint, labels }: MultipleSelectionPolicyPickerProps) {
  return <div role="group" aria-label={heading} className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-900">{heading}</h3>
    <p className="text-xs text-gray-600">{hint}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["partial_without_penalty", "partial_with_penalty"] as const).map(choice => <Button key={choice}
        variant="secondary" disabled={disabled} aria-pressed={policy === choice} onClick={() => onSelect(choice)}
        className={`h-auto p-4 text-start whitespace-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${policy === choice ? "!border-primary !bg-primary/5 !text-gray-900" : "!bg-white"}`}>
        <span className="block w-full space-y-2">
          <span className="block font-semibold">{labels[choice].title}</span>
          <span className="block text-xs font-normal leading-relaxed text-gray-600">{labels[choice].description}</span>
        </span>
      </Button>)}
    </div>
  </div>;
}
