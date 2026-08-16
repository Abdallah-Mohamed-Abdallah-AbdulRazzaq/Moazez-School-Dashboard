"use client";

import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff, Edit2 } from "lucide-react";
import type {
  NoteCategory,
  NoteVisibility,
  Student,
  StudentNote,
} from "@/features/students-guardians/students/types";
import { NOTE_CATEGORIES } from "@/features/students-guardians/students/types/note";
import {
  Button,
  DataTable,
  EmptyState,
  FilterPanel,
  Select,
} from "@/components/ui";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { getStudentDisplayName } from "@/features/students-guardians/students/utils/studentUtils";
import AddNoteModal, {
  NoteFormData,
} from "@/features/students-guardians/students/components/modals/AddNoteModal";
import { useTranslations } from "next-intl";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

interface NotesTabProps {
  student: Student;
}

export default function NotesTab({ student }: NotesTabProps) {
  const t = useTranslations("students_guardians.profile.notes");
  const permissions = usePermissions();
  const { canManageNotes } = getStudentsGuardiansCapabilities(permissions);
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | "all">(
    "all",
  );
  const [visibilityFilter, setVisibilityFilter] = useState<
    NoteVisibility | "all"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [notesRevision, setNotesRevision] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await studentsService.fetchStudentNotes(student.id);
        if (!isCancelled) setNotes(data);
      } catch (loadError) {
        if (!isCancelled) {
          setNotes([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load notes.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [notesRevision, student.id]);

  const handleAddNote = async (noteData: NoteFormData) => {
    if (!canManageNotes) return;

    try {
      await studentsService.createStudentNote(student.id, {
        category: noteData.category,
        note: noteData.note,
        visibility: noteData.visibility,
      });

      setShowAddModal(false);
      setNotesRevision((current) => current + 1);
      setFeedback(t("note_added_successfully"));
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to add note.",
      );
    }
  };

  const handleUpdateNote = async (noteData: NoteFormData) => {
    if (!canManageNotes || !editingNote) return;

    try {
      await studentsService.updateStudentNote(
        student.id,
        editingNote.id,
        noteData,
      );
      setEditingNote(null);
      setNotesRevision((current) => current + 1);
      setFeedback(t("note_updated_successfully"));
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update note.",
      );
    }
  };

  const getCategoryBadge = (category: NoteCategory) => {
    const colors: Record<NoteCategory, string> = {
      behavior: "bg-purple-100 text-purple-700",
      academic: "bg-blue-100 text-blue-700",
      attendance: "bg-emerald-100 text-emerald-700",
      general: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[category]}`}
      >
        {t(category)}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: NoteVisibility) => {
    if (visibility === "guardian_visible") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <Eye className="h-3 w-3" />
          {t("visible")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
        <EyeOff className="h-3 w-3" />
        {t("internal")}
      </span>
    );
  };

  const filteredNotes = notes.filter((note) => {
    const matchesCategory =
      categoryFilter === "all" || note.category === categoryFilter;
    const matchesVisibility =
      visibilityFilter === "all" || note.visibility === visibilityFilter;
    return matchesCategory && matchesVisibility;
  });

  const columns = [
    {
      key: "date",
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "category",
      label: t("category"),
      render: (value: unknown) => getCategoryBadge(value as NoteCategory),
    },
    {
      key: "note",
      label: t("note"),
      render: (value: unknown) => (
        <div className="max-w-md">
          <p className="line-clamp-2 text-sm text-gray-900">
            {value as string}
          </p>
        </div>
      ),
    },
    {
      key: "visibility",
      label: t("visibility"),
      render: (value: unknown) => getVisibilityBadge(value as NoteVisibility),
    },
    {
      key: "created_by",
      label: t("created_by"),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-600"
            title={t("edit")}
            onClick={() => setEditingNote(row as unknown as StudentNote)}
            disabled={!canManageNotes}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <StudentTabSkeleton variant="table" />;
  }

  return (
    <div className="space-y-6">
      {feedback ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={!canManageNotes}
        >
          {t("add_note")}
        </Button>
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="bg-transparent px-0 py-0 shadow-none"
        filtersSlot={
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
            <Select
              label={t("category")}
              value={categoryFilter}
              onChange={(value) =>
                setCategoryFilter(value as NoteCategory | "all")
              }
              options={[
                { value: "all", label: t("all_categories") },
                ...NOTE_CATEGORIES.map((category) => ({
                  value: category,
                  label: t(category),
                })),
              ]}
            />
            <Select
              label={t("visibility")}
              value={visibilityFilter}
              onChange={(value) =>
                setVisibilityFilter(value as NoteVisibility | "all")
              }
              options={[
                { value: "all", label: t("all_notes") },
                {
                  value: "guardian_visible",
                  label: t("guardian_visible"),
                },
                { value: "internal", label: t("internal") },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm text-gray-600">{t("total_notes")}</p>
          <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="p-6">
          {filteredNotes.length === 0 ? (
            <EmptyState message={t("no_match")} />
          ) : (
            <DataTable
              columns={columns}
              data={filteredNotes as unknown as Record<string, unknown>[]}
              showPagination={true}
              itemsPerPage={10}
            />
          )}
        </div>
      </div>

      <AddNoteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNote}
        studentName={getStudentDisplayName(student)}
      />
      <AddNoteModal
        key={editingNote?.id ?? "closed-edit-note"}
        isOpen={editingNote !== null}
        onClose={() => setEditingNote(null)}
        onSubmit={handleUpdateNote}
        studentName={getStudentDisplayName(student)}
        initialData={
          editingNote
            ? {
                category: editingNote.category,
                note: editingNote.note,
                visibility: editingNote.visibility,
              }
            : undefined
        }
      />
    </div>
  );
}
