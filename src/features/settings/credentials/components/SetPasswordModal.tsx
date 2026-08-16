"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import type { CredentialStatusRecord } from "@/features/settings/credentials/types";

type CredentialModalUser = Pick<CredentialStatusRecord, "fullName" | "username" | "loginEmail">;

interface SetPasswordModalProps {
  isOpen: boolean;
  user: CredentialModalUser | null;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (password: string, mustChangePassword: boolean) => Promise<void>;
  labels: {
    title: string;
    description: string;
    password: string;
    confirmPassword: string;
    mustChangePassword: string;
    cancel: string;
    save: string;
    saving: string;
    required: string;
    mismatch: string;
    invalidLength: string;
    show: string;
    hide: string;
  };
}

export default function SetPasswordModal({
  isOpen,
  user,
  isSubmitting,
  error,
  onClose,
  onSubmit,
  labels,
}: SetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isValid = Boolean(
    password && confirmPassword && password === confirmPassword,
  );

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setLocalError(labels.required);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(labels.mismatch);
      return;
    }
    await onSubmit(password, mustChangePassword);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={labels.title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? labels.saving : labels.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{labels.description}</p>
        {user ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-900">{user.fullName}</p>
            <p className="break-all text-gray-500">
              {user.username || user.loginEmail}
            </p>
          </div>
        ) : null}
        {(localError || error) ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError || error}
          </p>
        ) : null}
        <Input
          label={labels.password}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setLocalError(null);
          }}
          rightIcon={
            <button
              type="button"
              aria-label={showPassword ? labels.hide : labels.show}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />
        <Input
          label={labels.confirmPassword}
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setLocalError(null);
          }}
          rightIcon={
            <button
              type="button"
              aria-label={showConfirmPassword ? labels.hide : labels.show}
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={mustChangePassword}
            onChange={(event) => setMustChangePassword(event.target.checked)}
          />
          <span>{labels.mustChangePassword}</span>
        </label>
      </div>
    </Modal>
  );
}
