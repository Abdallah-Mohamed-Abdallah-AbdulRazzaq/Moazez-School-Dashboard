import StudentTabLoader from "@/features/students-guardians/students/components/StudentTabLoader";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default async function StudentNotesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentsGuardiansPermissionGuard permissions={["students.notes.view"]}><StudentTabLoader studentId={studentId} tab="notes" /></StudentsGuardiansPermissionGuard>;
}
