"use client";

import { useCallback, useState } from "react";
import { generateUserCredential } from "@/features/settings/credentials/services/credentialsService";
import type { OneTimeCredentialResponse } from "@/features/settings/credentials/types";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type {
  ChangeTeacherEmploymentStatusRequest,
  CreateTeacherRequest,
  RehireTeacherRequest,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";

export type TeacherAction =
  | "create"
  | "update"
  | "employment"
  | "archive"
  | "rehire";

export interface CreateTeacherWorkflowResult {
  teacher: Awaited<ReturnType<typeof teacherApi.create>>;
  credential: OneTimeCredentialResponse;
}

export function useTeacherActions() {
  const [activeAction, setActiveAction] = useState<TeacherAction | null>(null);

  const runAction = useCallback(
    async <T,>(action: TeacherAction, operation: () => Promise<T>) => {
      setActiveAction(action);
      try {
        return await operation();
      } finally {
        setActiveAction(null);
      }
    },
    [],
  );

  return {
    activeAction,
    createTeacher: (input: CreateTeacherRequest) =>
      runAction<CreateTeacherWorkflowResult>("create", async () => {
        const teacher = await teacherApi.create({ ...input, employmentStatus: "ACTIVE" });
        const credential = await generateUserCredential(teacher.userId);
        await teacherApi.changeEmploymentStatus(teacher.id, { employmentStatus: "INACTIVE" });
        await teacherApi.changeEmploymentStatus(teacher.id, { employmentStatus: "ACTIVE" });

        return { teacher, credential };
      }),
    updateTeacher: (teacherId: string, input: UpdateTeacherRequest) =>
      runAction("update", () => teacherApi.update(teacherId, input)),
    changeEmploymentStatus: (
      teacherId: string,
      input: ChangeTeacherEmploymentStatusRequest,
    ) =>
      runAction("employment", () =>
        teacherApi.changeEmploymentStatus(teacherId, input),
      ),
    archiveTeacher: (teacherId: string) =>
      runAction("archive", () => teacherApi.archive(teacherId)),
    rehireTeacher: (teacherId: string, input: RehireTeacherRequest) =>
      runAction("rehire", () => teacherApi.rehire(teacherId, input)),
  };
}
