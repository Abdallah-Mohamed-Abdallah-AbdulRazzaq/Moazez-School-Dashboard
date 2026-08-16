"use client";

import dynamic from "next/dynamic";
import MainLoader from "@/components/ui/loaders/MainLoader";

const AdmissionsDashboardContent = dynamic(
  () => import("./AdmissionsDashboardContent"),
  {
    loading: () => <MainLoader />,
  },
);

export default function AdmissionsDashboardShell() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <AdmissionsDashboardContent />
    </main>
  );
}
