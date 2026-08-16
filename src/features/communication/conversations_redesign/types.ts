export type DetailTab = "messages" | "participants" | "invites" | "joinRequests";

export type ToastState = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

export type UserDisplayNameMap = Record<string, string>;
