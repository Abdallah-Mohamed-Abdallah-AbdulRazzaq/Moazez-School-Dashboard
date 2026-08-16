"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";

interface RoleEditorModalProps {
  isOpen: boolean;
  mode: "create" | "clone" | "edit";
  initialValues?: { name: string; description: string };
  sourceRoleName?: string;
  errors?: Partial<Record<"name" | "description", string>>;
  formError?: string | null;
  onFieldChange?: (field: "name" | "description") => void;
  onClose: () => void;
  onSubmit: (payload: { name: string; description: string }) => Promise<void>;
}

export default function RoleEditorModal({
  isOpen,
  mode,
  initialValues,
  sourceRoleName,
  errors,
  formError,
  onFieldChange,
  onClose,
  onSubmit,
}: RoleEditorModalProps) {
  const t = useTranslations("settings.roles");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void Promise.resolve().then(() => {
      setName(
        mode === "edit"
          ? initialValues?.name || ""
          : mode === "clone" && sourceRoleName
            ? `${sourceRoleName} Copy`
            : "",
      );
      setDescription(mode === "edit" ? initialValues?.description || "" : "");
      setIsSaving(false);
    });
  }, [
    initialValues?.description,
    initialValues?.name,
    isOpen,
    mode,
    sourceRoleName,
  ]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? t("create_role")
          : mode === "edit"
            ? t("edit_role")
            : t("clone_role")
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!name.trim() || isSaving}
          >
            {isSaving
              ? tCommon("saving")
              : mode === "create"
                ? t("create_role")
                : mode === "edit"
                  ? t("edit_role")
                  : t("clone_role")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        <Input
          label={t("role_name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            onFieldChange?.("name");
          }}
          placeholder={t("role_name_placeholder")}
          error={errors?.name}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("role_description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onFieldChange?.("description");
            }}
            placeholder={t("role_description_placeholder")}
            className={`min-h-28 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 ${
              errors?.description
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }`}
          />
          {errors?.description ? (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
