# Attendance Policies Postman Contract Alignment Design

## Goal

Align the existing attendance Policies feature with all six endpoints in `docs/Moazez-policies.postman.json` while preserving the current page and five-step policy wizard. The work covers transport contracts, server-backed name validation, user-visible asynchronous states, and focused verification.

## Scope

The target endpoints are:

- `GET /attendance/policies`
- `GET /attendance/policies/effective`
- `GET /attendance/policies/validate-name`
- `POST /attendance/policies`
- `PATCH /attendance/policies/{policyId}`
- `DELETE /attendance/policies/{policyId}`

This change does not redesign the Policies page, replace the wizard, or introduce a generated API client. Existing read-only behavior, policy list presentation, scope selection, delete confirmation, and unsaved-change protection remain in place unless a contract-driven state requires a focused adjustment.

## Architecture

`AttendancePolicy` remains the component-facing model. The policy service owns the backend boundary through explicit transport types, response mappers, query builders, and request serializers. Components do not inspect backend envelopes, compatibility aliases, or unknown JSON.

Create and patch use separate serializers. Create produces the complete supported request shape. Patch includes only fields supplied by the caller so a small update does not overwrite unrelated policy settings. Response mapping accepts only the documented compatibility aliases needed by the Postman collection and returns a normalized `AttendancePolicy`.

Malformed responses that omit required policy identity or context are treated as contract failures. The mapper must not substitute plausible values that could make invalid data appear usable. Optional fields may retain deliberate UI defaults only where the existing domain model defines them.

## Endpoint Contracts

### List Policies

`GET /attendance/policies` supports these query parameters:

- `academicYearId`
- `termId`
- `scopeType`
- `classroomId`
- `isActive`

Academic year and term remain required by the current page flow. The service accepts the remaining filters without forcing the page to add new controls. Responses are unwrapped and mapped into normalized policy models.

### Effective Policy

`GET /attendance/policies/effective` supports:

- `academicYearId`
- `termId`
- `scopeType`
- `classroomId`
- `date`

The existing effective-policy consumer continues to receive a normalized policy projection. Scope parameters are built centrally so the effective and validation calls use the same scope semantics.

### Validate Name

`GET /attendance/policies/validate-name` supports:

- `academicYearId`
- `termId`
- `scopeType`
- `classroomId`
- `nameAr`
- `nameEn`
- optional `excludeId`

The local in-memory uniqueness check is replaced by this endpoint. Edit flows send `excludeId` for the current policy. The documented response fields are `uniqueAr`, `uniqueEn`, and `available`; the service validates and returns this result without exposing the raw response to the wizard.

### Create Policy

`POST /attendance/policies` serializes the complete policy form using the backend names in the collection. Compatibility pairs in the collection, including effective-date, excuse-attachment, and guardian-notification fields, are handled deliberately at the transport boundary. UI field names remain stable.

### Update Policy

`PATCH /attendance/policies/{policyId}` uses a dedicated partial serializer. Only explicitly supplied editable fields are sent. Undefined fields are omitted, while meaningful explicit values such as `false` and `0` are preserved.

### Delete Policy

`DELETE /attendance/policies/{policyId}` retains the current confirmation flow. After success, the page reloads the active policy list. Failure leaves the list unchanged and exposes the existing error-notification path.

## Name Validation Interaction

Arabic and English policy names are validated together when either name field loses focus. Step 1 validates them again before the user can advance. Final save also revalidates them to cover stale results or scope changes.

While a validation request is active, the wizard shows an inline checking state and disables progression. A duplicate result attaches an error to the corresponding name field. A network, server, or malformed-response failure produces a form-level retryable message and blocks progression. Entered values remain intact.

Validation results are associated with the submitted academic context, scope, names, and optional excluded ID. A response for stale inputs must not overwrite the state for newer values. Changing either name, the policy scope, academic context, or edit target invalidates the previous successful result.

## Page Data Flow

1. The page loads policies for the selected academic year and term.
2. The service builds Postman-aligned queries and maps the response before returning it.
3. Opening create or edit initializes the existing five wizard steps.
4. Step 1 performs server-backed name validation on blur and before progression.
5. Saving uses the create serializer for new policies or the partial patch serializer for existing policies.
6. Successful create, update, or delete reloads the list from the backend.
7. Failed operations preserve form or page state for correction and retry.

## UI and Accessibility

The visual structure remains unchanged. New states use the existing form, button, alert, and localization patterns. Name fields retain persistent labels and associate errors with their controls. Validation status is announced without relying on color alone. Buttons expose disabled and loading states without layout movement, and focus remains in the wizard when an asynchronous error occurs.

All new user-facing text is added in English and Arabic. RTL layout follows existing wizard behavior. No new font, color system, animation pattern, or icon family is introduced.

## Error Handling

- List and effective-policy contract failures follow their current page-level error path.
- Validation failures are fail-closed: progression and save remain blocked until validation succeeds.
- Duplicate-name errors are field-specific; transport and malformed-response errors are form-level and retryable.
- Create and patch failures do not close or reset the wizard.
- Delete failures do not remove the policy locally.
- Stale asynchronous validation responses are ignored.

## Verification

Focused service tests cover:

- Exact paths and query parameters for list, effective, and validate-name requests.
- Optional filters and `excludeId` omission or inclusion.
- Create serialization of every supported Postman field.
- Patch omission of absent fields and preservation of explicit falsy values.
- Response-envelope and compatibility-alias mapping.
- Contract failures for malformed required data.
- Delete endpoint invocation.

Focused wizard tests cover:

- Validation on name-field blur.
- Revalidation before advancing and before saving.
- Edit validation with `excludeId`.
- Arabic and English duplicate errors.
- Loading and disabled progression states.
- Retry after validation transport failure.
- Preservation of entered values after validation or save failure.
- Ignoring stale validation responses.

Verification finishes with the focused test suites, TypeScript checking, and linting of changed files.
