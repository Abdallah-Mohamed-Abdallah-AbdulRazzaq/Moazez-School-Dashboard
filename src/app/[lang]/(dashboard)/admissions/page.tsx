import { redirect } from "next/navigation";

interface AdmissionsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AdmissionsPage({ params }: AdmissionsPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/admissions/applications`);
}
