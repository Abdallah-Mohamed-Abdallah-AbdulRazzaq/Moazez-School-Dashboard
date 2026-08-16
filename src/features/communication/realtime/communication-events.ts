export const COMMUNICATION_SOCKET_EVENTS = {
  messageCreated: "communication.chat.message.created",
  messageUpdated: "communication.chat.message.updated",
  messageDeleted: "communication.chat.message.deleted",
  messageRead: "communication.chat.message.read",

  reactionUpserted: "communication.chat.reaction.upserted",
  reactionDeleted: "communication.chat.reaction.deleted",

  attachmentLinked: "communication.chat.attachment.linked",
  attachmentDeleted: "communication.chat.attachment.deleted",

  typingStarted: "communication.typing.started",
  typingStopped: "communication.typing.stopped",

  presenceUserUpdated: "communication.presence.user.updated",

  announcementPublished: "communication.announcement.published",

  notificationCreated: "communication.notification.created",
  notificationRead: "communication.notification.read",

  // commands to server
  conversationJoin: "communication.chat.conversation.join",
  conversationLeave: "communication.chat.conversation.leave",
  typingStart: "communication.typing.start",
  typingStop: "communication.typing.stop",
} as const;

export const COMMUNICATION_MESSAGE_EVENTS = {
  created: COMMUNICATION_SOCKET_EVENTS.messageCreated,
  updated: COMMUNICATION_SOCKET_EVENTS.messageUpdated,
  deleted: COMMUNICATION_SOCKET_EVENTS.messageDeleted,
  read: COMMUNICATION_SOCKET_EVENTS.messageRead,
} as const;

export const COMMUNICATION_REACTION_EVENTS = {
  upserted: COMMUNICATION_SOCKET_EVENTS.reactionUpserted,
  deleted: COMMUNICATION_SOCKET_EVENTS.reactionDeleted,
} as const;

export const COMMUNICATION_ATTACHMENT_EVENTS = {
  linked: COMMUNICATION_SOCKET_EVENTS.attachmentLinked,
  deleted: COMMUNICATION_SOCKET_EVENTS.attachmentDeleted,
} as const;

export const COMMUNICATION_TYPING_EVENTS = {
  started: COMMUNICATION_SOCKET_EVENTS.typingStarted,
  stopped: COMMUNICATION_SOCKET_EVENTS.typingStopped,
} as const;

export const COMMUNICATION_PRESENCE_EVENTS = {
  userUpdated: COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated,
} as const;

export const COMMUNICATION_ANNOUNCEMENT_EVENTS = {
  published: COMMUNICATION_SOCKET_EVENTS.announcementPublished,
} as const;

export const COMMUNICATION_NOTIFICATION_EVENTS = {
  created: COMMUNICATION_SOCKET_EVENTS.notificationCreated,
  read: COMMUNICATION_SOCKET_EVENTS.notificationRead,
} as const;

export const COMMUNICATION_ROOM_EVENTS = {
  join: COMMUNICATION_SOCKET_EVENTS.conversationJoin,
  leave: COMMUNICATION_SOCKET_EVENTS.conversationLeave,
} as const;

export type CommunicationSocketEvent =
  (typeof COMMUNICATION_SOCKET_EVENTS)[keyof typeof COMMUNICATION_SOCKET_EVENTS];
