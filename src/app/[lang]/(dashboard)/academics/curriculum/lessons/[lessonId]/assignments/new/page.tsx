import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import AssignmentBuilderPage from "@/features/academics/curriculum/pages/AssignmentBuilderPage";

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { lessonId } = await params;
  return (
    <AcademicsPermissionGuard permission="homework.assignments.manage">
      <AssignmentBuilderPage lessonId={lessonId} />
    </AcademicsPermissionGuard>
  );
}
