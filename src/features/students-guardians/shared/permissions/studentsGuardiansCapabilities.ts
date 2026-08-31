import type { PermissionKey } from "@/hooks/usePermissions";

export type StudentsGuardiansCapability =
  | "canViewStudents"
  | "canManageStudents"
  | "canLinkStudentAccount"
  | "canViewGuardians"
  | "canManageGuardians"
  | "canLinkGuardianAccount"
  | "canLinkGuardianToStudent"
  | "canUpdateStudentGuardianLink"
  | "canUnlinkGuardianFromStudent"
  | "canViewEnrollments"
  | "canManageEnrollments"
  | "canViewDocuments"
  | "canManageDocuments"
  | "canImportAdmissionsDocuments"
  | "canViewMedical"
  | "canManageMedical"
  | "canViewNotes"
  | "canManageNotes"
  | "canViewProfileCorrectionRequests"
  | "canReviewProfileCorrectionRequests"
  | "canBulkRegisterStudents"
  | "canViewStudentCredentialBatches"
  | "canManageStudentCredentialBatches";

export type StudentsGuardiansCapabilities = Record<
  StudentsGuardiansCapability,
  boolean
>;

export interface StudentsGuardiansPermissionChecker {
  hasPermission: (permission: PermissionKey) => boolean;
  hasAllPermissions?: (permissions: PermissionKey[]) => boolean;
}

export const studentsGuardiansCapabilityPermissions = {
  canViewStudents: ["students.records.view"],
  canManageStudents: ["students.records.manage"],
  canLinkStudentAccount: ["students.records.manage"],
  canViewGuardians: ["students.guardians.view"],
  canManageGuardians: ["students.guardians.manage"],
  canLinkGuardianAccount: ["students.guardians.manage"],
  canLinkGuardianToStudent: ["students.guardians.manage"],
  canUpdateStudentGuardianLink: ["students.guardians.manage"],
  canUnlinkGuardianFromStudent: ["students.guardians.manage"],
  canViewEnrollments: ["students.enrollments.view"],
  canManageEnrollments: ["students.enrollments.manage"],
  canViewDocuments: ["students.documents.view"],
  canManageDocuments: ["students.documents.manage"],
  canImportAdmissionsDocuments: [
    "students.documents.manage",
    "admissions.documents.view",
  ],
  canViewMedical: ["students.medical.view"],
  canManageMedical: ["students.medical.manage"],
  canViewNotes: ["students.notes.view"],
  canManageNotes: ["students.notes.manage"],
  canViewProfileCorrectionRequests: ["students.records.view"],
  canReviewProfileCorrectionRequests: ["students.records.manage"],
  canBulkRegisterStudents: [
    "students.records.manage",
    "students.enrollments.manage",
  ],
  canViewStudentCredentialBatches: [
    "students.records.view",
    "settings.users.view",
  ],
  canManageStudentCredentialBatches: [
    "students.records.view",
    "settings.users.manage",
  ],
} as const satisfies Record<StudentsGuardiansCapability, PermissionKey[]>;

export function hasStudentsGuardiansCapability(
  checker: StudentsGuardiansPermissionChecker,
  capability: StudentsGuardiansCapability,
): boolean {
  const requiredPermissions = studentsGuardiansCapabilityPermissions[
    capability
  ] as readonly PermissionKey[];

  if (checker.hasAllPermissions) {
    return checker.hasAllPermissions([...requiredPermissions]);
  }

  return requiredPermissions.every((permission) =>
    checker.hasPermission(permission),
  );
}

export function getStudentsGuardiansCapabilities(
  checker: StudentsGuardiansPermissionChecker,
): StudentsGuardiansCapabilities {
  return Object.keys(studentsGuardiansCapabilityPermissions).reduce(
    (capabilities, capability) => {
      const typedCapability = capability as StudentsGuardiansCapability;

      return {
        ...capabilities,
        [typedCapability]: hasStudentsGuardiansCapability(
          checker,
          typedCapability,
        ),
      };
    },
    {} as StudentsGuardiansCapabilities,
  );
}
