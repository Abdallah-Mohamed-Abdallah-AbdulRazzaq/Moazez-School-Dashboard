"use client";

import { useLocale, useTranslations } from "next-intl";
import { Paper, IconButton, Chip } from "@mui/material";
import { MoreVertical, Edit2, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { validateQuestion } from "@/features/academics/curriculum/utils/validation";

interface QuestionCardProps {
  question: AssignmentQuestion;
  index: number;
  isSelected: boolean;
  isReadOnly: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function QuestionCard({
  question,
  index,
  isSelected,
  isReadOnly,
  onClick,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  const tQuestions = useTranslations("academics.curriculum.questions");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Validate question
  const errors = validateQuestion(question, tValidation);
  const isValid = Object.keys(errors).length === 0;

  // Get display text
  const questionText = locale === "ar"
    ? question.questionTextAr || question.questionTextEn
    : question.questionTextEn || question.questionTextAr;
  const displayText = questionText || question.mediaTitle || question.mediaFileName || tQuestions("media");

  // Get subtitle based on question type
  const getSubtitle = () => {
    if (question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") {
      const optionsCount = question.options?.length || 0;
      return `${tQuestions("options_count")}: ${optionsCount}`;
    }
    if (question.questionType === "FILL_IN_BLANK") {
      const answersCount =
        (question.acceptedAnswersAr?.length || 0) + (question.acceptedAnswersEn?.length || 0);
      return answersCount > 0
        ? `${tQuestions("answers_count")}: ${answersCount}`
        : tQuestions("manual_grading");
    }
    if (question.questionType === "MATCHING") {
      return `${tQuestions("pairs_count")}: ${question.matchingPairs?.length || 0}`;
    }
    if (question.questionType === "MEDIA") {
      return question.mediaFileName || question.mediaUrl
        ? tQuestions("media_attached")
        : tQuestions("media_pending");
    }
    if (question.questionType === "SHORT_ANSWER" || question.questionType === "ESSAY") {
      return tQuestions("manual_grading");
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        border: "1px solid",
        borderColor: isSelected ? "primary.main" : "divider",
        borderRadius: "14px",
        padding: "12px 14px",
        cursor: isReadOnly ? "default" : "pointer",
        backgroundColor: isSelected ? "primary.50" : "white",
        transition: "all 0.2s ease",
        "&:hover": isReadOnly ? {} : {
          borderColor: "primary.main",
          backgroundColor: isSelected ? "primary.50" : "primary.25",
          boxShadow: 1,
        },
      }}
    >
      {/* Header Row */}
      <div className={`flex items-center justify-between gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        {/* Left side (RTL: Right) - Question number and type */}
        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Chip
            label={`${tQuestions("question_label")} ${index + 1}`}
            size="small"
            sx={{
              height: "24px",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: "primary.100",
              color: "primary.700",
            }}
          />
          <Chip
            label={tQuestions(`question_types.${question.questionType}`)}
            size="small"
            variant="outlined"
            sx={{
              height: "24px",
              fontSize: "0.75rem",
              borderColor: "divider",
            }}
          />
        </div>

        {/* Right side (RTL: Left) - Points, status, and menu */}
        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Chip
            label={`${question.points} ${tQuestions("points")}`}
            size="small"
            sx={{
              height: "24px",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: "primary.50",
              color: "primary.main",
            }}
          />
          {/* Status Chip */}
          {isValid ? (
            <Chip
              icon={<CheckCircle className="w-3 h-3" />}
              label={tQuestions("complete")}
              size="small"
              sx={{
                height: "24px",
                fontSize: "0.75rem",
                backgroundColor: "success.50",
                color: "success.700",
                "& .MuiChip-icon": {
                  color: "success.700",
                  marginLeft: isRTL ? "4px" : "-4px",
                  marginRight: isRTL ? "-4px" : "4px",
                },
              }}
            />
          ) : (
            <Chip
              icon={<AlertTriangle className="w-3 h-3" />}
              label={tQuestions("incomplete")}
              size="small"
              sx={{
                height: "24px",
                fontSize: "0.75rem",
                backgroundColor: "warning.50",
                color: "warning.700",
                "& .MuiChip-icon": {
                  color: "warning.700",
                  marginLeft: isRTL ? "4px" : "-4px",
                  marginRight: isRTL ? "-4px" : "4px",
                },
              }}
            />
          )}

          {/* Actions Menu */}
          {!isReadOnly && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                trigger={
                  <IconButton size="small" sx={{ padding: "4px" }}>
                    <MoreVertical className="w-4 h-4" />
                  </IconButton>
                }
                items={[
                  {
                    label: tCommon("edit"),
                    value: "edit",
                    icon: <Edit2 className="w-4 h-4" />,
                    onClick: onEdit,
                  },
                  {
                    label: tCommon("delete"),
                    value: "delete",
                    icon: <Trash2 className="w-4 h-4 text-red-600" />,
                    onClick: onDelete,
                  },
                ]}
                width="w-40"
              />
            </div>
          )}
        </div>
      </div>

      {/* Body - Question Title */}
      <div className="mb-1">
        <p
          className="text-sm font-bold text-gray-900 truncate"
          style={{ fontWeight: 700 }}
          title={displayText}
        >
          {displayText}
        </p>
      </div>

      {/* Subtitle */}
      {getSubtitle() && (
        <p className="text-xs text-gray-500">
          {getSubtitle()}
        </p>
      )}
    </Paper>
  );
}
