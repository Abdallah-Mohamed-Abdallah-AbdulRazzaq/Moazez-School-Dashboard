import GradesRulesPage from "@/features/grades/rules/pages/GradesRulesPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default async function Page({
  params,
}: {
  params: Promise<{ ruleId: string }>;
}) {
  const { ruleId } = await params;

  return (
    <GradesAccessGuard permission="grades.gradebook.view">
      <GradesAccessGuard permission="grades.rules.view">
        <GradesRulesPage mode="edit" ruleId={ruleId} />
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
