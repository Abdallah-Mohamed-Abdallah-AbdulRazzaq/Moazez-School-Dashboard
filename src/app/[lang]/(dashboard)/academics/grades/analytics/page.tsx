import { redirect } from "next/navigation";

interface LegacyGradesAnalyticsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function LegacyGradesAnalyticsPage({ params }: LegacyGradesAnalyticsPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/grades`);
}
