// FILE: src/types/notifications/preferences.ts
// Notification preferences model

import type { Language } from "./enums";

export interface NotificationPreferences {
  guardianId: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  language: Language;
  emailAddress?: string;
  phoneNumber?: string;
}
