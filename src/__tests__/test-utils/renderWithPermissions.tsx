import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import {
  AuthContext,
  type AuthContextValue,
} from "@/features/auth/context/AuthContext";
import type { PermissionKey } from "@/hooks/usePermissions";
import type { MeResponse } from "@/types/user";

const authenticatedUserIdentity: Omit<MeResponse, "activeMembership"> = {
  id: "test-user",
  email: "test@school.example",
  username: "test-user",
  contactEmail: null,
  firstName: "Test",
  lastName: "User",
  userType: "SCHOOL_USER",
  status: "ACTIVE",
  mustChangePassword: false,
};

async function rejectUnexpectedAuthCommand(): Promise<never> {
  throw new Error("Auth commands are unavailable in permission render tests.");
}

export function renderWithPermissions(
  ui: ReactElement,
  permissions: readonly PermissionKey[],
  options?: Omit<RenderOptions, "wrapper">,
) {
  const user: MeResponse = {
    ...authenticatedUserIdentity,
    activeMembership: {
      membershipId: "membership-1",
      organizationId: "organization-1",
      schoolId: "school-1",
      roleId: "role-1",
      roleKey: "school.admin",
      permissions: [...permissions],
    },
  };
  const authContext = {
    user,
    isAuthenticated: true,
    isLoading: false,
    mustChangePassword: false,
    login: rejectUnexpectedAuthCommand,
    logout: rejectUnexpectedAuthCommand,
    refreshCurrentUser: rejectUnexpectedAuthCommand,
    changePassword: rejectUnexpectedAuthCommand,
  } satisfies AuthContextValue;

  return render(
    <AuthContext.Provider value={authContext}>{ui}</AuthContext.Provider>,
    options,
  );
}
