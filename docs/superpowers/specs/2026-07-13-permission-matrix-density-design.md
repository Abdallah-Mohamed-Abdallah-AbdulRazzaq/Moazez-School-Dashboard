# Permission Matrix Density Design

## Goal

Make the settings permission editor easier to scan by replacing the wide cross-product table with compact, collapsible module cards while preserving the current permission values, bulk toggles, save flow, loading states, and access rules.

## Design

- Render one card per permission module instead of one global table.
- Keep each module collapsed by default so the page initially shows module names and selected/total counts only.
- Put bulk action toggles in the module header, using the existing `none`, `partial`, and `all` states.
- Render each resource as a compact row containing only its supported action toggles. Unsupported permission cells are omitted rather than rendered as placeholders.
- Keep the existing save button, disabled states, and permission catalog states unchanged.
- Preserve Arabic/RTL alignment, keyboard access, and accessible labels for module and permission controls.

## Validation

- Update the roles page permission tests to verify module cards render, modules are collapsed initially, and expanding a module reveals only supported actions.
- Run the focused roles permission test, then the full typecheck, lint, and test suite.

## Non-goals

- No changes to permission keys, API requests, role authorization, or persistence behavior.
