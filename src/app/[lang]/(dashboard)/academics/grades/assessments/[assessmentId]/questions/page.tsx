import { redirect } from "next/navigation";

interface LegacyPageProps {
  params: Promise<{ lang: string; assessmentId: string }>;
}

export default async function LegacyPage({ params }: LegacyPageProps) {
  const { lang, assessmentId } = await params;
  redirect(`/${lang}/grades/assessments/${assessmentId}/questions`);
}
