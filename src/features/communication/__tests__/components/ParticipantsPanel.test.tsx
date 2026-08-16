import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParticipantsPanel from "@/features/communication/conversations_redesign/components/ParticipantsPanel";
import { createParticipant } from "../utils/test-data-generators";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("ParticipantsPanel", () => {
  const labels = conversationRedesignLabels.en;

  it("renders user.displayName and localized userType status pill", () => {
    const participant = createParticipant({
      user: {
        id: "user-1",
        displayName: "Special Demo User",
        userType: "school_user",
      },
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={false}
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[participant]}
        presenceByUserId={{}}
        total={1}
        userDisplayNames={{}}
      />
    );

    expect(screen.getByText("Special Demo User")).toBeInTheDocument();
    expect(screen.getByText("School User")).toBeInTheDocument();
  });

  it("displays localized badges for Owner, Admin, Moderator, Member, and Read-only", () => {
    const owner = createParticipant({
      user: { id: "u-1", displayName: "Owner User", userType: "school_user" },
      role: "owner",
      status: "active",
    });
    const admin = createParticipant({
      user: { id: "u-2", displayName: "Admin User", userType: "school_user" },
      role: "admin",
      status: "active",
    });
    const moderator = createParticipant({
      user: { id: "u-3", displayName: "Moderator User", userType: "school_user" },
      role: "moderator",
      status: "active",
    });
    const member = createParticipant({
      user: { id: "u-4", displayName: "Member User", userType: "school_user" },
      role: "member",
      status: "active",
    });
    const readOnly = createParticipant({
      user: { id: "u-5", displayName: "ReadOnly User", userType: "school_user" },
      role: "read_only",
      status: "active",
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={false}
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[owner, admin, moderator, member, readOnly]}
        presenceByUserId={{}}
        total={5}
        userDisplayNames={{}}
      />
    );

    expect(screen.getByText(labels.owner)).toBeInTheDocument();
    expect(screen.getByText(labels.admin)).toBeInTheDocument();
    expect(screen.getByText(labels.moderator)).toBeInTheDocument();
    expect(screen.getByText(labels.member)).toBeInTheDocument();
    expect(screen.getByText(labels.readOnlyRole)).toBeInTheDocument();
  });

  it("disables demote and remove actions for the last active OWNER", () => {
    const owner = createParticipant({
      user: { id: "u-owner", displayName: "Last Owner", userType: "school_user" },
      role: "owner",
      status: "active",
    });
    const member = createParticipant({
      user: { id: "u-member", displayName: "Regular Member", userType: "school_user" },
      role: "member",
      status: "active",
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={true}
        currentUserId="u-admin"
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[owner, member]}
        presenceByUserId={{}}
        total={2}
        userDisplayNames={{}}
      />
    );

    const ownerRow = screen.getByText("Last Owner").closest(".border-slate-100")!;
    const demoteButton = within(ownerRow).getByRole("button", { name: labels.demote });
    expect(demoteButton).toBeDisabled();

    const removeButton = within(ownerRow).getByRole("button", { name: labels.removeParticipant });
    expect(removeButton).toBeDisabled();
  });

  it("does not disable demote and remove actions if there are other active owners", () => {
    const owner1 = createParticipant({
      user: { id: "u-owner1", displayName: "Owner One", userType: "school_user" },
      role: "owner",
      status: "active",
    });
    const owner2 = createParticipant({
      user: { id: "u-owner2", displayName: "Owner Two", userType: "school_user" },
      role: "owner",
      status: "muted",
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={true}
        currentUserId="u-admin"
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[owner1, owner2]}
        presenceByUserId={{}}
        total={2}
        userDisplayNames={{}}
      />
    );

    const owner1Row = screen.getByText("Owner One").closest(".border-slate-100")!;
    const owner2Row = screen.getByText("Owner Two").closest(".border-slate-100")!;

    expect(within(owner1Row).getByRole("button", { name: labels.demote })).not.toBeDisabled();
    expect(within(owner1Row).getByRole("button", { name: labels.removeParticipant })).not.toBeDisabled();
    expect(within(owner2Row).getByRole("button", { name: labels.demote })).not.toBeDisabled();
    expect(within(owner2Row).getByRole("button", { name: labels.removeParticipant })).not.toBeDisabled();
  });

  it("hides participants with SYSTEM role", () => {
    const systemUser = createParticipant({
      user: { id: "u-system", displayName: "System Daemon", userType: "service_account" },
      role: "system",
      status: "active",
    });
    const member = createParticipant({
      user: { id: "u-member", displayName: "Regular Member", userType: "school_user" },
      role: "member",
      status: "active",
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={false}
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[systemUser, member]}
        presenceByUserId={{}}
        total={2}
        userDisplayNames={{}}
      />
    );

    expect(screen.queryByText("System Daemon")).not.toBeInTheDocument();
    expect(screen.getByText("Regular Member")).toBeInTheDocument();
  });

  it("displays Pending label instead of manage actions for users with active pending invites", () => {
    const invitedUser = createParticipant({
      user: { id: "u-invited", displayName: "Invited User", userType: "school_user" },
      role: "member",
      status: "invited",
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={true}
        currentUserId="u-admin"
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[invitedUser]}
        presenceByUserId={{}}
        total={1}
        userDisplayNames={{}}
      />
    );

    expect(screen.queryByRole("button", { name: labels.editParticipant })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.promote })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.demote })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.removeParticipant })).not.toBeInTheDocument();

    expect(screen.getAllByText(labels.pending).length).toBeGreaterThan(0);
  });
});
