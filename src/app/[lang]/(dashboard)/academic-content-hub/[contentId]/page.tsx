import AcademicContentEditorPage from "@/features/academic-content/pages/AcademicContentEditorPage";

export default async function Page({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  return <AcademicContentEditorPage contentId={contentId} />;
}
