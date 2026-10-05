import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationReferenceDisplay } from "../../model/teacherPreparationDetail";
import type { AcademicContentApprovalHistoryResponse, AcademicContentReadinessResponse } from "../../types/contracts";
import TeacherPreparationApprovalHistoryCard from "./TeacherPreparationApprovalHistoryCard";
import TeacherPreparationReadinessCard from "./TeacherPreparationReadinessCard";
import TeacherPreparationReferenceCards from "./TeacherPreparationReferenceCards";

interface TeacherPreparationContextRailProps {
  readiness: AcademicContentReadinessResponse | null;
  references: TeacherPreparationReferenceDisplay;
  referenceError: string | null;
  history: AcademicContentApprovalHistoryResponse | null;
  historyError: string | null;
  teachers: readonly { userId: string; displayName: { fullName: string } }[];
  onRefreshReadiness: () => Promise<unknown>;
  onRetryHistory: () => void;
}

export default function TeacherPreparationContextRail(props: TeacherPreparationContextRailProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail.context");
  return (
    <aside aria-label={t("rail_label")} className="space-y-4">
      <TeacherPreparationReadinessCard readiness={props.readiness} onRefresh={props.onRefreshReadiness} />
      <TeacherPreparationReferenceCards references={props.references} error={props.referenceError} />
      <TeacherPreparationApprovalHistoryCard history={props.history} teachers={props.teachers} error={props.historyError} onRetry={props.onRetryHistory} />
    </aside>
  );
}
