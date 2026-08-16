import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    lang: string;
    reportId: string;
  }>;
}

export default async function CommunicationSafetyReportDetailsPage({
  params,
}: PageProps) {
  const { lang, reportId } = await params;

  redirect(`/${lang}/communication/moderation/${reportId}`);
}
