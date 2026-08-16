// FILE: src/components/students-guardians/guardian-tabs/NotesTab.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Plus } from "lucide-react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";

interface NotesTabProps {
  guardian: StudentGuardian;
}

export default function NotesTab({}: NotesTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");
  const [notes] = useState<never[]>([]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t("sections.notes")}
          </h2>
          <Button type="button" leftIcon={<Plus className="w-4 h-4" />}>
            Add Note
          </Button>
        </div>

        {notes.length === 0 ? (
          <EmptyState icon={<MessageSquare className="w-12 h-12" />} title="No notes available" message="Add notes about this guardian" />
        ) : (
          <div className="space-y-4">
            {/* Notes list will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
