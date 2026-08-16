"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import type { OneTimeCredentialResponse } from "@/features/settings/credentials/types";

export interface RevealedCredential extends OneTimeCredentialResponse {
  fullName?: string;
  username?: string;
  loginEmail?: string;
}

interface TemporaryPasswordRevealModalProps {
  isOpen: boolean;
  credentials: RevealedCredential[];
  onClose: () => void;
  labels: {
    title: string;
    warning: string;
    noPassword: string;
    copy: string;
    copied: string;
    close: string;
    user: string;
    password: string;
    show: string;
    hide: string;
  };
}

export default function TemporaryPasswordRevealModal({
  isOpen,
  credentials,
  onClose,
  labels,
}: TemporaryPasswordRevealModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const hasPasswords = useMemo(
    () => credentials.some((credential) => credential.temporaryPassword),
    [credentials],
  );

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={labels.title}
      size="xl"
      closeOnOverlayClick={false}
      description={
        <span className="inline-flex items-start gap-2 text-amber-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{labels.warning}</span>
        </span>
      }
      footer={
        <Button variant="primary" onClick={onClose}>
          {labels.close}
        </Button>
      }
    >
      {hasPasswords ? (
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {credentials.map((credential) => {
            const password = credential.temporaryPassword;
            const key = credential.userId;
            const isVisible = visiblePasswords[key] ?? true;
            return (
              <div
                key={key}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {credential.fullName || credential.userId}
                  </p>
                  <p className="break-all text-xs text-gray-500">
                    {credential.username || credential.loginEmail || credential.userId}
                  </p>
                </div>
                {password ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900">
                      {isVisible ? password : "••••••••••••"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={
                          isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )
                        }
                        onClick={() =>
                          setVisiblePasswords((current) => ({
                            ...current,
                            [key]: !isVisible,
                          }))
                        }
                      >
                        {isVisible ? labels.hide : labels.show}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Copy className="h-4 w-4" />}
                        onClick={() => void handleCopy(key, password)}
                      >
                        {copiedKey === key ? labels.copied : labels.copy}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{labels.noPassword}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {labels.noPassword}
        </p>
      )}
    </Modal>
  );
}
