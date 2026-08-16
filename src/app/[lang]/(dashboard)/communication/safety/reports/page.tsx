import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function CommunicationSafetyReportsPage({
  params,
}: PageProps) {
  const { lang } = await params;

  redirect(`/${lang}/communication/moderation`);
}
