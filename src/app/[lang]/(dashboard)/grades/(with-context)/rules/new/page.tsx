import GradesRulesPage from "@/features/grades/rules/pages/GradesRulesPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default function Page() {
  return (
    <GradesAccessGuard permission="grades.gradebook.view">
      <GradesAccessGuard permission="grades.rules.manage">
        <GradesRulesPage mode="create" />
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
