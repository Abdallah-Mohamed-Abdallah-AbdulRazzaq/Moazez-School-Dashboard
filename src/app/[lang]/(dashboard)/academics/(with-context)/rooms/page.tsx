import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import RoomsPage from "@/features/academics/rooms/pages/RoomsPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.structure.view">
      <RoomsPage />
    </AcademicsPermissionGuard>
  );
}
