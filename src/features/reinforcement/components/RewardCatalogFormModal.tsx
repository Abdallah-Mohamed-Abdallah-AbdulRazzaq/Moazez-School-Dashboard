"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Select from "@/components/ui/input/Select";
import Modal from "@/components/ui/modal/Modal";
import type { AcademicYear } from "@/features/academics/academic-structure-tree/services/structureService";
import RewardCatalogImageField from "./RewardCatalogImageField";
import RewardCatalogScopeFields, {
  type RewardCatalogScopeValue,
} from "./RewardCatalogScopeFields";
import type {
  RewardCatalogItem,
  RewardItemType,
  CreateRewardCatalogItemPayload,
  UpdateRewardCatalogItemPayload,
} from "@/features/reinforcement/types";

interface RewardCatalogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateRewardCatalogItemPayload | UpdateRewardCatalogItemPayload,
  ) => Promise<void> | void;
  initialData?: RewardCatalogItem | null;
  loading?: boolean;
  academicYears: AcademicYear[];
  defaultAcademicYearId: string;
  defaultTermId: string;
  canUploadFiles: boolean;
  canDownloadFiles: boolean;
}

const REWARD_TYPE_OPTIONS: { value: RewardItemType; label: string }[] = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "privilege", label: "Privilege" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

export default function RewardCatalogFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  academicYears,
  defaultAcademicYearId,
  defaultTermId,
  canUploadFiles,
  canDownloadFiles,
}: RewardCatalogFormModalProps) {
  const t = useTranslations("reinforcement");
  const tCommon = useTranslations("common");

  const isEditMode = !!initialData;

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [type, setType] = useState<RewardItemType>("physical");
  const [minTotalXp, setMinTotalXp] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [stockRemaining, setStockRemaining] = useState<string>("");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scope, setScope] = useState<RewardCatalogScopeValue>({
    isGlobal: false,
    academicYearId: defaultAcademicYearId || null,
    termId: defaultTermId || null,
  });
  const [imageFileId, setImageFileId] = useState<string | null | undefined>();
  const [imageUploading, setImageUploading] = useState(false);

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    void Promise.resolve().then(() => {
      if (initialData) {
        setTitleEn(initialData.titleEn || "");
        setTitleAr(initialData.titleAr || "");
        setDescriptionEn(initialData.descriptionEn || "");
        setDescriptionAr(initialData.descriptionAr || "");
        setType(initialData.type || "physical");
        setMinTotalXp(
        initialData.minTotalXp != null ? String(initialData.minTotalXp) : "",
        );
        setStockQuantity(
          initialData.stockQuantity != null
            ? String(initialData.stockQuantity)
            : "",
        );
        setStockRemaining(
          initialData.stockRemaining != null
            ? String(initialData.stockRemaining)
            : "",
        );
        setIsUnlimited(initialData.isUnlimited ?? false);
        setSortOrder(
          initialData.sortOrder != null ? String(initialData.sortOrder) : "",
        );
        setScope({
          isGlobal: !initialData.academicYearId,
          academicYearId: initialData.academicYearId || null,
          termId: initialData.termId || null,
        });
        setImageFileId(initialData.imageFileId);
      } else {
        setTitleEn("");
        setTitleAr("");
        setDescriptionEn("");
        setDescriptionAr("");
        setType("physical");
        setMinTotalXp("");
        setStockQuantity("");
        setStockRemaining("");
        setIsUnlimited(false);
        setSortOrder("");
        setScope({
          isGlobal: false,
          academicYearId: defaultAcademicYearId || null,
          termId: defaultTermId || null,
        });
        setImageFileId(undefined);
      }
      setImageUploading(false);
      setValidationError(null);
    });
  }, [defaultAcademicYearId, defaultTermId, isOpen, initialData]);

  const typeOptions = REWARD_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`rewardsModule.type.${opt.value}`),
  }));

  const handleSubmit = () => {
    // Validation: at least one title required
    if (!titleEn.trim() && !titleAr.trim()) {
      setValidationError(
        t("validation.atLeastOneTitle", {
          defaultMessage: "At least one title (English or Arabic) is required.",
        }),
      );
      return;
    }

    if (!isUnlimited && !stockRemaining.trim()) {
      setValidationError(
        t("rewardsModule.catalog.form.stockRemainingRequired", {
          defaultMessage: "Stock remaining is required for limited rewards.",
        }),
      );
      return;
    }

    setValidationError(null);

    const scopedFields = scope.isGlobal
      ? { academicYearId: null, termId: null }
      : {
          academicYearId: scope.academicYearId,
          termId: scope.termId,
        };

    const commonPayload = {
      ...scopedFields,
      imageFileId,
      titleEn: titleEn.trim() || undefined,
      titleAr: titleAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      descriptionAr: descriptionAr.trim() || undefined,
      type,
      minTotalXp: minTotalXp ? Number(minTotalXp) : undefined,
      stockQuantity:
        !isUnlimited && stockQuantity ? Number(stockQuantity) : undefined,
      stockRemaining:
        !isUnlimited && stockRemaining ? Number(stockRemaining) : undefined,
      isUnlimited,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    };

    if (isEditMode) {
      const payload: UpdateRewardCatalogItemPayload = {
        ...commonPayload,
      };
      onSubmit(payload);
    } else {
      const payload: CreateRewardCatalogItemPayload = {
        ...commonPayload,
        type,
      };
      onSubmit(payload);
    }
  };

  const modalTitle = isEditMode
    ? t("rewardsModule.actions.edit") + " " + t("rewardsModule.catalog.title")
    : t("rewardsModule.actions.create") +
      " " +
      t("rewardsModule.catalog.title");
  const scopeIncomplete =
    !scope.isGlobal && (!scope.academicYearId || !scope.termId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || imageUploading || scopeIncomplete}
          >
            {isEditMode
              ? tCommon("save", { defaultMessage: "Save" })
              : t("rewardsModule.actions.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Title fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("rewardsModule.catalog.table.title") + " (AR)"}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder={t("rewardsModule.catalog.form.titlePlaceholderAr")}
            dir="rtl"
            required={!titleEn.trim()}
          />
          <Input
            label={t("rewardsModule.catalog.table.title") + " (EN)"}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Reward title in English"
            required={!titleAr.trim()}
          />
        </div>

        {/* Description fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextArea
            label={`${t("rewardsModule.description")} (AR)`}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder={t(
              "rewardsModule.catalog.form.descriptionPlaceholderAr",
            )}
            dir="rtl"
            rows={3}
          />
          <TextArea
            label={`${t("rewardsModule.description")} (EN)`}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder="Description in English"
            rows={3}
          />
        </div>

        <RewardCatalogImageField
          value={imageFileId}
          existingFile={initialData?.imageFile}
          canUpload={canUploadFiles}
          canDownload={canDownloadFiles}
          disabled={loading}
          onChange={setImageFileId}
          onUploadingChange={setImageUploading}
        />

        <RewardCatalogScopeFields
          academicYears={academicYears}
          defaultAcademicYearId={defaultAcademicYearId}
          defaultTermId={defaultTermId}
          value={scope}
          onChange={setScope}
          disabled={loading}
          hideAcademicContextSelectors
        />

        {/* Type select */}
        <Select
          label={t("rewardsModule.catalog.table.type")}
          options={typeOptions}
          value={type}
          onChange={(val) => setType(val as RewardItemType)}
          required
        />

        {/* Numeric fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            label={t("rewardsModule.catalog.table.xpCost")}
            type="number"
            value={minTotalXp}
            onChange={(e) => setMinTotalXp(e.target.value)}
            placeholder="0"
          />
          <Input
            label={t("rewardsModule.catalog.table.stock")}
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="0"
            disabled={isUnlimited}
          />
          <Input
            label={t("rewardsModule.catalog.form.stockRemaining")}
            type="number"
            value={stockRemaining}
            onChange={(e) => setStockRemaining(e.target.value)}
            placeholder="0"
            disabled={isUnlimited}
            required={!isUnlimited}
            helperText={t("rewardsModule.catalog.form.stockRemainingHelp")}
          />
          <Input
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Unlimited checkbox */}
        <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isUnlimited}
            onChange={(e) => setIsUnlimited(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <p className="font-medium text-gray-900">Unlimited Stock</p>
            <p className="mt-1 text-xs text-gray-500">
              When enabled, this reward has no stock limit.
            </p>
          </div>
        </label>

        {/* Validation error */}
        {validationError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {validationError}
          </div>
        )}
      </div>
    </Modal>
  );
}
