import PreparationTemplateEditorPage from "@/features/academic-content/pages/PreparationTemplateEditorPage";

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return <PreparationTemplateEditorPage templateId={templateId} />;
}
