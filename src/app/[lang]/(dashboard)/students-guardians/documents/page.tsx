import DocumentsCenter from "@/features/students-guardians/documents/pages/DocumentsCenter";
import { Suspense } from "react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";
export default function DocumentsCenterPage() {
  return (
    <StudentsGuardiansPermissionGuard permissions={["students.documents.view"]}>
      <Suspense fallback={<MainLoader />}><DocumentsCenter /></Suspense>
    </StudentsGuardiansPermissionGuard>
  );
}
