import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import AcademicsOverviewPage from "@/features/academics/overview/pages/AcademicsOverviewPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.overview.view">
      <AcademicsOverviewPage />
    </AcademicsPermissionGuard>
  );
}
