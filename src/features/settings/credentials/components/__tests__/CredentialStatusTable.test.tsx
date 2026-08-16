import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CredentialStatusTable from "@/features/settings/credentials/components/CredentialStatusTable";
import type {
  CredentialStatusFilter,
  CredentialStatusRecord,
} from "@/features/settings/credentials/types";

const credentialStatusLabels: Record<CredentialStatusFilter, string> = {
  missing: "Missing credential",
  set: "Credential set",
  temporary_or_must_change: "Temporary or must change",
  must_change: "Must change",
};

const records = (
  Object.keys(credentialStatusLabels) as CredentialStatusFilter[]
).map<CredentialStatusRecord>((status, index) => ({
  userId: `user-${index}`,
  fullName: `User ${index}`,
  username: `user${index}`,
  loginEmail: `user${index}@example.com`,
  contactEmail: null,
  userType: "staff",
  roleId: "role-1",
  roleKey: "teacher",
  roleName: "Teacher",
  status,
  hasPassword: status !== "missing",
  mustChangePassword:
    status === "temporary_or_must_change" || status === "must_change",
}));

describe("CredentialStatusTable", () => {
  it("renders credential-specific labels for every backend status", () => {
    render(
      <CredentialStatusTable
        records={records}
        searchQuery=""
        page={1}
        limit={10}
        total={records.length}
        isLoading={false}
        canManage={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onGenerate={vi.fn()}
        onSetPassword={vi.fn()}
        onRegenerate={vi.fn()}
        labels={{
          name: "Name",
          usernameLogin: "Login",
          contactEmail: "Contact email",
          role: "Role",
          status: "Credential status",
          hasPassword: "Has password",
          mustChangePassword: "Must change password",
          provisionedAt: "Provisioned at",
          changedAt: "Changed at",
          version: "Version",
          actions: "Actions",
          yes: "Yes",
          no: "No",
          notAvailable: "Not available",
          generate: "Generate",
          setPassword: "Set password",
          regenerate: "Regenerate",
          credentialStatuses: credentialStatusLabels,
        }}
      />,
    );

    Object.values(credentialStatusLabels).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
