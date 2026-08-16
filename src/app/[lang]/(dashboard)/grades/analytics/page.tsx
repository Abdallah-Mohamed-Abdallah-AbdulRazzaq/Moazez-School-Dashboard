import { redirect } from "next/navigation";

interface GradesAnalyticsRedirectPageProps {
  params: Promise<{ lang: string }>;
}

export default async function GradesAnalyticsRedirectPage({ params }: GradesAnalyticsRedirectPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/grades`);
}
