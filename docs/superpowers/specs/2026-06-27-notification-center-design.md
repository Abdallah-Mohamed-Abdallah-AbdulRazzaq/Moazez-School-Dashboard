# Design Spec: Live Notification Center Integration & Optimizations

## Goal
Implement a live, real-time Notification Center inside the main navbar (`TopNav.tsx`), backed by the backend NestJS WebSocket events and existing `useNotifications` hook, with localized dropdown lists, type-based icons, optimistic mutations, and debounced socket refreshes.

---

## 1. Type Synchronization (Backend Alignment)
We align frontend notification types with backend NestJS Prisma model `CommunicationNotificationType`.

### Files to Update:
- `src/features/communication/types/notification.types.ts`: Add `"attendance_early_leave"` to the `NotificationType` union.
- `src/features/communication/components/notifications/NotificationFilters.tsx`: Add `"attendance_early_leave"` to the `notificationTypes` static array.

---

## 2. Component Design: `TopNavNotificationDropdown.tsx`
We implement a new, modular component inside `src/components/layout/TopNavNotificationDropdown.tsx`.

### UI & Configuration Features:
- **Labels Prop**: Explicitly pass a labels translation dictionary to `TopNavNotificationDropdown` from the parent context, avoiding hardcoded text.
- **Sound Control**: Speaker toggle icon (`Volume2` / `VolumeX`) in the header right next to the "Mark all read" button. Toggles the mute state using `getNotificationMuted()` and `setNotificationMuted()`.
- **Live Icons by Type**:
  - `message_received` / `message_mention` $\rightarrow$ `MessageSquare` (chat bubble icon)
  - `announcement_published` $\rightarrow$ `Megaphone` (megaphone icon)
  - `attendance_absence` / `attendance_late` / `attendance_early_leave` $\rightarrow$ `Calendar` (calendar icon)
  - `grade_posted` $\rightarrow$ `Award` (award badge icon)
  - `behavior_record_created` $\rightarrow$ `ShieldAlert` (shield warning icon)
  - `reinforcement_reward_granted` $\rightarrow$ `Gift` (gift box icon)
  - `system_alert` $\rightarrow$ `AlertTriangle` (alert triangle icon)
- **Priority Badging**: Show a visual pill badge for high/urgent priority alerts.

---

## 3. Interactions & Optimistic UI

### Click Behavior:
- **Card Click**: Clicking anywhere on the card marks it as read immediately and redirects to the deep link destination.
- **Hover Actions**: Render a clean `Archive` icon button (Lucide Archive, NOT a trash icon) on the side to archive the item.

### Optimistic UI:
- When marking an item read or archiving it, **update the local notifications list array immediately** (changing the read status inline).
- The `unreadCount` is derived from the notifications array and will automatically recalculate.
- Roll back to the original local state and display a Toast warning (*"Action failed. Please try again."*) only if the background API request fails.

---

## 4. Realtime Socket Throttling & Debounce
- In `useNotifications.ts`, wrap the socket event handler in a `100ms` debounce timer so that concurrent events trigger only a single consolidated API fetch request.
