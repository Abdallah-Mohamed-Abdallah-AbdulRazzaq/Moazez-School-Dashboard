"use client";

import { useState } from "react";
import {
  generateUserCredential,
  regenerateUserCredential,
  setUserCredentialPassword,
} from "@/features/settings/credentials/services/credentialsService";
import type { RevealedCredential } from "@/features/settings/credentials/components/TemporaryPasswordRevealModal";
import type { SetCredentialPasswordRequest } from "@/features/settings/credentials/types";
import type { TeacherDirectoryDetail } from "@/features/teachers/types/index";

type CredentialAction = "generate" | "regenerate" | "set";

export function useTeacherCredentialActions(
  teacher: TeacherDirectoryDetail,
  refreshTeacher: () => Promise<void>,
) {
  const [activeAction, setActiveAction] = useState<CredentialAction | null>(null);
  const [revealedCredentials, setRevealedCredentials] =
    useState<RevealedCredential[]>([]);

  const provisionTemporaryCredential = async (
    action: "generate" | "regenerate",
  ) => {
    setActiveAction(action);
    try {
      const credential = action === "generate"
        ? await generateUserCredential(teacher.userId)
        : await regenerateUserCredential(teacher.userId);
      setRevealedCredentials([
        {
          ...credential,
          fullName: teacher.displayName.fullName,
          username: teacher.username ?? undefined,
          loginEmail: teacher.loginEmail,
        },
      ]);
      await refreshTeacher();
    } finally {
      setActiveAction(null);
    }
  };

  const saveCustomPassword = async (request: SetCredentialPasswordRequest) => {
    setActiveAction("set");
    try {
      await setUserCredentialPassword(teacher.userId, request);
      await refreshTeacher();
    } finally {
      setActiveAction(null);
    }
  };

  return {
    activeAction,
    revealedCredentials,
    provisionTemporaryCredential,
    saveCustomPassword,
    clearRevealedCredentials: () => setRevealedCredentials([]),
  };
}
