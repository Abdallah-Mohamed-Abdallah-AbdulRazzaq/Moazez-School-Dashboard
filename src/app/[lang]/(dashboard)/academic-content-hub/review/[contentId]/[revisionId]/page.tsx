import AcademicContentReviewPage from "@/features/academic-content/pages/AcademicContentReviewPage";

export default async function Page({
  params,
}: {
  params: Promise<{ contentId: string; revisionId: string }>;
}) {
  const { contentId, revisionId } = await params;
  return (
    <AcademicContentReviewPage contentId={contentId} revisionId={revisionId} />
  );
}
