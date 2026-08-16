"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import {
  SCOPE_PERMISSION_DENIED_EVENT,
  type ScopePermissionDeniedEventDetail,
} from "@/lib/access-denied-event";

export function ScopePermissionDeniedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [missingPermissions, setMissingPermissions] = useState<string[]>([]);
  const t = useTranslations("common.scopePermissionDenied");

  useEffect(() => {
    const openPermissionDeniedModal = (event: Event) => {
      const scopePermissionEvent =
        event as CustomEvent<ScopePermissionDeniedEventDetail>;
      setMissingPermissions(scopePermissionEvent.detail?.missingPermissions ?? []);
      setIsOpen(true);
    };
    window.addEventListener(
      SCOPE_PERMISSION_DENIED_EVENT,
      openPermissionDeniedModal,
    );

    return () =>
      window.removeEventListener(
        SCOPE_PERMISSION_DENIED_EVENT,
        openPermissionDeniedModal,
      );
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        title={t("title")}
        description={t("description")}
        footer={
          <Button onClick={() => setIsOpen(false)}>{t("dismiss")}</Button>
        }
      >
        {missingPermissions.length > 0 && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">{t("requiredPermissions")}</p>
            <ul className="mt-2 list-disc space-y-1 ps-5">
              {missingPermissions.map((permission) => (
                <li key={permission}>
                  <code>{permission}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="pb-4 text-sm text-gray-600">{t("guidance")}</p>
      </Modal>
      {children}
    </>
  );
}
