import { redirect } from "next/navigation";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { lang: locale } = await params;
  const { id } = await params;

  return redirect(`/${locale}/admissions/applications/${id}/details`);
}
