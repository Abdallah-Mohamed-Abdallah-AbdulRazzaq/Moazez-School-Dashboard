import GradesRulesListPage from "@/features/grades/rules/pages/GradesRulesListPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default function Page() {
  return (
    <GradesAccessGuard permission="grades.gradebook.view">
      <GradesAccessGuard permission="grades.rules.view">
        <GradesRulesListPage />
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
