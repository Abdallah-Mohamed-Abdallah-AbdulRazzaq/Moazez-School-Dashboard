"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutTemplate, Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  getAcademicContentPreparationTemplate,
  listAcademicContentPreparationTemplates,
} from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type {
  AcademicContentPreparationTemplateDetail,
  AcademicContentPreparationTemplateListItem,
} from "../../types/contracts";

interface PreparationTemplatePickerProps {
  disabled?: boolean;
  onApply: (template: AcademicContentPreparationTemplateDetail) => void;
}

export default function PreparationTemplatePicker({
  disabled = false,
  onApply,
}: PreparationTemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [items, setItems] = useState<
    AcademicContentPreparationTemplateListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const t = useAcademicContentTranslations("templates");

  useEffect(() => {
    if (!isOpen) return;
    const currentRequestId = ++requestId.current;
    queueMicrotask(() => {
      if (currentRequestId !== requestId.current) return;
      setIsLoading(true);
      setError(null);
    });
    void listAcademicContentPreparationTemplates({
      page: 1,
      limit: 50,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    })
      .then((response) => {
        if (currentRequestId === requestId.current) setItems(response.items);
      })
      .catch((loadError) => {
        if (currentRequestId === requestId.current) {
          setError(academicContentUiError(loadError).message);
        }
      })
      .finally(() => {
        if (currentRequestId === requestId.current) setIsLoading(false);
      });
    return () => {
      if (currentRequestId === requestId.current) requestId.current += 1;
    };
  }, [debouncedSearch, isOpen]);

  if (disabled) return null;

  const close = () => {
    if (applyingId) return;
    setIsOpen(false);
    setError(null);
  };

  const apply = async (templateId: string) => {
    if (applyingId) return;
    setApplyingId(templateId);
    setError(null);
    try {
      const template = await getAcademicContentPreparationTemplate(templateId);
      if (template.id !== templateId) {
        setError(t("picker_mismatch"));
        return;
      }
      onApply(template);
      setIsOpen(false);
    } catch (applyError) {
      setError(academicContentUiError(applyError).message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        leftIcon={<LayoutTemplate aria-hidden="true" className="size-4" />}
        onClick={() => setIsOpen(true)}
      >
        {t("apply")}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={t("picker_title")}
        size="lg"
        footer={
          <Button variant="secondary" disabled={Boolean(applyingId)} onClick={close}>
            {t("cancel")}
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label={t("search")}
            value={search}
            maxLength={120}
            leftIcon={<Search aria-hidden="true" className="size-4" />}
            onChange={(event) => setSearch(event.target.value.slice(0, 120))}
          />

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                {t("picker_loading")}
              </p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                {t("picker_empty")}
              </p>
            ) : (
              items.map((template) => (
                <article
                  key={template.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {template.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {t("scope_summary", {
                        stage: template.stageId || t("all_stages"),
                        subject: template.subjectId || t("all_subjects"),
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    loading={applyingId === template.id}
                    disabled={Boolean(applyingId)}
                    onClick={() => void apply(template.id)}
                  >
                    {t("use_template", { name: template.name })}
                  </Button>
                </article>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
