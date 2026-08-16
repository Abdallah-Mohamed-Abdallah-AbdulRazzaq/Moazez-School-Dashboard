import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import HomeworkAssignmentBuilderPage from "@/features/academics/homework/pages/HomeworkAssignmentBuilderPage";

interface PageProps {
  params: Promise<{
    homeworkId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { homeworkId } = await params;
  return (
    <AcademicsPermissionGuard permission="homework.assignments.view">
      <HomeworkAssignmentBuilderPage homeworkId={homeworkId} />
    </AcademicsPermissionGuard>
  );
}
