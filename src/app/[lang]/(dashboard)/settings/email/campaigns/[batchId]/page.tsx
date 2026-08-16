import EmailCampaignDetailPage from "@/features/settings/email/campaigns/pages/EmailCampaignDetailPage";

interface PageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export default async function SettingsEmailCampaignDetailRoute({
  params,
}: PageProps) {
  const { batchId } = await params;
  return <EmailCampaignDetailPage batchId={batchId} />;
}
