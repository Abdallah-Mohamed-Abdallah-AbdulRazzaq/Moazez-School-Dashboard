// FILE: src/components/students-guardians/guardian-tabs/DocumentsTab.tsx

"use client";

import { useTranslations } from "next-intl";
import { FileText, Upload } from "lucide-react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";

interface DocumentsTabProps {
  guardian: StudentGuardian;
}

export default function DocumentsTab({}: DocumentsTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");

  // TODO: Implement documents fetching from service
  const documents: never[] = [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t("sections.documents")}
          </h2>
          <Button type="button" leftIcon={<Upload className="w-4 h-4" />}>
            Upload Document
          </Button>
        </div>

        {documents.length === 0 ? (
          <EmptyState icon={<FileText className="w-12 h-12" />} title="No documents available" message="Upload documents related to this guardian" />
        ) : (
          <div className="space-y-3">
            {/* Document list will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
