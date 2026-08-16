import type {
  TeacherDirectoryDetail,
  TeacherEmploymentStatus,
} from "@/features/teachers/types/index";

const transitions: Record<
  TeacherEmploymentStatus,
  TeacherEmploymentStatus[]
> = {
  ACTIVE: ["INACTIVE", "TERMINATED"],
  INACTIVE: ["ACTIVE", "TERMINATED"],
  TERMINATED: [],
};

export function getAllowedTransitions(status: TeacherEmploymentStatus) {
  return transitions[status];
}

export function activationBlockers(teacher: TeacherDirectoryDetail) {
  const blockers: string[] = [];

  if (teacher.employmentStatus !== "INACTIVE") {
    blockers.push("employment_not_inactive");
  }
  if (!teacher.profileCompleteness.isComplete) {
    blockers.push("profile_incomplete");
  }
  if (!teacher.credentialSummary.hasPassword) {
    blockers.push("credential_missing");
  }

  return blockers;
}
