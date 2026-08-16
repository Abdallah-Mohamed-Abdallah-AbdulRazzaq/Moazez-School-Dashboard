import Tooltip from "@mui/material/Tooltip";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import type { TeacherProfileCompleteness as Completeness } from "@/features/teachers/types/index";

export default function TeacherProfileCompleteness({
  completeness,
  completeLabel,
  incompleteLabel,
}: {
  completeness: Completeness;
  completeLabel: string;
  incompleteLabel: string;
}) {
  const tooltip = completeness.isComplete
    ? completeLabel
    : `${incompleteLabel}: ${completeness.missingFields.join(", ")}`;
  const Icon = completeness.isComplete ? CheckCircle2 : TriangleAlert;

  return (
    <Tooltip title={tooltip}>
      <span
        className={`inline-flex items-center gap-1 text-sm ${
          completeness.isComplete ? "text-emerald-600" : "text-orange-600"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {completeness.isComplete ? completeLabel : incompleteLabel}
      </span>
    </Tooltip>
  );
}
