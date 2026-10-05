"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentTag, AcademicContentTagInput } from "../../types/contracts";
import TagsSection from "../editor/TagsSection";

interface TeacherPreparationKeyConceptsProps {
  tags: AcademicContentTag[];
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirty: () => void;
  onSave: (tags: AcademicContentTagInput[]) => Promise<boolean>;
}

export default function TeacherPreparationKeyConcepts({
  tags,
  disabled,
  sectionState,
  onDirty,
  onSave,
}: TeacherPreparationKeyConceptsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const t = useAcademicContentTranslations("teacher_preparation_detail.overview");

  return (
    <section aria-labelledby="preparation-key-concepts-heading" className="border-t border-gray-200 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="preparation-key-concepts-heading" className="text-base font-semibold text-gray-900">
            {t("key_concepts")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{t("key_concepts_description")}</p>
        </div>
        {!disabled ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<Pencil aria-hidden="true" className="size-4" />}
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? t("close_key_concepts") : t("edit_key_concepts")}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.length > 0 ? tags.map((tag) => (
          <span key={tag.id} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-primary">
            {tag.value}
          </span>
        )) : <p className="text-sm text-gray-500">{t("no_key_concepts")}</p>}
      </div>

      {isEditing ? (
        <div className="mt-4">
          <TagsSection
            key={JSON.stringify(tags)}
            initial={tags}
            disabled={disabled}
            sectionState={sectionState}
            onDirty={onDirty}
            onSave={onSave}
          />
        </div>
      ) : null}
    </section>
  );
}
