import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import CurriculumPageContent from "@/features/academics/curriculum/pages/CurriculumPageContent";

interface PageProps {
  params: Promise<{
    curriculumId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { curriculumId } = await params;

  return (
    <AcademicsPermissionGuard permission="academics.curriculum.view">
      <CurriculumPageContent view="detail" curriculumId={curriculumId} />
    </AcademicsPermissionGuard>
  );
}
