import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CampaignAudienceStep, {
  type CampaignAudienceValues,
} from "../CampaignAudienceStep";
import type { RoleDefinition } from "@/features/settings/types";

const translations: Record<string, string> = {
  "audience.title": "Select audience",
  "audience.description": "Choose users for this campaign.",
  "audience.mode": "Audience",
  "audience.options.selected_users": "Selected users",
  "audience.options.role": "Role",
  "audience.options.user_type": "User type",
  "audience.options.all_school": "All school",
  "audience.selected_users": "Selected users",
  "audience.selected_users_placeholder": "Search users",
  "audience.selected_users_help": "Search and add users.",
  "audience.role_id": "Role",
  "audience.role_placeholder": "Select a role",
  "audience.roles_empty": "No roles were loaded. Refresh and try again.",
  "audience.roles_loading": "Loading roles...",
  "audience.roles_load_failed": "Roles could not be loaded.",
  "audience.roles_retry": "Retry",
  "audience.role_option": "{name} · {count} members",
  "audience.user_type": "User type",
  "audience.user_type_placeholder": "Select user type",
  "audience.userTypes.school_user": "School user",
  "audience.userTypes.teacher": "Teacher",
  "audience.userTypes.student": "Student",
  "audience.userTypes.parent": "Parent",
  "audience.userTypes.applicant": "Applicant",
  "audience.userTypes.pickup_delegate": "Pickup delegate",
  "audience.userTypes.organization_user": "Organization user",
  "audience.userTypes.platform_user": "Platform user",
  "audience.userTypes.service_account": "Service account",
  "audience.custom_emails": "Custom emails",
  "audience.custom_emails_help": "Optional external recipients.",
  "audience.custom_email_add": "Add email",
  "audience.custom_email_placeholder": "Enter email address",
  "audience.custom_email_invalid": "Enter a valid email address.",
  "audience.custom_email_duplicate": "This email is already added.",
  "audience.custom_email_remove": "Remove {email}",
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations:
    () => (key: string, params?: Record<string, string>) =>
      Object.entries(params ?? {}).reduce(
        (message, [name, value]) => message.replace(`{${name}}`, value),
        translations[key] ?? key,
      ),
}));

vi.mock("@/features/communication/components/selectors/UserMultiSearchSelect", () => ({
  default: ({
    label,
    onChange,
    value,
  }: {
    label: string;
    onChange: (value: string[]) => void;
    value: string[];
  }) => (
    <div>
      <p>{label}</p>
      <p data-testid="selected-user-count">{value.length}</p>
      <button type="button" onClick={() => onChange(["user-1"])}>
        add searched user
      </button>
    </div>
  ),
}));

function renderAudienceStep(
  values: CampaignAudienceValues,
  roles: RoleDefinition[] = [],
  roleState: {
    isLoadingRoles?: boolean;
    rolesError?: boolean;
    onRetryRoles?: () => void;
  } = {},
) {
  const onChange = vi.fn();

  render(
    <CampaignAudienceStep
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

const baseValues: CampaignAudienceValues = {
  audienceMode: "all-school",
  audience: { allSchool: true },
  selectedUserIdsText: "",
  customEmailsText: "",
};

describe("CampaignAudienceStep", () => {
  it("uses user search selection for selected-user audiences", () => {
    const onChange = renderAudienceStep({
      ...baseValues,
      audienceMode: "selected-users",
      audience: { userIds: [] },
    });

    expect(screen.getAllByText("Selected users").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("textbox", { name: "Selected user IDs" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "add searched user" }));

    expect(onChange).toHaveBeenCalledWith({
      selectedUserIdsText: "user-1",
      audience: { userIds: ["user-1"] },
    });
  });

  it("uses a fixed dropdown for user-type audiences", () => {
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

  it("does not send role ids to the backend role-key filter", () => {
    renderAudienceStep(
      {
        ...baseValues,
        audienceMode: "role",
        audience: {},
      },
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
    expect(
      screen.getByRole("button", {
        name: "No roles were loaded. Refresh and try again.",
      }),
    ).toBeDisabled();
  });

  it("shows a clear disabled empty role option when no roles are usable", () => {
    renderAudienceStep({
      ...baseValues,
      audienceMode: "role",
      audience: {},
    });

    fireEvent.click(screen.getByRole("button", { name: "Role" }));

    expect(
      screen.getByRole("button", {
        name: "No roles were loaded. Refresh and try again.",
      }),
    ).toBeDisabled();
  });

  it("shows role member counts in the role options", () => {
    renderAudienceStep(
      { ...baseValues, audienceMode: "role", audience: {} },
      [
        {
          id: "role-1",
          key: "teacher",
          name: "Teacher",
          description: "Teachers",
          isSystem: true,
          memberCount: 24,
          permissions: [],
        },
      ],
    );

    fireEvent.click(screen.getByRole("button", { name: "Role" }));

    expect(
      screen.getByRole("button", { name: "Teacher · 24 members" }),
    ).toBeVisible();
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

  it("adds custom emails as removable badges while storing backend text internally", async () => {
    const user = userEvent.setup();
    const onChange = renderAudienceStep(baseValues);

    await user.type(
      screen.getByRole("textbox", { name: "Custom emails" }),
      "family@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Add email" }));

    expect(onChange).toHaveBeenCalledWith({
      customEmailsText: "family@example.com",
      audience: {
        allSchool: true,
        customEmails: ["family@example.com"],
      },
    });
  });

  it("removes custom email badges and updates the internal backend text", async () => {
    const user = userEvent.setup();
    const onChange = renderAudienceStep({
      ...baseValues,
      customEmailsText: "family@example.com\nparent@example.com",
      audience: {
        allSchool: true,
        customEmails: ["family@example.com", "parent@example.com"],
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Remove family@example.com" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      customEmailsText: "parent@example.com",
      audience: {
        allSchool: true,
        customEmails: ["parent@example.com"],
      },
    });
  });

  it("rejects invalid custom emails before updating the audience payload", async () => {
    const user = userEvent.setup();
    const onChange = renderAudienceStep(baseValues);

    await user.type(screen.getByRole("textbox", { name: "Custom emails" }), "bad");
    await user.click(screen.getByRole("button", { name: "Add email" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
