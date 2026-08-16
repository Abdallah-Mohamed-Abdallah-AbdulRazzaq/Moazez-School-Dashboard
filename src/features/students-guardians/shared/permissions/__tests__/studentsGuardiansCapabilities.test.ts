import { describe, expect, it } from "vitest";
import type { PermissionKey } from "@/hooks/usePermissions";
import {
  getStudentsGuardiansCapabilities,
  studentsGuardiansCapabilityPermissions,
} from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

function createPermissionChecker(grantedPermissions: PermissionKey[]) {
  const granted = new Set(grantedPermissions);

  return {
    hasPermission: (permission: PermissionKey) => granted.has(permission),
    hasAllPermissions: (permissions: PermissionKey[]) =>
      permissions.every((permission) => granted.has(permission)),
  };
}

describe("studentsGuardiansCapabilities", () => {
  it("maps named capabilities to backend permissions", () => {
    expect(studentsGuardiansCapabilityPermissions).toEqual({
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
    });
  });

  it("requires both permissions for admissions document import", () => {
    expect(
      getStudentsGuardiansCapabilities(
        createPermissionChecker(["students.documents.manage"]),
      ).canImportAdmissionsDocuments,
    ).toBe(false);

    expect(
      getStudentsGuardiansCapabilities(
        createPermissionChecker(["admissions.documents.view"]),
      ).canImportAdmissionsDocuments,
    ).toBe(false);

    expect(
      getStudentsGuardiansCapabilities(
        createPermissionChecker([
          "students.documents.manage",
          "admissions.documents.view",
        ]),
      ).canImportAdmissionsDocuments,
    ).toBe(true);
  });

  it("does not require settings.users.manage for account linking", () => {
    const capabilities = getStudentsGuardiansCapabilities(
      createPermissionChecker([
        "students.records.manage",
        "students.guardians.manage",
      ]),
    );

    expect(capabilities.canLinkStudentAccount).toBe(true);
    expect(capabilities.canLinkGuardianAccount).toBe(true);
  });

  it("maps profile correction view and review to student record permissions", () => {
    const viewerCapabilities = getStudentsGuardiansCapabilities(
      createPermissionChecker(["students.records.view"]),
    );
    const managerCapabilities = getStudentsGuardiansCapabilities(
      createPermissionChecker(["students.records.manage"]),
    );

    expect(viewerCapabilities.canViewProfileCorrectionRequests).toBe(true);
    expect(viewerCapabilities.canReviewProfileCorrectionRequests).toBe(false);
    expect(managerCapabilities.canViewProfileCorrectionRequests).toBe(false);
    expect(managerCapabilities.canReviewProfileCorrectionRequests).toBe(true);
  });
});
