import Tooltip from "@mui/material/Tooltip";
import { CheckCircle2, KeyRound, TriangleAlert } from "lucide-react";
import type { TeacherCredentialSummary } from "@/features/teachers/types/index";

export default function TeacherCredentialIndicator({
  credential,
  label,
}: {
  credential: TeacherCredentialSummary;
  label: string;
}) {
  const configured = credential.status === "set";
  const missing = credential.status === "missing";
  const Icon = configured ? CheckCircle2 : missing ? TriangleAlert : KeyRound;
  const color = configured
    ? "text-emerald-600"
    : missing
      ? "text-red-600"
      : "text-amber-600";

  return (
    <Tooltip title={label}>
      <span className={`inline-flex items-center gap-1 text-sm ${color}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  );
}
