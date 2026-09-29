"use client";

import { useState, type FormEvent } from "react";
import { FilePlus2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { AccessDenied } from "@/components/ui/access-denied/AccessDenied";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import { allowedAudiences } from "../model/academicContentPolicy";
import { createAcademicContent } from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import {
  ACADEMIC_CONTENT_TYPES,
  type AcademicContentAudience,
  type AcademicContentType,
} from "../types/contracts";

const TYPE_LABELS: Record<AcademicContentType, string> = {
  TEACHER_PREPARATION: "Teacher preparation",
  WEEKLY_PLAN: "Weekly plan",
  GUARDIAN_WEEKLY_NOTE: "Guardian weekly note",
  SUBJECT_RESOURCE: "Subject resource",
  ONLINE_SESSION: "Online session",
  GENERAL_RESOURCE: "General resource",
};

const AUDIENCE_LABELS: Record<AcademicContentAudience, string> = {
  INTERNAL_STAFF: "Internal staff",
  STUDENTS: "Students",
  GUARDIANS: "Guardians",
  STUDENTS_AND_GUARDIANS: "Students and guardians",
};

export default function CreateAcademicContentPage() {
  const locale = useLocale();
  const router = useRouter();
  const { hasPermission, isPermissionsReady } = usePermissions();
  const { academicYearId, termId, termStatus, isInitializing } =
    useAcademicYearTermLayoutContext();
  const [type, setType] = useState<AcademicContentType>("TEACHER_PREPARATION");
  const [audience, setAudience] =
    useState<AcademicContentAudience>("INTERNAL_STAFF");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPermissionsReady) return null;
  if (!hasPermission("academics.academic_content.manage")) {
    return (
      <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
        <AccessDenied requiredPermissions={["academics.academic_content.manage"]} />
      </main>
    );
  }

  const typeOptions = ACADEMIC_CONTENT_TYPES.map((contentType) => ({
    value: contentType,
    label: TYPE_LABELS[contentType],
  }));
  const audienceOptions = allowedAudiences(type).map((contentAudience) => ({
    value: contentAudience,
    label: AUDIENCE_LABELS[contentAudience],
  }));
  const isClosed = termStatus === "closed";
  const cannotCreate =
    isClosed || isInitializing || isSubmitting || !academicYearId || !termId;

  const changeType = (nextType: AcademicContentType) => {
    setType(nextType);
    const nextAudiences = allowedAudiences(nextType);
    setAudience((currentAudience) =>
      nextAudiences.includes(currentAudience)
        ? currentAudience
        : nextAudiences[0],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("Title is required");
      return;
    }
    if (cannotCreate) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const createdContent = await createAcademicContent({
        academicYearId,
        termId,
        type,
        audience,
        title: normalizedTitle,
        description: description.trim() || null,
      });
      const query = new URLSearchParams({ year: academicYearId, term: termId });
      router.push(
        `/${locale}/academic-content-hub/${encodeURIComponent(createdContent.id)}?${query.toString()}`,
      );
    } catch (createError) {
      setError(academicContentUiError(createError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FilePlus2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create academic content</h2>
            <p className="mt-1 text-sm text-gray-500">
              Start a draft in the selected academic year and term.
            </p>
          </div>
        </div>

        {isClosed && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            You cannot create content in a closed term.
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Content type"
              triggerAriaLabel="Content type"
              value={type}
              options={typeOptions}
              required
              disabled={isSubmitting}
              onChange={(value) => changeType(value as AcademicContentType)}
            />
            <Select
              label="Audience"
              triggerAriaLabel="Audience"
              value={audience}
              options={audienceOptions}
              required
              disabled={isSubmitting}
              onChange={(value) => setAudience(value as AcademicContentAudience)}
            />
          </div>
          <Input
            label="Title"
            aria-label="Title"
            value={title}
            maxLength={180}
            required
            disabled={isSubmitting}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextArea
            label="Description"
            aria-label="Description"
            value={description}
            maxLength={4000}
            rows={7}
            disabled={isSubmitting}
            helperText={`${description.length}/4000`}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isSubmitting} disabled={cannotCreate}>
              Create draft
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
