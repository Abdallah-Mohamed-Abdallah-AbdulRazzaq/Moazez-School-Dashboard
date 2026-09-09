"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import type { CurriculumDependencyDetails } from "../services/subjectAllocationErrors";

interface CurriculumDependencyDialogProps {
  dependency: CurriculumDependencyDetails | null;
  gradeName?: string;
  subjectName?: string;
  traceId?: string;
  locale: string;
  onClose: () => void;
}

export default function CurriculumDependencyDialog({ dependency, gradeName, subjectName, traceId, locale, onClose }: CurriculumDependencyDialogProps) {
  const isArabic = locale === "ar";
  const labels = isArabic
    ? { title: "تعذر حفظ توزيع المادة", description: "لا يمكن تطبيق هذا التغيير لأن له تبعيات في جدول الحصص.", grade: "الصف", subject: "المادة", mutation: "نوع التغيير", previous: "الساعات السابقة", proposed: "الساعات المقترحة", teachers: "تخصيصات المعلمين", draft: "حصص جدول مسودة", published: "حصص جدول منشورة", configs: "جداول منشورة", trace: "معرّف التتبع", instruction: "أزل التبعيات أو ألغِ نشر الجدول ذي الصلة ثم أعد المحاولة.", close: "إغلاق" }
    : { title: "Allocation change blocked", description: "This change cannot be saved because timetable dependencies still exist.", grade: "Grade", subject: "Subject", mutation: "Change", previous: "Previous weekly hours", proposed: "Proposed weekly hours", teachers: "Teacher allocations", draft: "Draft timetable entries", published: "Published timetable entries", configs: "Published timetable configurations", trace: "Trace ID", instruction: "Remove the dependencies or unpublish the relevant timetable before trying again.", close: "Close" };
  const rows = dependency ? [
    [labels.grade, gradeName ?? dependency.gradeId ?? "—"], [labels.subject, subjectName ?? dependency.subjectId ?? "—"],
    [labels.mutation, dependency.mutation ?? "—"], [labels.previous, dependency.previousWeeklyHours ?? "—"], [labels.proposed, dependency.proposedWeeklyHours ?? "—"],
    [labels.teachers, dependency.teacherAllocationCount], [labels.draft, dependency.draftTimetableEntryCount], [labels.published, dependency.publishedTimetableEntryCount], [labels.configs, dependency.publishedTimetableConfigCount],
  ] : [];
  return <Modal isOpen={Boolean(dependency)} onClose={onClose} title={labels.title} description={labels.description} icon={<AlertTriangle className="h-6 w-6" />} variant="danger" footer={<Button onClick={onClose}>{labels.close}</Button>}>
    <div className="space-y-4 pb-4 text-sm" dir={isArabic ? "rtl" : "ltr"}>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">{rows.map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-900">{value}</dd></div>)}</dl>
      {traceId && <p className="text-xs text-slate-500">{labels.trace}: {traceId}</p>}
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">{labels.instruction}</p>
    </div>
  </Modal>;
}
