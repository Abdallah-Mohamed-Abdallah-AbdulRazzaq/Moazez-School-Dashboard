"use client";

import { useParams } from "next/navigation";
import LeadDetails from "@/features/admissions/leads/components/LeadDetails";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function LeadOverviewPage() {
  const params = useParams();
  const leadId = params.id as string;

  return (
    <AdmissionsAccessGuard permission="admissions.leads.view">
      <LeadDetails leadId={leadId} />
    </AdmissionsAccessGuard>
  );
}
