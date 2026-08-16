"use client";

import { useTranslations } from "next-intl";
import { FileText, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface EmptyQuestionStateProps {
  isReadOnly: boolean;
  onAddQuestion: () => void;
}

export default function EmptyQuestionState({
  isReadOnly,
  onAddQuestion,
}: EmptyQuestionStateProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">{t("noQuestionsYet")}</p>
        {!isReadOnly && (
          <Button
            onClick={onAddQuestion}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("addFirstQuestion")}
          </Button>
        )}
      </div>
    </div>
  );
}
