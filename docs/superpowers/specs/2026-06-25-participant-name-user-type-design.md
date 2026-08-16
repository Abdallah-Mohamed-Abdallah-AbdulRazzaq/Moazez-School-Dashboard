# Design Spec: Participant Name and User Type in Conversations

## Goal
Enable conversations/participants list and redesigned chat interfaces to display the participant's display name and localized user type (userType) from the nested user data.

## Proposed Changes

### Types & Core Data Flow
- **Modify** `src/features/communication/types/conversation.types.ts`:
  Add `user` field with `id`, `displayName`, and `userType` to the `ConversationParticipant` interface.
- **Modify** `src/features/communication/hooks/useConversationParticipants.ts`:
  Update sorting logic in `sortParticipants` to prioritize `participant.user?.displayName`.
- **Modify** `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`:
  Update name mapping in `userDisplayNames` cache to prioritize `participant.user?.displayName` over `actorName(participant.actor)`.

### Localization
- **Modify** `src/features/communication/conversations_redesign/labels.ts`:
  Add localized keys for all `UserType` values in English (`en`) and Arabic (`ar`) under `userType_<type>` keys.

### UI
- **Modify** `src/features/communication/conversations_redesign/components/ParticipantsPanel.tsx`:
  - Update `ParticipantRow` name resolution to check `participant.user?.displayName` first.
  - Display a gray `StatusPill` with the localized `userType` when `participant.user?.userType` is available.

## Verification Plan

### Automated Tests
- Create `src/features/communication/__tests__/components/ParticipantsPanel.test.tsx` to verify:
  - Participant's displayName from nested `user` is rendered.
  - Participant's userType is translated and rendered inside a `StatusPill`.
- Run all vitest tests:
  ```bash
  npm run test:run
  ```
