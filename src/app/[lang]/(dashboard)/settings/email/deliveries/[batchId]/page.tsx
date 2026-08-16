import EmailDeliveryDetailPage from "@/features/settings/email/deliveries/pages/EmailDeliveryDetailPage";

interface PageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export default async function SettingsEmailDeliveryDetailRoute({
  params,
}: PageProps) {
  const { batchId } = await params;
  return <EmailDeliveryDetailPage batchId={batchId} />;
}
