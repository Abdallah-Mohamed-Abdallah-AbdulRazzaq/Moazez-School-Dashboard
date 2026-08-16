# Nedaa History Detail Modal UI/UX Design

## Goal

Present the Nedaa history response as a clear operational record instead of a flat list of fields or raw JSON.

## Scope

Update the history-detail branch of the existing Nedaa operations modal. The response shape is the existing `DismissalRequestHistoryDetail` contract, including request status, child, gate, wait signals, escalation, timestamps, and timeline events. Request-detail, recipient, and mutation modals remain unchanged.

## Design

Use a read-only, responsive operational detail modal with one `Close` footer action.

1. Header: show the history title and a prominent status badge. Terminal `handed_over` uses the positive success treatment; other statuses use their existing status semantics.
2. Identity card: show the child name, grade, section, classroom, gate name/code, and a shortened request identifier with the full value available to assistive technology or a title attribute.
3. Operational summary: show wait duration, requested time, last updated time, and escalation state. Delayed, urgent, and escalated states must use both text and color/icon so color is not the only signal.
4. Timeline: render events in chronological order as a vertical stepper. Each event has a translated event label, translated destination status, formatted local date/time, and optional note. The final note is displayed as a visually distinct note block.
5. Empty/error states: keep the existing loading and error behavior; an empty timeline shows a translated no-events message inside the timeline section.
6. Responsive behavior: use a single column on narrow screens, avoid horizontal overflow, and keep the modal content scrollable through the shared `Modal` component.

## Interaction and accessibility

The modal is read-only. The close button and Escape behavior remain provided by the shared modal. Sections use headings, status uses text plus semantic styling, and errors use an announced alert treatment.

## Verification

Extend Nedaa operations tests to assert the response fields appear with translated event/status labels, the final note is visible, empty timelines show the empty state, and the existing action flows remain passing. Run focused tests, typecheck, and lint for changed files.
