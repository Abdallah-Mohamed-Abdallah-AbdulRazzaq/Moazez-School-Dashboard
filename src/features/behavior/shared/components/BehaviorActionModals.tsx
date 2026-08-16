"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "../../shared/hooks/useBehaviorYearTermContext";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import { isApiError } from "@/lib/api-error";
import {
  listBehaviorCategories,
  createBehaviorCategory,
  updateBehaviorCategory,
  createBehaviorRecord,
  updateBehaviorRecord,
  submitBehaviorRecord,
  cancelBehaviorRecord,
  approveBehaviorRecord,
  rejectBehaviorRecord,
} from "../../services/behaviorApiService";
import { behaviorUiError } from "../../services/behaviorErrors";
import type {
  BehaviorCategory,
  BehaviorRecord,
  BehaviorSeverity,
  BehaviorType,
} from "../../types";
import {
  canApproveOrRejectBehaviorRecord,
  canCancelBehaviorRecord,
  canEditBehaviorRecord,
  canSubmitBehaviorRecord,
  getBehaviorCategoryPointsPreview,
  normalizeBehaviorPointsForType,
  normalizeCategoryCode,
  validateCategoryCode,
  validateCategoryName,
  validateCategoryPoints,
  validateRecordContent,
  validateRecordPoints,
  validateRecordCategory,
  validateRecordTermDate,
  validatePointsOverride,
} from "../utils/behaviorUiRules";

// ─── Modal modes ────────────────────────────────────────────────────────────
export type BehaviorModalMode =
  | "create-category"
  | "edit-category"
  | "create-record"
  | "edit-record"
  | "submit-record"
  | "cancel-record"
  | "approve-record"
  | "reject-record";

export interface BehaviorModalTarget {
  category?: BehaviorCategory;
  record?: BehaviorRecord;
  /** Required for create-record: the academic context */
  academicYearId?: string;
  termId?: string;
}

interface BehaviorActionModalsProps {
  mode: BehaviorModalMode | null;
  target?: BehaviorModalTarget;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Shared option lists ────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: BehaviorType; label: string }[] = [
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
];

const SEVERITY_OPTIONS: { value: BehaviorSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// ─── Category modal ─────────────────────────────────────────────────────────
function CategoryModal({
  category,
  onClose,
  onSuccess,
}: {
  category?: BehaviorCategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const isEdit = !!category;

  const [form, setForm] = useState<{
    code: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    type: BehaviorType;
    defaultSeverity: BehaviorSeverity;
    defaultPoints: string | number;
    isActive: boolean;
    sortOrder: string | number;
  }>(() => ({
    code: category?.code ?? `CAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    nameEn: category?.nameEn ?? "",
    nameAr: category?.nameAr ?? "",
    descriptionEn: category?.descriptionEn ?? "",
    descriptionAr: category?.descriptionAr ?? "",
    type: (category?.type ?? "positive") as BehaviorType,
    defaultSeverity: (category?.defaultSeverity ?? "low") as BehaviorSeverity,
    defaultPoints: category?.defaultPoints ?? 1,
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder ?? 10,
  }));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setType = (type: BehaviorType) =>
    setForm((p) => {
      const num = Number(p.defaultPoints);
      const normalized = Number.isNaN(num)
        ? (type === "positive" ? 1 : -1)
        : normalizeBehaviorPointsForType(type, num);
      return {
        ...p,
        type,
        defaultPoints: normalized,
      };
    });

  const handleSave = async () => {
    const normalizedCode = normalizeCategoryCode(form.code);

    if (!validateCategoryCode(normalizedCode)) {
      showError(t("errors.invalidCategoryCode"));
      return;
    }

    if (!validateCategoryName(form.nameEn, form.nameAr)) {
      showError(t("errors.categoryNameRequired"));
      return;
    }

    if (!validateCategoryPoints(form.type, form.defaultPoints)) {
      showError(t("errors.invalidPoints"));
      return;
    }

    const finalPoints = normalizeBehaviorPointsForType(form.type, Number(form.defaultPoints));
    const parsedSortOrder = Number(form.sortOrder);
    const finalSortOrder = Number.isNaN(parsedSortOrder) ? 10 : parsedSortOrder;

    set("code", normalizedCode);

    setSaving(true);
    try {
      if (isEdit && category) {
        await updateBehaviorCategory(category.id, {
          ...form,
          code: normalizedCode,
          defaultPoints: finalPoints,
          sortOrder: finalSortOrder,
        });
        showSuccess(t("messages.categoryUpdated"));
      } else {
        await createBehaviorCategory({
          ...form,
          code: normalizedCode,
          defaultPoints: finalPoints,
          sortOrder: finalSortOrder,
        });
        showSuccess(t("messages.categoryCreated"));
      }
      onSuccess();
    } catch (error) {
      if (isApiError(error) && error.code === "behavior.category.in_use") {
        showError(t("errors.categoryInUse"));
      } else {
        showError(behaviorUiError(error, t("messages.loadError"), t).message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? t("modal.editCategory") : t("modal.createCategory")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "..." : t("modal.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("category.code")}
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
            required
          />
          <Select
            label={t("category.type")}
            value={form.type}
            onChange={(v) => setType(v as BehaviorType)}
            options={TYPE_OPTIONS}
          />
          <Input label={t("category.nameEn")} value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} required />
          <Input label={t("category.nameAr")} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} required dir="rtl" />
          <Input label={t("category.descriptionEn")} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
          <Input label={t("category.descriptionAr")} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} dir="rtl" />
          <Select label={t("category.severity")} value={form.defaultSeverity} onChange={(v) => set("defaultSeverity", v as BehaviorSeverity)} options={SEVERITY_OPTIONS} />
          <Input label={t("category.points")} type="number" value={String(form.defaultPoints)} onChange={(e) => set("defaultPoints", e.target.value)} />
          <Input label={t("category.sortOrder")} type="number" value={String(form.sortOrder)} onChange={(e) => set("sortOrder", e.target.value)} />
          <label className="flex items-center gap-2 cursor-pointer pt-6">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">{t("category.isActive")}</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}

// ─── Record modal ───────────────────────────────────────────────────────────
function RecordModal({
  record,
  academicYearId = "",
  termId = "",
  onClose,
  onSuccess,
}: {
  record?: BehaviorRecord;
  academicYearId?: string;
  termId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const isEdit = !!record;

  const termContext = useBehaviorYearTermContext();
  const currentTerm = termContext.terms.find((t) => t.id === (record?.termId || termId));
  const minDate = currentTerm?.startDate ? new Date(currentTerm.startDate) : undefined;
  const maxDate = currentTerm?.endDate ? new Date(currentTerm.endDate) : undefined;

  const [form, setForm] = useState<{
    studentId: string;
    enrollmentId: string;
    categoryId: string;
    titleEn: string;
    titleAr: string;
    noteEn: string;
    noteAr: string;
    occurredAt: Date | null;
  }>(() => ({
    studentId: record?.studentId ?? "",
    enrollmentId: record?.enrollmentId ?? "",
    categoryId: record?.categoryId ?? "",
    titleEn: record?.titleEn ?? "",
    titleAr: record?.titleAr ?? "",
    noteEn: record?.noteEn ?? "",
    noteAr: record?.noteAr ?? "",
    occurredAt: record?.occurredAt ? new Date(record.occurredAt) : new Date(),
  }));
  const [saving, setSaving] = useState(false);

  const [studentOptions, setStudentOptions] = useState<SelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAllStudents(),
      listBehaviorCategories({}),
    ]).then(([studentsRes, categoriesRes]) => {
      if (!active) return;
      setStudentOptions(
        studentsRes.map((s) => ({
          value: s.id,
          label: s.full_name_en || s.full_name_ar || s.student_id || s.id,
          searchText: `${s.full_name_en || ""} ${s.full_name_ar || ""} ${s.student_id || ""}`,
        }))
      );
      setCategoryOptions(
        categoriesRes.items.map((category) => {
          const localizedName = locale === "ar"
            ? category.nameAr || category.nameEn
            : category.nameEn || category.nameAr;
          return {
            value: category.id,
            label: localizedName ? `${category.code} - ${localizedName}` : category.code,
            searchText: `${category.code} ${category.nameEn ?? ""} ${category.nameAr ?? ""}`,
          };
        })
      );
      setCategories(categoriesRes.items);
    }).catch(console.error);
    return () => { active = false; };
  }, [locale]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (isEdit && record) {
      if (!canEditBehaviorRecord(record)) {
        showError(t("errors.recordInvalidStatusTransition"));
        return;
      }
    }

    if (!validateRecordContent({
      titleEn: form.titleEn,
      titleAr: form.titleAr,
      noteEn: form.noteEn,
      noteAr: form.noteAr,
    })) {
      showError(t("messages.submitContentRequired"));
      return;
    }

    const selectedCategory = categories.find((c) => c.id === form.categoryId);
    const requiresCategoryValidation = !isEdit || Boolean(form.categoryId);
    if (requiresCategoryValidation) {
      if (!selectedCategory?.isActive) {
        showError(t("errors.categoryInactive"));
        return;
      }

      if (!validateRecordCategory(selectedCategory, selectedCategory.type)) {
        showError(t("errors.categoryTypeMismatch"));
        return;
      }

      if (!validateRecordPoints(selectedCategory.type, selectedCategory.defaultPoints)) {
        showError(t("errors.invalidPoints"));
        return;
      }
    }

    if (!form.occurredAt || !validateRecordTermDate(form.occurredAt, currentTerm)) {
      showError(t("errors.occurredAtOutsideTerm"));
      return;
    }

    setSaving(true);
    try {
      if (isEdit && record) {
        await updateBehaviorRecord(record.id, {
          titleEn: form.titleEn || undefined,
          titleAr: form.titleAr || undefined,
          noteEn: form.noteEn || undefined,
          noteAr: form.noteAr || undefined,
          occurredAt: form.occurredAt.toISOString(),
        });
        showSuccess(t("messages.recordUpdated"));
      } else {
        await createBehaviorRecord({
          academicYearId,
          termId,
          studentId: form.studentId,
          enrollmentId: form.enrollmentId || undefined,
          categoryId: form.categoryId,
          titleEn: form.titleEn || undefined,
          titleAr: form.titleAr || undefined,
          noteEn: form.noteEn || undefined,
          noteAr: form.noteAr || undefined,
          occurredAt: form.occurredAt.toISOString(),
          type: selectedCategory!.type,
          severity: selectedCategory!.defaultSeverity,
          points: selectedCategory!.defaultPoints,
        });
        showSuccess(t("messages.recordCreated"));
      }
      onSuccess();
    } catch (error) {
      showError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setSaving(false);
    }
  };

  const pointsPreview = getBehaviorCategoryPointsPreview(categories, form.categoryId);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? t("modal.editRecord") : t("modal.createRecord")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "..." : t("modal.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t("record.studentId")}
            value={form.studentId}
            onChange={(val) => set("studentId", val)}
            options={studentOptions}
            searchable
            disabled={isEdit || saving}
            required={!isEdit}
            placeholder={t("record.studentId")}
          />
          <Select
            label={t("record.categoryId")}
            value={form.categoryId}
            onChange={(val) => set("categoryId", val)}
            options={categoryOptions}
            searchable
            disabled={isEdit || saving}
            required={!isEdit}
            placeholder={t("record.categoryId")}
          />
          <Input label={t("record.titleEn")} value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} />
          <Input label={t("record.titleAr")} value={form.titleAr} onChange={(e) => set("titleAr", e.target.value)} dir="rtl" />
          <Input label={t("record.noteEn")} value={form.noteEn} onChange={(e) => set("noteEn", e.target.value)} />
          <Input label={t("record.noteAr")} value={form.noteAr} onChange={(e) => set("noteAr", e.target.value)} dir="rtl" />
          {pointsPreview && (
            <div className="md:col-span-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              {t("modal.pointsPreview")}: {pointsPreview.points > 0 ? `+${pointsPreview.points}` : pointsPreview.points} ({t(`type.${pointsPreview.type}`)})
            </div>
          )}
          <DatePicker
            label={t("record.occurredAt")}
            value={form.occurredAt}
            onChange={(date) => set("occurredAt", date)}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Submit confirmation modal ───────────────────────────────────────────────
function SubmitModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!canSubmitBehaviorRecord(record)) {
      showError(t("messages.submitContentRequired"));
      return;
    }
    setSaving(true);
    try {
      await submitBehaviorRecord(record.id);
      showSuccess(t("messages.recordSubmitted"));
      onSuccess();
    } catch (error) {
      showError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.submitRecord")}
      size="sm"
      variant="confirm"
      description={t("modal.confirmSubmit")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "..." : t("actions.submit")}
          </Button>
        </>
      }
    >
      <div />
    </Modal>
  );
}

// ─── Approve modal ───────────────────────────────────────────────────────────
function CancelModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [reasonEn, setReasonEn] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCancel = async () => {
    if (!canCancelBehaviorRecord(record)) {
      showError(t("messages.loadError"));
      return;
    }
    setSaving(true);
    try {
      await cancelBehaviorRecord(record.id, {
        cancellationReasonEn: reasonEn || undefined,
      });
      showSuccess(t("messages.recordCancelled"));
      onSuccess();
    } catch (error) {
      showError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.cancelRecord")}
      size="sm"
      variant="danger"
      description={t("modal.confirmCancelRecord")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleCancel} disabled={saving}>
            {saving ? "..." : t("actions.cancel")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label={t("modal.cancelReason")}
          value={reasonEn}
          onChange={(e) => setReasonEn(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function ApproveModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [reviewNoteEn, setReviewNoteEn] = useState("");
  const [pointsOverride, setPointsOverride] = useState<string>(String(record.points));
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    if (!canApproveOrRejectBehaviorRecord(record)) {
      showError(t("messages.loadError"));
      return;
    }
    if (pointsOverride !== "") {
      const type = record.type || "positive";
      if (!validatePointsOverride(type, pointsOverride)) {
        showError(t("errors.invalidPoints"));
        return;
      }
    }
    const overrideValue = pointsOverride !== "" ? Number(pointsOverride) : undefined;
    setSaving(true);
    try {
      await approveBehaviorRecord(record.id, {
        reviewNoteEn: reviewNoteEn || undefined,
        pointsOverride:
          overrideValue !== undefined && record.type
            ? normalizeBehaviorPointsForType(record.type, overrideValue)
            : overrideValue,
      });
      showSuccess(t("messages.recordApproved"));
      onSuccess();
    } catch (error) {
      showError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.approveRecord")}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleApprove} disabled={saving}>
            {saving ? "..." : t("actions.approve")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label={t("modal.approvedPoints")}
          type="number"
          value={pointsOverride}
          onChange={(e) => setPointsOverride(e.target.value)}
        />
        <Input
          label={t("modal.reviewerNote")}
          value={reviewNoteEn}
          onChange={(e) => setReviewNoteEn(e.target.value)}
        />
      </div>
    </Modal>
  );
}

// ─── Reject modal ────────────────────────────────────────────────────────────
function RejectModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [reviewNoteEn, setReviewNoteEn] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReject = async () => {
    if (!canApproveOrRejectBehaviorRecord(record)) {
      showError(t("messages.loadError"));
      return;
    }
    setSaving(true);
    try {
      await rejectBehaviorRecord(record.id, {
        reviewNoteEn: reviewNoteEn || undefined,
      });
      showSuccess(t("messages.recordRejected"));
      onSuccess();
    } catch (error) {
      showError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.rejectRecord")}
      size="sm"
      variant="danger"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleReject} disabled={saving}>
            {saving ? "..." : t("actions.reject")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label={t("modal.reviewerNote")}
          value={reviewNoteEn}
          onChange={(e) => setReviewNoteEn(e.target.value)}
        />
      </div>
    </Modal>
  );
}

// ─── Orchestrator ────────────────────────────────────────────────────────────
export default function BehaviorActionModals({
  mode,
  target = {},
  onClose,
  onSuccess,
}: BehaviorActionModalsProps) {
  if (!mode) return null;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  if (mode === "create-category" || mode === "edit-category") {
    return (
      <CategoryModal
        category={target.category}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (mode === "create-record" || (mode === "edit-record" && target.record && canEditBehaviorRecord(target.record))) {
    return (
      <RecordModal
        record={target.record}
        academicYearId={target.academicYearId}
        termId={target.termId}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (mode === "submit-record" && target.record && canSubmitBehaviorRecord(target.record)) {
    return (
      <SubmitModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  if (mode === "cancel-record" && target.record && canCancelBehaviorRecord(target.record)) {
    return (
      <CancelModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  if (mode === "approve-record" && target.record && canApproveOrRejectBehaviorRecord(target.record)) {
    return (
      <ApproveModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  if (mode === "reject-record" && target.record && canApproveOrRejectBehaviorRecord(target.record)) {
    return (
      <RejectModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  return null;
}
