import TeacherDetailPage from "@/features/teachers/pages/TeacherDetailPage";

interface TeacherDetailRouteProps {
  params: Promise<{ teacherId: string }>;
}

export default async function TeacherDetailRoute({ params }: TeacherDetailRouteProps) {
  const { teacherId } = await params;
  return <TeacherDetailPage teacherId={teacherId} />;
}
