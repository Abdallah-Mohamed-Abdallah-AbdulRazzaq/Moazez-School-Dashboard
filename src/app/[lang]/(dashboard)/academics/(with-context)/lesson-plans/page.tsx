import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import LessonPlansPage from "@/features/academics/lesson-plans/pages/LessonPlansPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.lesson_plans.view">
      <LessonPlansPage />
    </AcademicsPermissionGuard>
  );
}
