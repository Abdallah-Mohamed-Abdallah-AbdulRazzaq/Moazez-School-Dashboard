import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function createConversationDialogLabels(labels: ConversationRedesignLabels) {
  return {
    createTitle: labels.createConversation,
    editTitle: labels.editConversation,
    title: labels.title,
    type: labels.type,
    description: labels.description,
    academicYearId: labels.academicYearId,
    termId: labels.termId,
    stageId: labels.stageId,
    gradeId: labels.gradeId,
    sectionId: labels.sectionId,
    classroomId: labels.classroomId,
    subjectId: labels.subjectId,
    avatarFileId: labels.avatarFileId,
    isReadOnly: labels.readOnly,
    isPinned: labels.pinned,
    group: labels.group,
    classroom: labels.classroom,
    direct: labels.direct,
    directUnavailable: labels.directUnavailable,
    grade: labels.grade,
    section: labels.section,
    stage: labels.stage,
    schoolWide: labels.schoolWide,
    support: labels.support,
    system: labels.system,
    cancel: labels.cancel,
    create: labels.create,
    save: labels.save,
    titleRequired: labels.titleRequired,
    classroomRequired: labels.classroomRequired,
  };
}

export function participantDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.addParticipant,
    userId: labels.user,
    role: labels.role,
    status: labels.status,
    mutedUntil: labels.mutedUntil,
    cancel: labels.cancel,
    add: labels.add,
    userRequired: labels.userRequired,
    owner: labels.owner,
    admin: labels.admin,
    moderator: labels.moderator,
    member: labels.member,
    readOnly: labels.readOnlyRole,
    system: labels.system,
    active: labels.active,
    invited: labels.invited,
    left: labels.left,
    removed: labels.removed,
    muted: labels.muted,
    blocked: labels.blocked,
  };
}

export function editParticipantDialogLabels(labels: ConversationRedesignLabels) {
  return {
    ...participantDialogLabels(labels),
    editTitle: labels.editParticipantTitle,
    promoteTitle: labels.promoteParticipantTitle,
    demoteTitle: labels.demoteParticipantTitle,
    targetRole: labels.targetRole,
    save: labels.save,
    promote: labels.promote,
    demote: labels.demote,
  };
}

export function removeParticipantDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.removeParticipantTitle,
    description: labels.removeParticipantDescription,
    cancel: labels.cancel,
    remove: labels.removeParticipant,
  };
}

export function leaveConversationDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.leaveConversationTitle,
    description: labels.leaveConversationDescription,
    cancel: labels.cancel,
    leave: labels.leaveConversation,
  };
}

export function createInviteDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.createInvite,
    invitedUserId: labels.invitedUser,
    expiresAt: labels.expiresAt,
    cancel: labels.cancel,
    create: labels.create,
    userRequired: labels.userRequired,
  };
}

export function rejectInviteDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.rejectInviteTitle,
    description: labels.rejectInviteDescription,
    reason: labels.reason,
    cancel: labels.cancel,
    reject: labels.rejectInvite,
  };
}

export function createJoinRequestDialogLabels(labels: ConversationRedesignLabels) {
  return {
    title: labels.createJoinRequest,
    note: labels.note,
    cancel: labels.cancel,
    create: labels.create,
  };
}

export function reviewJoinRequestDialogLabels(labels: ConversationRedesignLabels) {
  return {
    approveTitle: labels.reviewJoinRequest,
    rejectTitle: labels.rejectJoinRequest,
    approveDescription: labels.approveJoinRequestDescription,
    rejectDescription: labels.rejectJoinRequestDescription,
    reason: labels.reason,
    cancel: labels.cancel,
    approve: labels.approveRequest,
    reject: labels.rejectRequest,
  };
}

