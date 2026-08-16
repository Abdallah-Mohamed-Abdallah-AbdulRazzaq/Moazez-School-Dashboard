import { redirect } from "next/navigation";

interface LegacyPageProps {
  params: Promise<{ lang: string }>;
}

export default async function LegacyPage({ params }: LegacyPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/grades/assessments/new/questions`);
}
