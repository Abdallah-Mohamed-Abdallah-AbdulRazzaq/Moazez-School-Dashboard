"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import {
  Subject,
  SubjectAllocation,
  deleteSubject,
} from "@/features/academics/subjects/services/subjectsService";

interface SubjectsListProps {
  subjects: Subject[];
  allocations: SubjectAllocation[];
  isReadOnly: boolean;
  onAdd: () => void;
  onEdit: (subject: Subject) => void;
  onRefresh: () => Promise<void>;
}

export default function SubjectsList({
  subjects,
  allocations,
  isReadOnly,
  onAdd,
  onEdit,
  onRefresh,
}: SubjectsListProps) {
  const t = useTranslations("academics.subjects");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("subjectSearch") || "";
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const syncSearchQueryParam = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("subjectSearch", value);
    } else {
      params.delete("subjectSearch");
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `?${nextQuery}` : "?";
    router.replace(nextUrl, { scroll: false });
  }, 250);

  useEffect(() => {
    void Promise.resolve().then(() => setSearchInputValue(searchQuery));
  }, [searchQuery]);

  useEffect(
    () => () => {
      syncSearchQueryParam.cancel();
    },
    [syncSearchQueryParam],
  );

  const filteredSubjects = useMemo(() => {
    if (!searchInputValue.trim()) return subjects;
    const query = searchInputValue.toLowerCase();
    return subjects.filter(
      (s) =>
        s.nameAr.toLowerCase().includes(query) ||
        s.nameEn.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.code?.toLowerCase().includes(query),
    );
  }, [searchInputValue, subjects]);

  const getSubjectAllocationStatus = (
    subjectId: string,
  ): "allocated" | "not_allocated" => {
    return allocations.some(
      (a) => a.subjectId === subjectId && a.weeklyHours > 0,
    )
      ? "allocated"
      : "not_allocated";
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteSubject(deleteConfirm.id);
      await onRefresh();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete subject:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasAllocations = deleteConfirm
    ? allocations.some(
        (allocation) =>
          allocation.subjectId === deleteConfirm.id &&
          allocation.weeklyHours > 0,
      )
    : false;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("subjects_list.title")}
          </h2>

          {/* Search */}
          <Input
            value={searchInputValue}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInputValue(value);
              syncSearchQueryParam(value);
            }}
            placeholder={t("subjects_list.search_placeholder")}
            leftIcon={<Search className="w-4 h-4" />}
            inputSize="md"
          />
        </div>

        {/* Add Button */}
        <div className="space-y-3 p-4 border-b border-border">
          <Button
            onClick={onAdd}
            variant="primary"
            fullWidth
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={isReadOnly}
          >
            {t("subjects_list.add_subject")}
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSubjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchInputValue
                ? t("subjects_list.no_results")
                : t("subjects_list.empty")}
            </div>
          )}

          {filteredSubjects.map((subject) => {
            const status = getSubjectAllocationStatus(subject.id);

            return (
              <div
                key={subject.id}
                className="p-3 bg-white border border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-2 mb-1">
                      {subject.code && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {subject.code}
                        </span>
                      )}
                      <h3 className="font-medium text-gray-900 truncate max-w-full">
                        {locale === "ar"
                          ? subject.nameAr || subject.nameEn || subject.name
                          : subject.nameEn || subject.nameAr || subject.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          status === "allocated"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t(`subjects_list.status.${status}`)}
                      </span>

                      {!subject.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {t("subjects_list.inactive")}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu
                    trigger={
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    }
                    items={[
                      {
                        label: t("subjects_list.actions.edit"),
                        value: "edit",
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => onEdit(subject),
                        disabled: isReadOnly,
                      },
                      {
                        label: t("subjects_list.actions.delete"),
                        value: "delete",
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => setDeleteConfirm(subject),
                        disabled: isReadOnly,
                      },
                    ]}
                    width="w-40"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t("delete_dialog.title")}
        size="sm"
        footer={
          <>
            <Button
              onClick={() => setDeleteConfirm(null)}
              variant="secondary"
              disabled={isDeleting}
            >
              {t("delete_dialog.cancel")}
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              disabled={isDeleting}
            >
              {isDeleting
                ? t("delete_dialog.deleting")
                : t("delete_dialog.delete")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            {t("delete_dialog.message", { name: deleteConfirm?.name || "" })}
          </p>

          {hasAllocations && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {t("delete_dialog.has_allocations")}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
