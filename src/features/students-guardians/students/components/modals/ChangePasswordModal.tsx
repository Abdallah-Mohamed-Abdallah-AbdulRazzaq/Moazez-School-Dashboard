// FILE: src/components/students-guardians/modals/ChangePasswordModal.tsx

"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Input, Modal } from "@/components/ui";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { newPassword: string; confirmPassword: string }) => void;
  userName: string;
  userType: "student" | "guardian";
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  userName,
  userType,
}: ChangePasswordModalProps) {
  const t = useTranslations("students_guardians.change_password");
  const tPasswordPolicy = useTranslations("password_policy");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("error_mismatch"));
      return;
    }

    onSubmit({ newPassword, confirmPassword });
    handleClose();
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      description={`${userType === "student" ? t("for_student") : t("for_guardian")}: ${userName}`}
      icon={<Lock className="w-5 h-5" />}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="change-password-form"
            leftIcon={<Lock className="w-4 h-4" />}
          >
            {t("change_password")}
          </Button>
        </>
      }
    >
        <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">{t("info_message")}</p>
          </div>

          {/* New Password */}
          <div className="relative">
              <Input
                label={t("new_password")}
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                placeholder={t("enter_new_password")}
                required
                helperText={tPasswordPolicy("requirements")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-8 p-1 text-gray-400"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </Button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
              <Input
                label={t("confirm_password")}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                placeholder={t("enter_confirm_password")}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-8 p-1 text-gray-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

        </form>
    </Modal>
  );
}
