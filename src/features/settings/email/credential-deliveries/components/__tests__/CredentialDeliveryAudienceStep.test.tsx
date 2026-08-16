import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CredentialDeliveryAudienceStep from "../CredentialDeliveryAudienceStep";
import type { CredentialDeliveryWizardValues } from "../CredentialDeliveryWizard";
import type { RoleDefinition } from "@/features/settings/types";

const translations: Record<string, string> = {
  "audience.title": "Select audience",
  "audience.description": "Choose users for this delivery.",
  "audience.mode": "Audience",
  "audience.options.selected_users": "Selected users",
  "audience.options.role": "Role",
  "audience.options.user_type": "User type",
  "audience.options.missing_password": "Missing password",
  "audience.options.must_change_password": "Must change password",
  "audience.options.all_school": "All school",
  "audience.selected_users": "Selected users",
  "audience.selected_users_placeholder": "Search users",
  "audience.selected_users_help": "Search and add users.",
  "audience.role_id": "Role",
  "audience.role_placeholder": "Select a role",
  "audience.roles_empty": "No roles were loaded.",
  "audience.roles_loading": "Loading roles...",
  "audience.roles_load_failed": "Roles could not be loaded.",
  "audience.roles_retry": "Retry",
  "audience.role_option": "{name} · {count} members",
  "audience.user_type": "User type",
  "audience.user_type_placeholder": "Select user type",
  "audience.userTypes.teacher": "Teacher",
  "audience.userTypes.applicant": "Applicant",
  "audience.require_contact_email": "Require contact email",
  "audience.require_contact_email_help": "Skip users without contact email.",
  "audience.allow_login_email_fallback": "Use login email as fallback",
  "audience.allow_login_email_fallback_help":
    "Use the login email when contact email is missing.",
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations:
    () => (key: string, params?: Record<string, string | number>) =>
      Object.entries(params ?? {}).reduce(
        (message, [name, value]) =>
          message.replace(`{${name}}`, String(value)),
        translations[key] ?? key,
      ),
}));

vi.mock("@/features/communication/components/selectors/UserMultiSearchSelect", () => ({
  default: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (userIds: string[]) => void;
  }) => (
    <button type="button" onClick={() => onChange(["user-1"])}>
      {label}
    </button>
  ),
}));

const baseValues: CredentialDeliveryWizardValues = {
  audienceMode: "all-school",
  audience: { allSchool: true },
  selectedUserIdsText: "",
  requireContactEmail: true,
  allowLoginEmailFallback: false,
  templateKey: "ACCOUNT_CREDENTIALS",
  credentialMode: "LOGIN_INFO_ONLY",
};

function renderAudienceStep(
  values: CredentialDeliveryWizardValues,
  roles: RoleDefinition[] = [],
  roleState: {
    isLoadingRoles?: boolean;
    rolesError?: boolean;
    onRetryRoles?: () => void;
  } = {},
) {
  const onChange = vi.fn();
  render(
    <CredentialDeliveryAudienceStep
      values={values}
      roles={roles}
      isLoadingRoles={roleState.isLoadingRoles}
      rolesError={roleState.rolesError}
      onRetryRoles={roleState.onRetryRoles}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("CredentialDeliveryAudienceStep", () => {
  it("selects searched users instead of accepting pasted IDs", () => {
    const onChange = renderAudienceStep({
      ...baseValues,
      audienceMode: "selected-users",
      audience: { userIds: [] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Selected users" }));

    expect(onChange).toHaveBeenCalledWith({
      selectedUserIdsText: "user-1",
      audience: { userIds: ["user-1"] },
    });
  });

  it("selects a user type from the fixed dropdown", () => {
    const onChange = renderAudienceStep({
      ...baseValues,
      audienceMode: "user-type",
      audience: {},
    });

    fireEvent.click(screen.getByRole("button", { name: "User type" }));
    fireEvent.click(screen.getByRole("button", { name: "Teacher" }));

    expect(onChange).toHaveBeenCalledWith({
      audience: { userType: "teacher" },
    });
  });

  it("offers every backend-supported user type", () => {
    const onChange = renderAudienceStep({
      ...baseValues,
      audienceMode: "user-type",
      audience: {},
    });

    fireEvent.click(screen.getByRole("button", { name: "User type" }));
    fireEvent.click(screen.getByRole("button", { name: "Applicant" }));

    expect(onChange).toHaveBeenCalledWith({
      audience: { userType: "applicant" },
    });
  });

  it("does not send role ids to the backend role-key filter", () => {
    renderAudienceStep(
      { ...baseValues, audienceMode: "role", audience: {} },
      [
        {
          id: "role-1",
          name: "Teacher Role",
          description: "Teachers",
          isSystem: true,
          memberCount: 2,
          permissions: [],
        },
      ],
    );

    fireEvent.click(screen.getByRole("button", { name: "Role" }));

    expect(
      screen.queryByRole("button", { name: "Teacher Role" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No roles were loaded." })).toBeDisabled();
  });

  it("enables the backend login-email fallback as one recipient policy", () => {
    const onChange = renderAudienceStep(baseValues);

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Use login email as fallback/ }),
    );

    expect(onChange).toHaveBeenCalledWith({
      requireContactEmail: false,
      allowLoginEmailFallback: true,
    });
  });

  it("lists roles in a searchable dropdown", () => {
    const onChange = renderAudienceStep(
      { ...baseValues, audienceMode: "role", audience: {} },
      [
        {
          id: "role-1",
          key: "teacher",
          name: "Teacher Role",
          description: "Teachers",
          isSystem: true,
          memberCount: 2,
          permissions: [],
        },
      ],
    );

    fireEvent.click(screen.getByRole("button", { name: "Role" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Teacher Role · 2 members" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      audience: { roleKey: "teacher" },
    });
  });

  it("shows a recoverable role loading error", async () => {
    const user = userEvent.setup();
    const onRetryRoles = vi.fn();
    renderAudienceStep(
      { ...baseValues, audienceMode: "role", audience: {} },
      [],
      { rolesError: true, onRetryRoles },
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Roles could not be loaded.",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryRoles).toHaveBeenCalledOnce();
  });
});
