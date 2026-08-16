# Reinforcement Review Queue Drawer Design Spec

Replace the separate review details page with a side-panel drawer component on the review queue dashboard to keep the user inside the list context and optimize action flow.

## Goal

Integrate `ReinforcementReviewDetailsDrawer` to render details of selected submissions inside a drawer instead of navigating to a dedicated route (`/reinforcement/reviews/[submissionId]`).

## User Interface

1. **Drawer Component**:
   A side panel that slides in from the right (or left in RTL layout) when a row or "View Details" button is clicked. It includes:
   - Header with localized task title, student name, status badge, and close button.
   - Task Details card.
   - Stage Details card.
   - Student Details card.
   - Proof Details card (supporting text and file links).
   - Review History timeline showing outcome, timestamp, reviewer name, and notes.
   - Action buttons (Approve / Reject) at the bottom if the submission is pending review and the user has permissions.

2. **Page Integration**:
   - Both clicking "View Details" and clicking a row inside the queue table will set `selectedSubmissionId` and open the drawer.
   - Approving/Rejecting inside the drawer will open the existing notes dialog modal (`ReinforcementReviewActionModal`) on the page.
   - After successfully approving a submission, the page will present the XP grant modal (`Modal`), allowing users to enter XP amount or skip.

## Data Fetching & Integration

1. **State Management**:
   The page manages the active `selectedSubmissionId` and calls `getReinforcementReviewItem(selectedSubmissionId)` to populate the drawer details.
2. **Action Flows**:
   - `approveReinforcementSubmission(submissionId, payload)`: Called when the user submits the approval notes modal.
   - `rejectReinforcementSubmission(submissionId, payload)`: Called when the user submits the rejection notes modal.
   - `grantXpForReinforcementReview(submissionId, payload)`: Called when the user submits the XP grant modal.
   - Upon completion of any action, the parent queue list is refreshed (`refreshQueue`), and the drawer's `selectedReview` object is updated to show the latest status and review history.

## Verification Plan

### Automated Tests
- **Drawer Triggering**: Verify that the drawer opens when clicking the "View Details" button or when clicking a table row.
- **Drawer Details Rendering**: Verify that task and stage information, student info, and proof contents are displayed correctly.
- **Workflow Triggers**: Verify that clicking Approve in the drawer triggers the action modal and subsequent XP grant modal workflows.
