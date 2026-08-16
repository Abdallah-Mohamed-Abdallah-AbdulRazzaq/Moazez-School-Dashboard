# Email Backend Contract and Workflow Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Settings email contract, recipient-preview gate, cancellation rule, and user-visible backend error match Moazez Backend commit `2f87a155cf27f2186cfd7746026562ef18cb4f71`.

**Architecture:** Keep backend DTOs exact at the service boundary and translate them into stable UI models with focused mappers. Credential deliveries and campaigns use canonical recipient payload builders plus deterministic fingerprints, so only the latest successful preview can authorize creation. All email pages classify backend failures through the shared Settings workflow error model and render localized structured recovery guidance.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest 2, Testing Library, next-intl, existing `@/lib/api` client.

## Global Constraints

- Preserve all pre-existing worktree changes, especially selected-user credential initialization and shared Settings workflow-error work.
- Do not modify the backend.
- Match backend commit `2f87a155cf27f2186cfd7746026562ef18cb4f71`.
- Expose SMTP as the only selectable provider.
- Do not fabricate `cancelledCount`; the backend batch summary does not expose it.
- Treat `DRAFT`, `QUEUED`, and `PROCESSING` as cancellable.
- Never show raw backend messages; show localized messages and `traceId`.
- Creation requires an exact successful recipient preview for the current canonical payload.
- Use the already-installed Vitest binary because the workspace pnpm wrapper currently aborts on ignored native build scripts.
- Stage and commit only files owned by the current task.
- Treat every `git add` list below as maximum scope. If a listed file was
  already dirty when implementation began, stage only the newly implemented
  hunks; if safe hunk separation cannot be proven, leave that file unstaged and
  report it instead of committing the user's pre-existing changes.

## Verified Backend Source Matrix

The backend default branch was rechecked before this plan revision and still
points at commit `2f87a155cf27f2186cfd7746026562ef18cb4f71`.

| Contract or behavior | Backend source of truth |
| --- | --- |
| All 21 routes and their view/manage permissions | `src/modules/settings/email/controller/email-connection.controller.ts`, `email-template.controller.ts`, and the three controllers under `delivery/controller/` |
| Connection request/response/test DTOs | `src/modules/settings/email/dto/email-connection.dto.ts` |
| SMTP-only runtime validation | `src/modules/settings/email/application/update-email-connection.use-case.ts` |
| Successful and persisted-failure test state | `src/modules/settings/email/application/test-email-connection.use-case.ts` |
| Template request/response/preview DTOs | `src/modules/settings/email/dto/email-template.dto.ts` |
| Recipient preview, campaign, batch, recipient, and pagination DTOs | `src/modules/settings/email/delivery/dto/email-delivery.dto.ts` |
| Response field mapping and sanitized failure reasons | `src/modules/settings/email/delivery/presenters/email-delivery.presenter.ts` |
| Credential preview/create selection semantics | `src/modules/settings/email/delivery/application/preview-credential-delivery-recipients.use-case.ts` and `create-credential-delivery.use-case.ts` |
| Campaign preview/create selection semantics | `src/modules/settings/email/delivery/application/preview-campaign-recipients.use-case.ts` and `create-email-campaign.use-case.ts` |
| Cancellable batch statuses | `src/modules/settings/email/delivery/application/cancel-email-delivery.use-case.ts` |
| Email error codes and structured details | `src/modules/settings/email/domain/email.exceptions.ts` and `ERROR_CATALOG.md` |
| Error envelope and validation detail placement | `src/common/exceptions/global-exception.filter.ts` |

Contract rules confirmed by this matrix:

- The route families remain connection (5), templates (5), credential
  deliveries (2), general deliveries (4), and campaigns (5). Existing frontend
  paths use the backend's exact `preview-recipients`, `preview`,
  `reset-default`, and `:batchId/cancel` segments.
- Read and preview operations retain their backend `*.view` permissions;
  mutations retain their matching `*.manage` permissions. The existing
  `emailPermissionsContract.test.ts` remains the regression gate.
- Expand `sprint11EndpointContracts.test.ts` across Tasks 1–7 until it invokes
  every one of the 21 exported email service operations and asserts the exact
  HTTP method and path. Do not leave route coverage at the current
  representative subset.
- Credential and campaign create endpoints return the complete
  `DeliveryBatchSummaryDto`, optionally including `deliveryMode: "queued"`.
- Recipient preview `limit` controls only the eligible/skipped sample size.
  It must not be copied to `maxRecipients`; omitted create limits retain the
  backend defaults of 250 credentials and 500 campaigns.
- Recipient preview responses always contain `skippedReasons` and `sample`;
  delivery/campaign list responses always contain `pagination`.
- Class-validator failures arrive as `details.fields: string[]`, while domain
  validation may use `details.field`; the current backend envelope does not
  emit a top-level `errors` map.

---

## File Structure

### New focused files

- `src/features/settings/email/shared/recipientPreview.ts` — exact shared recipient-preview DTOs and mapping helpers.
- `src/features/settings/email/shared/previewFingerprint.ts` — set normalization and deterministic fingerprint helpers.
- `src/features/settings/email/credential-deliveries/utils/credentialDeliveryPayloads.ts` — canonical credential preview/create payloads.
- `src/features/settings/email/campaigns/utils/campaignPayloads.ts` — canonical campaign audience, preview, content-preview, and create payloads.
- `src/features/settings/email/shared/__tests__/recipientPreview.test.ts` — backend preview mapping tests.
- `src/features/settings/email/shared/__tests__/previewFingerprint.test.ts` — normalization and fingerprint tests.
- `src/features/settings/email/connection/services/__tests__/emailConnectionService.test.ts` — connection DTO mapping tests.
- `src/features/settings/email/deliveries/services/__tests__/emailDeliveriesService.test.ts` — batch, recipient, and cancellation contract tests.
- `src/features/settings/email/templates/services/__tests__/emailTemplatesService.test.ts` — template response completeness tests.
- `src/features/settings/email/credential-deliveries/services/__tests__/credentialDeliveryService.test.ts` — credential preview and create-response mapping tests.
- `src/features/settings/email/credential-deliveries/utils/__tests__/credentialDeliveryPayloads.test.ts` — credential canonical payload tests.
- `src/features/settings/email/campaigns/utils/__tests__/campaignPayloads.test.ts` — campaign canonical payload tests.
- Page tests under each email feature for async state and error behavior.

### Existing files with one responsibility retained

- Feature `types.ts` files remain the public UI contract for their feature.
- Feature service files remain responsible for HTTP calls and DTO-to-UI mapping.
- Pages retain orchestration and async state.
- Wizards/composers retain local input state and client validation.
- `settingsWorkflowErrors.ts` remains the centralized classifier.
- `SettingsWorkflowErrorAlert.tsx` remains the centralized localized presenter.

---

### Task 1: Exact Connection and Template Contracts

**Files:**
- Modify: `src/features/settings/email/connection/types.ts`
- Modify: `src/features/settings/email/connection/services/emailConnectionService.ts`
- Create: `src/features/settings/email/connection/services/__tests__/emailConnectionService.test.ts`
- Modify: `src/features/settings/email/templates/types.ts`
- Modify: `src/features/settings/email/templates/services/emailTemplatesService.ts`
- Create: `src/features/settings/email/templates/services/__tests__/emailTemplatesService.test.ts`
- Modify: `src/features/settings/__tests__/sprint11EndpointContracts.test.ts`

**Interfaces:**
- Produces: exact `UpdateEmailConnectionRequest`, `EmailConnectionResponseDto`, `EmailConnection`, and `mapEmailConnection(dto)`.
- Produces: `TestEmailConnectionResponseDto` extending the full connection DTO.
- Produces: exact `UpdateEmailTemplateRequest` and `PreviewEmailTemplateRequest`.
- Produces: exact `EmailTemplateResponseDto`,
  `EmailTemplateListResponseDto`, `EmailTemplatePreviewResponseDto`, and
  `mapEmailTemplate(dto)`.
- Consumes: existing `apiGet`, `apiPost`, and `apiPut`.

- [ ] **Step 1: Write failing connection mapper tests**

```ts
it("maps an unconfigured backend connection without inventing values", () => {
  expect(
    mapEmailConnection({
      configured: false,
      providerType: null,
      fromName: null,
      fromEmail: null,
      replyToEmail: null,
      host: null,
      port: null,
      secure: null,
      username: null,
      hasPassword: false,
      hasApiKey: false,
      status: null,
      lastTestedAt: null,
      verifiedAt: null,
      failureReason: null,
      createdAt: null,
      updatedAt: null,
    }),
  ).toMatchObject({
    configured: false,
    providerType: null,
    status: null,
    lastTestedAt: null,
  });
});

it("maps the full successful test response", async () => {
  apiMocks.apiPost.mockResolvedValue({
    configured: true,
    providerType: "SMTP",
    fromName: "School",
    fromEmail: "school@example.com",
    replyToEmail: null,
    host: "smtp.example.com",
    port: 587,
    secure: false,
    username: "mailer",
    hasPassword: true,
    hasApiKey: false,
    status: "VERIFIED",
    lastTestedAt: "2026-07-30T10:00:00.000Z",
    verifiedAt: "2026-07-30T10:00:00.000Z",
    failureReason: null,
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-30T10:00:00.000Z",
    testRecipient: "admin@example.com",
    deliveryMode: "configuration_validation",
    message: "SMTP configuration was validated.",
  });

  await expect(
    testEmailConnection({ toEmail: "admin@example.com" }),
  ).resolves.toMatchObject({
    status: "VERIFIED",
    lastTestedAt: "2026-07-30T10:00:00.000Z",
    testRecipient: "admin@example.com",
  });
});
```

- [ ] **Step 2: Run the connection tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/connection/services/__tests__/emailConnectionService.test.ts
```

Expected: FAIL because the exact nullable DTO and `lastTestedAt` mapping do not exist.

- [ ] **Step 3: Implement exact connection DTOs and mapper**

```ts
export interface EmailConnectionResponseDto {
  configured: boolean;
  providerType: EmailConnectionProviderType | null;
  fromName: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  hasPassword: boolean;
  hasApiKey: boolean;
  status: EmailConnectionStatus | null;
  lastTestedAt: string | null;
  verifiedAt: string | null;
  failureReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TestEmailConnectionResponseDto
  extends EmailConnectionResponseDto {
  testRecipient: string;
  deliveryMode: "configuration_validation";
  message: string;
}

export interface TestEmailConnectionResponse extends EmailConnection {
  testRecipient: string;
  deliveryMode: "configuration_validation";
  message: string;
}

export interface UpdateEmailConnectionRequest {
  providerType?: EmailConnectionProviderType;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string | null;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  apiKey?: string;
}

export function mapEmailConnection(
  dto: EmailConnectionResponseDto,
): EmailConnection {
  return { ...dto };
}

export function mapTestEmailConnection(
  dto: TestEmailConnectionResponseDto,
): TestEmailConnectionResponse {
  return {
    ...mapEmailConnection(dto),
    testRecipient: dto.testRecipient,
    deliveryMode: dto.deliveryMode,
    message: dto.message,
  };
}
```

Make `EmailConnection` match the safe mapped shape and remove `id`, `lastTestAt`, and `lastTestStatus`. Have fetch, update, test, activate, and disable map their full backend responses.

- [ ] **Step 4: Write failing template completeness tests**

```ts
it("keeps backend template metadata and preview preheader", async () => {
  apiMocks.apiGet.mockResolvedValue({
    id: null,
    key: "ACCOUNT_CREDENTIALS",
    customized: false,
    subject: "Account ready",
    preheader: "Sign in",
    title: null,
    subtitle: null,
    bodyHtml: "<p>Hello</p>",
    bodyText: null,
    footerHtml: null,
    supportEmail: null,
    supportPhone: null,
    socialLinks: null,
    isActive: true,
    allowedVariables: [],
    createdAt: null,
    updatedAt: null,
  });

  await expect(fetchEmailTemplate("ACCOUNT_CREDENTIALS")).resolves.toMatchObject({
    id: null,
    customized: false,
    createdAt: null,
  });

  apiMocks.apiPost.mockResolvedValue({
    key: "ACCOUNT_CREDENTIALS",
    subject: "Account ready",
    preheader: "Sign in",
    html: "<p>Hello</p>",
    text: "Hello",
    missingVariables: [],
    unknownVariables: [],
  });

  await expect(
    previewEmailTemplate("ACCOUNT_CREDENTIALS", {}),
  ).resolves.toMatchObject({
    key: "ACCOUNT_CREDENTIALS",
    preheader: "Sign in",
  });
});
```

- [ ] **Step 5: Run template tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/templates/services/__tests__/emailTemplatesService.test.ts
```

Expected: FAIL because omitted metadata is absent from the declared frontend contracts.

- [ ] **Step 6: Add exact template response fields**

```ts
export interface EmailTemplateResponseDto {
  id: string | null;
  key: EmailTemplateKey;
  customized: boolean;
  subject: string;
  preheader: string | null;
  title: string | null;
  subtitle: string | null;
  bodyHtml: string;
  bodyText: string | null;
  footerHtml: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  socialLinks: EmailTemplateSocialLinks | null;
  isActive: boolean;
  allowedVariables: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EmailTemplateListResponseDto {
  items: EmailTemplateResponseDto[];
}

export interface EmailTemplatePreviewResponseDto {
  key: EmailTemplateKey;
  subject: string;
  preheader: string | null;
  html: string;
  text: string | null;
  unknownVariables: string[];
  missingVariables: string[];
}

export type EmailTemplate = EmailTemplateResponseDto;
export type PreviewEmailTemplateResponse =
  EmailTemplatePreviewResponseDto;

export function mapEmailTemplate(
  dto: EmailTemplateResponseDto,
): EmailTemplate {
  return {
    ...dto,
    socialLinks: dto.socialLinks ? { ...dto.socialLinks } : null,
    allowedVariables: [...dto.allowedVariables],
  };
}

export interface EmailTemplateSocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
}

export interface UpdateEmailTemplateRequest {
  subject?: string;
  preheader?: string | null;
  title?: string | null;
  subtitle?: string | null;
  bodyHtml?: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  socialLinks?: EmailTemplateSocialLinks | null;
  isActive?: boolean;
}

export interface PreviewEmailTemplateRequest
  extends UpdateEmailTemplateRequest {
  previewData?: Record<string, unknown>;
}
```

Keep the editor's required-field validation in its form model; do not make the
backend boundary request artificially required. Add request-shape tests that
prove a partial connection update and a partial template update are accepted by
the service types without serializing absent fields as `null`.

Map list/get/update/reset responses through `mapEmailTemplate`; map the preview
response through an explicit pass-through helper that clones
`missingVariables` and `unknownVariables`. This keeps all HTTP responses behind
tested service boundaries even when the UI names match the backend.

- [ ] **Step 7: Correct the legacy endpoint contract assertion**

Replace the existing SendGrid request fixture with SMTP:

```ts
await updateEmailConnection({
  providerType: "SMTP",
  fromName: "School",
  fromEmail: "school@example.com",
  host: "smtp.example.com",
  port: 587,
  secure: false,
  username: "mailer",
});

expect(apiMocks.apiPut).toHaveBeenCalledWith(
  "/settings/email/connection",
  expect.objectContaining({ providerType: "SMTP" }),
);
```

- [ ] **Step 8: Run focused tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/connection/services/__tests__/emailConnectionService.test.ts src/features/settings/email/templates/services/__tests__/emailTemplatesService.test.ts src/features/settings/__tests__/sprint11EndpointContracts.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```powershell
git add -- src/features/settings/email/connection/types.ts src/features/settings/email/connection/services/emailConnectionService.ts src/features/settings/email/connection/services/__tests__/emailConnectionService.test.ts src/features/settings/email/templates/types.ts src/features/settings/email/templates/services/emailTemplatesService.ts src/features/settings/email/templates/services/__tests__/emailTemplatesService.test.ts src/features/settings/__tests__/sprint11EndpointContracts.test.ts
git commit -m "fix: align email connection and template contracts"
```

---

### Task 2: Delivery and Campaign Batch Mapping

**Files:**
- Modify: `src/features/settings/email/deliveries/types.ts`
- Modify: `src/features/settings/email/deliveries/services/emailDeliveriesService.ts`
- Create: `src/features/settings/email/deliveries/services/__tests__/emailDeliveriesService.test.ts`
- Modify: `src/features/settings/email/deliveries/components/DeliveryBatchTable.tsx`
- Modify: `src/features/settings/email/deliveries/components/DeliveryRecipientTable.tsx`
- Create: `src/features/settings/email/deliveries/components/__tests__/DeliveryRecipientTable.test.tsx`
- Modify: `src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx`
- Modify: `src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx`
- Modify: `src/features/settings/email/campaigns/types.ts`
- Modify: `src/features/settings/email/campaigns/services/emailCampaignsService.ts`
- Create: `src/features/settings/email/campaigns/services/__tests__/emailCampaignsService.test.ts`
- Modify: `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- Modify: `src/features/settings/email/credential-deliveries/types.ts`
- Modify: `src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts`
- Create: `src/features/settings/email/credential-deliveries/services/__tests__/credentialDeliveryService.test.ts`
- Modify: `src/features/settings/email/credential-deliveries/components/CredentialDeliveryConfirmStep.tsx`
- Modify: `src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Produces: exact `EmailDeliveryBatchDto`, `EmailDeliveryRecipientDto`, and required pagination envelopes.
- Produces: `mapDeliveryBatch(dto): EmailDeliveryBatch`.
- Produces: `mapDeliveryRecipient(dto): EmailDeliveryRecipient`.
- Produces: `cancelEmailDeliveryBatch(batchId): Promise<EmailDeliveryBatch>`.
- Produces: mapped delivery-batch results for credential create, campaign create, campaign list, and campaign detail.
- Removes: unsupported UI property `cancelledCount`.

- [ ] **Step 1: Write failing delivery mapper tests**

```ts
function batchDto(
  overrides: Partial<EmailDeliveryBatchDto> = {},
): EmailDeliveryBatchDto {
  return {
    batchId: "batch-1",
    status: "QUEUED",
    kind: "GENERAL_CAMPAIGN",
    templateKey: "GENERAL_MESSAGE",
    subjectSnapshot: "Subject",
    totalRecipients: 3,
    queuedCount: 3,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: "2026-07-30T09:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
    ...overrides,
  };
}

it.each(["DRAFT", "QUEUED", "PROCESSING"] as const)(
  "marks %s batches cancellable",
  (status) => {
    expect(mapDeliveryBatch(batchDto({ status }))).toMatchObject({
      cancellable: true,
    });
  },
);

it("does not fabricate a cancelled recipient count", () => {
  const batch = mapDeliveryBatch(
    batchDto({ status: "CANCELLED", cancelledAt: "2026-07-30T10:00:00.000Z" }),
  );

  expect(batch).not.toHaveProperty("cancelledCount");
  expect(batch.cancelledAt).toBe("2026-07-30T10:00:00.000Z");
});

it("maps the full cancellation response", async () => {
  apiMocks.apiPost.mockResolvedValue(batchDto({
    status: "CANCELLED",
    cancelledAt: "2026-07-30T10:00:00.000Z",
  }));

  await expect(cancelEmailDeliveryBatch("batch-1")).resolves.toMatchObject({
    batchId: "batch-1",
    status: "CANCELLED",
    cancellable: false,
  });
});

it("maps every delivery-recipient field without fabricating skippedAt", () => {
  const recipient = mapDeliveryRecipient({
    id: "recipient-1",
    userId: null,
    toEmail: "guardian@example.com",
    displayName: "Guardian",
    status: "SKIPPED",
    attempts: 0,
    lastAttemptAt: null,
    sentAt: null,
    failureReason: null,
    skippedReason: "duplicate_email",
    createdAt: "2026-07-30T09:00:00.000Z",
    updatedAt: "2026-07-30T09:01:00.000Z",
  });

  expect(recipient).toMatchObject({
    recipientEmail: "guardian@example.com",
    attempts: 0,
    skippedReason: "duplicate_email",
  });
  expect(recipient).not.toHaveProperty("skippedAt");
});

it("requires pagination on delivery list and recipient envelopes", async () => {
  apiMocks.apiGet
    .mockResolvedValueOnce({
      items: [batchDto()],
      pagination: { page: 1, limit: 20, total: 1 },
    })
    .mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, limit: 50, total: 0 },
    });

  await expect(fetchEmailDeliveries()).resolves.toMatchObject({
    pagination: { page: 1, limit: 20, total: 1 },
  });
  await expect(
    fetchEmailDeliveryRecipients("batch-1"),
  ).resolves.toMatchObject({
    pagination: { page: 1, limit: 50, total: 0 },
  });
});
```

- [ ] **Step 2: Run delivery tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/deliveries/services/__tests__/emailDeliveriesService.test.ts
```

Expected: FAIL because `PROCESSING` is not cancellable and cancellation expects the wrong response.

- [ ] **Step 3: Correct delivery types and mapper**

```ts
export interface EmailDeliveryBatchDto {
  batchId: string;
  status: EmailDeliveryStatus;
  kind: EmailDeliveryKind;
  templateKey: EmailTemplateKey | null;
  subjectSnapshot: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryMode?: "queued";
}

export interface EmailDeliveryRecipientDto {
  id: string;
  userId: string | null;
  toEmail: string;
  displayName: string | null;
  status: EmailRecipientStatus;
  attempts: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  skippedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDeliveriesListResponseDto {
  items: EmailDeliveryBatchDto[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveryRecipientsResponseDto {
  items: EmailDeliveryRecipientDto[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveriesListResponse {
  items: EmailDeliveryBatch[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveryRecipientsResponse {
  items: EmailDeliveryRecipient[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveryBatch {
  batchId: string;
  kind: EmailDeliveryKind;
  status: EmailDeliveryStatus;
  templateKey: EmailTemplateKey | null;
  subject: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryMode?: "queued";
  cancellable: boolean;
}

export interface EmailDeliveryRecipient {
  id: string;
  userId: string | null;
  recipientEmail: string;
  fullName: string | null;
  status: EmailRecipientStatus;
  attempts: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  skippedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const CANCELLABLE_BATCH_STATUSES = new Set<EmailDeliveryStatus>([
  "DRAFT",
  "QUEUED",
  "PROCESSING",
]);

export function mapDeliveryBatch(dto: EmailDeliveryBatchDto): EmailDeliveryBatch {
  return {
    batchId: dto.batchId,
    kind: dto.kind,
    status: dto.status,
    templateKey: dto.templateKey,
    subject: dto.subjectSnapshot,
    totalRecipients: dto.totalRecipients,
    queuedCount: dto.queuedCount,
    sentCount: dto.sentCount,
    failedCount: dto.failedCount,
    skippedCount: dto.skippedCount,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
    cancelledAt: dto.cancelledAt,
    failureReason: dto.failureReason,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deliveryMode: dto.deliveryMode,
    cancellable: CANCELLABLE_BATCH_STATUSES.has(dto.status),
  };
}

export function mapDeliveryRecipient(
  dto: EmailDeliveryRecipientDto,
): EmailDeliveryRecipient {
  return {
    id: dto.id,
    userId: dto.userId,
    recipientEmail: dto.toEmail,
    fullName: dto.displayName,
    status: dto.status,
    attempts: dto.attempts,
    lastAttemptAt: dto.lastAttemptAt,
    sentAt: dto.sentAt,
    failureReason: dto.failureReason,
    skippedReason: dto.skippedReason,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
```

Map list/detail/cancellation and both create responses through these functions.
Remove every `cancelledCount` and fabricated `skippedAt` label, column, metric,
and type. Keep `failureReason` and `skippedReason` separate; the backend already
sanitizes both before presentation.

Update the detail summary to show the real `startedAt`, `completedAt`,
`cancelledAt`, `failureReason`, and `updatedAt` values when present. Update the
recipient table to show `attempts`, `lastAttemptAt`, `sentAt`, `failureReason`,
`skippedReason`, and `updatedAt`; do not infer timestamps that the backend does
not return.

Add corresponding English/Arabic keys under
`settings.email.deliveries.recipients`:

```json
// en.json
"attempts": "Attempts",
"last_attempt_at": "Last attempt",
"skipped_reason": "Skipped reason",
"updated_at": "Updated at"

// ar.json
"attempts": "المحاولات",
"last_attempt_at": "آخر محاولة",
"skipped_reason": "سبب التخطي",
"updated_at": "وقت التحديث"
```

Add summary labels:

```json
// en.json
"started_at": "Started at",
"completed_at": "Completed at",
"cancelled_at": "Cancelled at"

// ar.json
"started_at": "وقت البدء",
"completed_at": "وقت الاكتمال",
"cancelled_at": "وقت الإلغاء"
```

The comments above are plan annotations and must not be copied into JSON.

Add a focused table test that renders `attempts`, `lastAttemptAt`,
`skippedReason`, and `updatedAt`, and asserts the removed `skippedAt` label is
absent.

- [ ] **Step 4: Write failing campaign mapping tests**

```ts
function campaignBatchDto(
  overrides: Partial<EmailDeliveryBatchDto> = {},
): EmailDeliveryBatchDto {
  return {
    batchId: "batch-1",
    status: "QUEUED",
    kind: "GENERAL_CAMPAIGN",
    templateKey: "GENERAL_MESSAGE",
    subjectSnapshot: "Subject",
    totalRecipients: 1,
    queuedCount: 1,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: "2026-07-30T09:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
    ...overrides,
  };
}

it("maps campaign list subjects from subjectSnapshot", async () => {
  apiMocks.apiGet.mockResolvedValue({
    items: [
      campaignBatchDto({
        kind: "GENERAL_CAMPAIGN",
        subjectSnapshot: "Trip",
      }),
    ],
    pagination: { page: 1, limit: 20, total: 1 },
  });

  await expect(fetchEmailCampaigns()).resolves.toMatchObject({
    items: [{ kind: "GENERAL_CAMPAIGN", subject: "Trip" }],
  });
});

it("maps campaign detail through the shared batch mapper", async () => {
  apiMocks.apiGet.mockResolvedValue(
    campaignBatchDto({ kind: "GENERAL_CAMPAIGN", status: "PROCESSING" }),
  );

  await expect(fetchEmailCampaign("batch-1")).resolves.toMatchObject({
    kind: "GENERAL_CAMPAIGN",
    cancellable: true,
  });
});

it("maps the complete campaign create response", async () => {
  apiMocks.apiPost.mockResolvedValue(
    campaignBatchDto({ deliveryMode: "queued" }),
  );

  await expect(
    createEmailCampaign({
      recipientScope: { scope: "all_school_users" },
      templateKey: "GENERAL_MESSAGE",
      subject: "Subject",
      bodyHtml: "<p>Hello</p>",
    }),
  ).resolves.toMatchObject({
    kind: "GENERAL_CAMPAIGN",
    subject: "Subject",
    deliveryMode: "queued",
    cancellable: true,
  });
});
```

In `credentialDeliveryService.test.ts`:

```ts
function credentialBatchDto(): EmailDeliveryBatchDto {
  return {
    batchId: "batch-1",
    status: "QUEUED",
    kind: "CREDENTIAL_DELIVERY",
    templateKey: "ACCOUNT_CREDENTIALS",
    subjectSnapshot: "Account credential delivery",
    totalRecipients: 1,
    queuedCount: 1,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: "2026-07-30T09:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
    deliveryMode: "queued",
  };
}

it("maps the complete credential create response", async () => {
  apiMocks.apiPost.mockResolvedValue(credentialBatchDto());

  await expect(
    createCredentialDelivery({
      scope: "selected",
      userIds: ["00000000-0000-4000-8000-000000000001"],
      credentialMode: "LOGIN_INFO_ONLY",
    }),
  ).resolves.toMatchObject({
    kind: "CREDENTIAL_DELIVERY",
    templateKey: "ACCOUNT_CREDENTIALS",
    deliveryMode: "queued",
    cancellable: true,
  });
});
```

- [ ] **Step 5: Run campaign service tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/campaigns/services/__tests__/emailCampaignsService.test.ts
```

Expected: FAIL because raw campaign DTOs are currently returned.

- [ ] **Step 6: Reuse the delivery mapper for campaign reads**

```ts
export async function fetchEmailCampaigns(
  params: FetchEmailCampaignsParams = {},
): Promise<EmailCampaignsListResponse> {
  const response = await apiGet<EmailDeliveriesListResponseDto>(
    `/settings/email/campaigns${toCampaignsQuery(params)}`,
  );
  return {
    items: response.items.map((dto) => {
      const batch = mapDeliveryBatch(dto);
      return { ...batch, kind: "GENERAL_CAMPAIGN" };
    }),
    pagination: response.pagination,
  };
}

export async function fetchEmailCampaign(
  batchId: string,
): Promise<EmailCampaignBatch> {
  const dto = await apiGet<EmailDeliveryBatchDto>(
    `/settings/email/campaigns/${batchId}`,
  );
  return { ...mapDeliveryBatch(dto), kind: "GENERAL_CAMPAIGN" };
}

export async function createEmailCampaign(
  payload: CreateEmailCampaignRequest,
): Promise<EmailCampaignBatch> {
  const dto = await apiPost<EmailDeliveryBatchDto>(
    "/settings/email/campaigns",
    payload,
  );
  return { ...mapDeliveryBatch(dto), kind: "GENERAL_CAMPAIGN" };
}

export async function createCredentialDelivery(
  payload: CreateCredentialDeliveryRequest,
): Promise<EmailDeliveryBatch> {
  const dto = await apiPost<EmailDeliveryBatchDto>(
    "/settings/email/credential-deliveries",
    payload,
  );
  return mapDeliveryBatch(dto);
}
```

Make `EmailCampaignsListResponse.pagination` required as well. In delivery and
campaign pages, consume `pagination.page`, `pagination.limit`, and
`pagination.total` directly instead of falling back to item counts.

Remove the partial `CreateEmailCampaignResponse`,
`CreateCredentialDeliveryResponse`, and `CancelEmailDeliveryResponse` shapes.
Use `EmailCampaignBatch` or `EmailDeliveryBatch` consistently in page and
component props. Remove the UI-only `title` alias from delivery batches and use
the mapped `subject` consistently.

- [ ] **Step 7: Run delivery and campaign tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/deliveries/services/__tests__/emailDeliveriesService.test.ts src/features/settings/email/deliveries/components/__tests__/DeliveryRecipientTable.test.tsx src/features/settings/email/campaigns/services/__tests__/emailCampaignsService.test.ts src/features/settings/email/credential-deliveries/services/__tests__/credentialDeliveryService.test.ts src/features/settings/__tests__/sprint11EndpointContracts.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```powershell
git add -- src/features/settings/email/deliveries/types.ts src/features/settings/email/deliveries/services/emailDeliveriesService.ts src/features/settings/email/deliveries/services/__tests__/emailDeliveriesService.test.ts src/features/settings/email/deliveries/components/DeliveryBatchTable.tsx src/features/settings/email/deliveries/components/DeliveryRecipientTable.tsx src/features/settings/email/deliveries/components/__tests__/DeliveryRecipientTable.test.tsx src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx src/features/settings/email/campaigns/types.ts src/features/settings/email/campaigns/services/emailCampaignsService.ts src/features/settings/email/campaigns/services/__tests__/emailCampaignsService.test.ts src/features/settings/email/campaigns/components/CampaignComposer.tsx src/features/settings/email/credential-deliveries/types.ts src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts src/features/settings/email/credential-deliveries/services/__tests__/credentialDeliveryService.test.ts src/features/settings/email/credential-deliveries/components/CredentialDeliveryConfirmStep.tsx src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx src/features/settings/__tests__/sprint11EndpointContracts.test.ts src/messages/en.json src/messages/ar.json
git commit -m "fix: map email delivery and campaign batches"
```

---

### Task 3: Shared Recipient Preview Contract

**Files:**
- Create: `src/features/settings/email/shared/recipientPreview.ts`
- Create: `src/features/settings/email/shared/__tests__/recipientPreview.test.ts`
- Modify: `src/features/settings/email/credential-deliveries/types.ts`
- Modify: `src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts`
- Modify: `src/features/settings/email/credential-deliveries/components/CredentialDeliveryPreviewStep.tsx`
- Modify: `src/features/settings/email/campaigns/types.ts`
- Modify: `src/features/settings/email/campaigns/services/emailCampaignsService.ts`
- Modify: `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- Modify: `src/features/settings/__tests__/sprint11EndpointContracts.test.ts`

**Interfaces:**
- Produces: `EmailRecipientPreviewItemDto`.
- Produces: `EmailRecipientPreviewResponseDto`.
- Produces: `EmailRecipientPreview` UI model.
- Produces: `mapRecipientPreview(dto): MappedEmailRecipientPreview`.

- [ ] **Step 1: Write failing shared mapping tests**

```ts
function previewDto(
  overrides: Partial<EmailRecipientPreviewItemDto> = {},
): EmailRecipientPreviewItemDto {
  return {
    userId: "user-1",
    fullName: "Nour Ali",
    username: "nour",
    loginEmail: "nour@school.example",
    contactEmail: "nour@example.com",
    toEmail: "nour@example.com",
    userType: "teacher",
    roleKey: "teacher",
    hasPassword: true,
    mustChangePassword: false,
    credentialVersion: 2,
    reason: null,
    ...overrides,
  };
}

it("maps backend recipient fields and derives eligibility from sample groups", () => {
  const mapped = mapRecipientPreview({
    totalMatched: 2,
    eligible: 1,
    skipped: 1,
    skippedReasons: { missing_contact_email: 1 },
    sample: {
      eligible: [
        previewDto({ userId: "user-1", toEmail: "one@example.com", reason: null }),
      ],
      skipped: [
        previewDto({
          userId: "user-2",
          toEmail: null,
          reason: "missing_contact_email",
        }),
      ],
    },
  });

  expect(mapped.recipients).toEqual([
    expect.objectContaining({
      userId: "user-1",
      recipientEmail: "one@example.com",
      eligible: true,
      skipReason: null,
    }),
    expect.objectContaining({
      userId: "user-2",
      eligible: false,
      skipReason: "missing_contact_email",
    }),
  ]);
});
```

- [ ] **Step 2: Run the shared preview test and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/shared/__tests__/recipientPreview.test.ts
```

Expected: FAIL because the shared DTO and mapper do not exist.

- [ ] **Step 3: Implement exact DTOs and mapper**

```ts
export type EmailUserType =
  | "platform_user"
  | "organization_user"
  | "school_user"
  | "teacher"
  | "parent"
  | "student"
  | "applicant"
  | "pickup_delegate"
  | "service_account";

export interface EmailRecipientPreviewItemDto {
  userId: string | null;
  fullName: string | null;
  username: string | null;
  loginEmail: string | null;
  contactEmail: string | null;
  toEmail: string | null;
  userType: EmailUserType | null;
  roleKey: string | null;
  hasPassword: boolean | null;
  mustChangePassword: boolean | null;
  credentialVersion: number | null;
  reason: string | null;
}

export interface EmailRecipientPreviewResponseDto {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  sample: {
    eligible: EmailRecipientPreviewItemDto[];
    skipped: EmailRecipientPreviewItemDto[];
  };
}

export interface EmailRecipientPreview {
  userId: string | null;
  fullName: string | null;
  username: string | null;
  loginEmail: string | null;
  contactEmail: string | null;
  recipientEmail: string | null;
  userType: EmailUserType | null;
  roleKey: string | null;
  hasPassword: boolean | null;
  mustChangePassword: boolean | null;
  credentialVersion: number | null;
  eligible: boolean;
  skipReason: string | null;
}

function mapPreviewItem(
  dto: EmailRecipientPreviewItemDto,
  eligible: boolean,
): EmailRecipientPreview {
  const { toEmail, reason, ...recipient } = dto;

  return {
    ...recipient,
    recipientEmail: toEmail,
    eligible,
    skipReason: reason,
  };
}
```

Do not retain duplicate feature-specific backend DTOs, nullable/optional sample
fallbacks, or fabricated preview pagination. The backend always returns both
sample arrays and `skippedReasons`, including empty values. Make
`totalMatched`, `eligibleCount`, `skippedCount`, and `skippedReasons` required
in both feature UI response types.

- [ ] **Step 4: Adapt credential and campaign services/components**

```ts
const mapped = mapRecipientPreview(response);

return {
  totalMatched: mapped.totalMatched,
  eligibleCount: mapped.eligibleCount,
  skippedCount: mapped.skippedCount,
  skippedReasons: mapped.skippedReasons,
  eligibleSample: mapped.recipients.filter((recipient) => recipient.eligible),
  skippedSample: mapped.recipients.filter((recipient) => !recipient.eligible),
};
```

Update both components to read `recipientEmail` and `skipReason`. Remove `email`, `toEmail`, `reason`, and synthetic `eligible` declarations from feature-specific types.

- [ ] **Step 5: Run shared and existing recipient tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/shared/__tests__/recipientPreview.test.ts src/features/settings/__tests__/sprint11EndpointContracts.test.ts src/features/settings/email/credential-deliveries/components/__tests__/CredentialDeliveryAudienceStep.test.tsx src/features/settings/email/campaigns/components/__tests__/CampaignComposer.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```powershell
git add -- src/features/settings/email/shared/recipientPreview.ts src/features/settings/email/shared/__tests__/recipientPreview.test.ts src/features/settings/email/credential-deliveries/types.ts src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts src/features/settings/email/credential-deliveries/components/CredentialDeliveryPreviewStep.tsx src/features/settings/email/campaigns/types.ts src/features/settings/email/campaigns/services/emailCampaignsService.ts src/features/settings/email/campaigns/components/CampaignComposer.tsx src/features/settings/__tests__/sprint11EndpointContracts.test.ts
git commit -m "fix: normalize email recipient previews"
```

---

### Task 4: Complete Backend Error Classification and Presentation

**Files:**
- Modify: `src/features/settings/shared/utils/settingsWorkflowErrors.ts`
- Modify: `src/features/settings/shared/utils/__tests__/settingsWorkflowErrors.test.ts`
- Modify: `src/features/settings/shared/components/SettingsWorkflowErrorAlert.tsx`
- Modify: `src/features/settings/shared/components/__tests__/SettingsWorkflowErrorAlert.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/features/settings/email/connection/pages/EmailConnectionPage.tsx`
- Modify: `src/features/settings/email/templates/pages/EmailTemplatesPage.tsx`
- Modify: `src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx`
- Modify: `src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx`
- Modify: `src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx`
- Modify: `src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx`
- Modify: `src/features/settings/email/campaigns/pages/EmailCampaignDetailPage.tsx`

**Interfaces:**
- Produces: expanded `SettingsWorkflowErrorKind`.
- Produces: `SettingsWorkflowError` with safe `code`, `traceId`, `invalidFields`, `reasonCode`, `recipientCount`, `recipientLimit`, `batchStatus`, and `variables`.
- Produces: `classifySettingsWorkflowError(error)`.
- Consumes: `ApiError.code`, `ApiError.details`, `ApiError.traceId`, and `ApiError.status`.

- [ ] **Step 1: Write exhaustive failing classifier tests**

```ts
it.each([
  ["settings.email.connection_missing", "email-connection"],
  ["settings.email.connection_not_verified", "email-connection-unverified"],
  ["settings.email.connection_test_failed", "email-connection-test"],
  ["settings.email.secret_encryption_failed", "retryable"],
  ["settings.email.template_invalid", "email-content-invalid"],
  ["settings.email.delivery_connection_inactive", "email-connection"],
  ["settings.email.delivery_template_missing", "email-template"],
  ["settings.email.delivery_no_recipients", "no-recipients"],
  ["settings.email.delivery_recipient_invalid", "recipient-invalid"],
  ["settings.email.delivery_batch_not_found", "delivery-not-found"],
  ["settings.email.delivery_batch_not_cancelable", "delivery-not-cancelable"],
  ["settings.email.delivery_too_many_recipients", "recipient-limit"],
  ["settings.email.delivery_send_failed", "retryable"],
  ["settings.email.campaign_invalid", "campaign-invalid"],
  [
    "settings.email.campaign_credential_variables_forbidden",
    "credential-variables",
  ],
] as const)("maps backend email code %s to %s", (code, kind) => {
  expect(
    classifySettingsWorkflowError(new ApiError("raw", 422, code)),
  ).toMatchObject({ kind, code });
});

it.each([
  "auth.token.expired",
  "auth.token.invalid",
  "auth.session.revoked",
  "auth.account.disabled",
  "auth.scope.missing",
] as const)("maps %s without exposing its message", (code) => {
  expect(
    classifySettingsWorkflowError(new ApiError("raw", 401, code)),
  ).toMatchObject({ kind: "permission", code });
});

it.each([
  ["rate_limit.exceeded", 429],
  ["internal_error", 500],
  ["service_unavailable", 503],
] as const)("maps %s to retryable", (code, status) => {
  expect(
    classifySettingsWorkflowError(new ApiError("raw", status, code)),
  ).toMatchObject({ kind: "retryable", code });
});

it("extracts validation field keys from details without exposing raw text", () => {
  const result = classifySettingsWorkflowError(
    new ApiError(
      "raw validation message",
      400,
      "validation.failed",
      undefined,
      { fields: ["subject must be shorter than or equal to 200 characters"] },
      "trace-validation",
    ),
  );

  expect(result).toMatchObject({
    kind: "validation",
    code: "validation.failed",
    invalidFields: ["subject"],
    traceId: "trace-validation",
  });
  expect(result).not.toHaveProperty("message");
});

it("extracts a singular domain-validation field", () => {
  const result = classifySettingsWorkflowError(
    new ApiError(
      "raw",
      400,
      "validation.failed",
      undefined,
      { field: "dryRun" },
    ),
  );

  expect(result).toMatchObject({
    kind: "validation",
    invalidFields: ["dryRun"],
  });
});

it.each([
  [new ApiError("raw", 404, "not_found"), "not-found"],
  [new ApiError("raw", 404, "unmapped"), "not-found"],
  [new ApiError("raw", 409, "unmapped"), "conflict"],
  [new ApiError("raw", 422, "unmapped"), "validation"],
  [new ApiError("raw", 403, "unmapped"), "permission"],
  [new ApiError("raw", 429, "unmapped"), "retryable"],
  [new ApiError("raw", 500, "unmapped"), "retryable"],
  [new ApiError("raw", 0, "REQUEST_SETUP_ERROR"), "retryable"],
  [ApiError.network(), "retryable"],
  [new Error("raw non-api failure"), "generic"],
] as const)("uses the safe fallback %s", (error, kind) => {
  const result = classifySettingsWorkflowError(error);
  expect(result).toMatchObject({ kind });
  expect(result).not.toHaveProperty("message");
});
```

Add detail tests:

```ts
expect(
  classifySettingsWorkflowError(
    new ApiError(
      "raw",
      409,
      "settings.email.delivery_batch_not_cancelable",
      undefined,
      { status: "SUCCEEDED" },
      "trace-1",
    ),
  ),
).toMatchObject({
  kind: "delivery-not-cancelable",
  batchStatus: "SUCCEEDED",
  traceId: "trace-1",
});
```

- [ ] **Step 2: Run classifier tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/shared/utils/__tests__/settingsWorkflowErrors.test.ts
```

Expected: FAIL for the newly explicit error categories and details.

- [ ] **Step 3: Implement safe detail extraction and exhaustive mapping**

```ts
type SettingsEmailBatchStatus =
  | "DRAFT"
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED";

export interface SettingsWorkflowError {
  kind: SettingsWorkflowErrorKind;
  code?: string;
  traceId?: string;
  invalidFields?: string[];
  reasonCode?: string;
  recipientCount?: number;
  recipientLimit?: number;
  batchStatus?: SettingsEmailBatchStatus;
  variables?: string[];
}

function detailRecord(details: unknown): Record<string, unknown> | undefined {
  return details && typeof details === "object" && !Array.isArray(details)
    ? (details as Record<string, unknown>)
    : undefined;
}

function numericDetail(details: unknown, key: string): number | undefined {
  const value = detailRecord(details)?.[key];
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

function stringArrayDetail(
  details: unknown,
  key: string,
): string[] | undefined {
  const value = detailRecord(details)?.[key];
  if (!Array.isArray(value)) return undefined;
  const safeValues = value
    .filter(
      (entry): entry is string =>
        typeof entry === "string" &&
        /^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(entry),
    )
    .slice(0, 20);
  return safeValues.length > 0 ? safeValues : undefined;
}

function identifierDetail(
  details: unknown,
  key: string,
): string | undefined {
  const value = detailRecord(details)?.[key];
  return typeof value === "string" &&
    /^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(value)
    ? value
    : undefined;
}

function validationFieldNames(details: unknown): string[] | undefined {
  const record = detailRecord(details);
  const candidates = [
    ...(typeof record?.field === "string" ? [record.field] : []),
    ...(Array.isArray(record?.fields) ? record.fields : []),
  ];
  const names = candidates.flatMap((candidate) => {
    if (typeof candidate !== "string") return [];
    const match = candidate.match(/^[A-Za-z][A-Za-z0-9_.]{0,99}/);
    return match ? [match[0]] : [];
  });
  return names.length > 0 ? Array.from(new Set(names)) : undefined;
}

const EMAIL_ERROR_KIND_BY_CODE: Record<string, SettingsWorkflowErrorKind> = {
  "settings.email.connection_missing": "email-connection",
  "settings.email.connection_not_verified": "email-connection-unverified",
  "settings.email.connection_test_failed": "email-connection-test",
  "settings.email.secret_encryption_failed": "retryable",
  "settings.email.template_invalid": "email-content-invalid",
  "settings.email.delivery_connection_inactive": "email-connection",
  "settings.email.delivery_template_missing": "email-template",
  "settings.email.delivery_no_recipients": "no-recipients",
  "settings.email.delivery_recipient_invalid": "recipient-invalid",
  "settings.email.delivery_batch_not_found": "delivery-not-found",
  "settings.email.delivery_batch_not_cancelable": "delivery-not-cancelable",
  "settings.email.delivery_too_many_recipients": "recipient-limit",
  "settings.email.delivery_send_failed": "retryable",
  "settings.email.campaign_invalid": "campaign-invalid",
  "settings.email.campaign_credential_variables_forbidden":
    "credential-variables",
};

const PERMISSION_CODES = new Set([
  "auth.token.expired",
  "auth.token.invalid",
  "auth.session.revoked",
  "auth.account.disabled",
  "auth.scope.missing",
]);

const RETRYABLE_CODES = new Set([
  "rate_limit.exceeded",
  "internal_error",
  "service_unavailable",
]);
```

Use these code maps before status fallbacks. For
`settings.email.delivery_too_many_recipients`, copy numeric `count` and `limit`;
for `settings.email.delivery_batch_not_cancelable`, copy `status` only when it
is one of the seven `SettingsEmailBatchStatus` values; for
template errors extract bounded `invalidFields` from `fields` and copy validated
variable names from `unknownVariables`; for forbidden campaign variables copy
validated names from `variables`; and for connection-test/send failures copy
only a bounded identifier-like `reasonCode`. Never copy `error.message` into the
normalized model.

Map `validation.failed` and unmapped HTTP 400/422 responses to `validation`,
extracting only bounded field names from `details.field` and `details.fields`
with `validationFieldNames`. Never retain or render the raw validation strings.
Map `not_found` and unmapped HTTP
404 responses to `not-found`; unmapped HTTP 409 to `conflict`; auth codes and
HTTP 401/403 to `permission`; throttling, status 0, network/setup failures, and
HTTP 5xx to `retryable`; and everything else to `generic`. Add `validation`,
`not-found`, and `conflict` to `SettingsWorkflowErrorKind`.

- [ ] **Step 4: Write failing alert presentation tests**

```tsx
it("renders localized recovery guidance and bounded details", () => {
  render(
    <SettingsWorkflowErrorAlert
      error={{
        kind: "delivery-not-cancelable",
        code: "settings.email.delivery_batch_not_cancelable",
        batchStatus: "SUCCEEDED",
        traceId: "trace-1",
      }}
    />,
  );

  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByText(/delivery-not-cancelable.message/)).toBeVisible();
  expect(screen.getByText("SUCCEEDED")).toBeVisible();
  expect(screen.getByText("trace-1")).toBeVisible();
  expect(screen.queryByText("raw")).not.toBeInTheDocument();
});
```

- [ ] **Step 5: Add English and Arabic translation entries**

Add these English entries under `settings.workflow_errors`:

```json
"email-connection-unverified": {
  "title": "Verify the email connection first",
  "message": "Test the saved SMTP configuration successfully before activating it.",
  "action": "Open email connection"
},
"email-connection-test": {
  "title": "Email connection test failed",
  "message": "Review the SMTP settings and saved password, then test the connection again.",
  "action": "Review email connection"
},
"email-content-invalid": {
  "title": "Email content is invalid",
  "message": "Correct the highlighted fields and unsupported template variables, then retry.",
  "action": "Open email templates"
},
"recipient-invalid": {
  "title": "A recipient is invalid",
  "message": "Review recipient email addresses and preview the audience again."
},
"delivery-not-found": {
  "title": "Email delivery was not found",
  "message": "The delivery may have been removed or is outside the current school scope."
},
"delivery-not-cancelable": {
  "title": "This delivery can no longer be cancelled",
  "message": "Refresh the delivery to see its current status before taking another action."
},
"campaign-invalid": {
  "title": "Campaign content is invalid",
  "message": "Review the campaign subject, body, footer, and template variables, then retry."
},
"credential-variables": {
  "title": "Credential variables are not allowed",
  "message": "Remove credential or temporary-password variables from this general campaign."
},
"validation": {
  "title": "Review the submitted fields",
  "message": "Correct the highlighted values and submit the form again."
},
"not-found": {
  "title": "The requested email resource was not found",
  "message": "Refresh this page and confirm that the item still exists in the current school."
},
"conflict": {
  "title": "The email state changed",
  "message": "Refresh the current data, review its latest status, and try the action again."
}
```

Add these Arabic entries:

```json
"email-connection-unverified": {
  "title": "تحقق من اتصال البريد أولاً",
  "message": "اختبر إعدادات SMTP المحفوظة بنجاح قبل تفعيلها.",
  "action": "فتح اتصال البريد"
},
"email-connection-test": {
  "title": "فشل اختبار اتصال البريد",
  "message": "راجع إعدادات SMTP وكلمة المرور المحفوظة، ثم أعد اختبار الاتصال.",
  "action": "مراجعة اتصال البريد"
},
"email-content-invalid": {
  "title": "محتوى البريد غير صالح",
  "message": "صحح الحقول المحددة ومتغيرات القالب غير المدعومة، ثم أعد المحاولة.",
  "action": "فتح قوالب البريد"
},
"recipient-invalid": {
  "title": "أحد المستلمين غير صالح",
  "message": "راجع عناوين بريد المستلمين ثم أعد معاينة الجمهور."
},
"delivery-not-found": {
  "title": "عملية إرسال البريد غير موجودة",
  "message": "ربما حُذفت عملية الإرسال أو أنها خارج نطاق المدرسة الحالية."
},
"delivery-not-cancelable": {
  "title": "لم يعد من الممكن إلغاء عملية الإرسال",
  "message": "حدّث عملية الإرسال لمعرفة حالتها الحالية قبل اتخاذ إجراء آخر."
},
"campaign-invalid": {
  "title": "محتوى الحملة غير صالح",
  "message": "راجع موضوع الحملة ومحتواها وتذييلها ومتغيرات القالب، ثم أعد المحاولة."
},
"credential-variables": {
  "title": "متغيرات بيانات الدخول غير مسموحة",
  "message": "احذف متغيرات بيانات الدخول أو كلمة المرور المؤقتة من الحملة العامة."
},
"validation": {
  "title": "راجع الحقول المرسلة",
  "message": "صحح القيم المحددة ثم أرسل النموذج مرة أخرى."
},
"not-found": {
  "title": "تعذر العثور على عنصر البريد المطلوب",
  "message": "حدّث الصفحة وتأكد من أن العنصر ما زال موجودًا في المدرسة الحالية."
},
"conflict": {
  "title": "تغيرت حالة البريد",
  "message": "حدّث البيانات الحالية وراجع أحدث حالة ثم حاول تنفيذ الإجراء مرة أخرى."
}
```

Add localized detail labels:

```json
// English
"batch_status": "Current batch status",
"invalid_variables": "Invalid variables"

// Arabic
"batch_status": "حالة دفعة الإرسال الحالية",
"invalid_variables": "المتغيرات غير الصالحة"
```

Place the English pair only in `en.json` and the Arabic pair only in `ar.json`;
the comments above are plan annotations and must not be copied into JSON.
Do not include raw backend message placeholders.

- [ ] **Step 6: Implement bounded alert details and recovery actions**

Extend `actionHrefByKind` so `email-connection-unverified` and
`email-connection-test` open the connection page, while `email-content-invalid`
and `email-template` open the templates page. Render only validated bounded
details:

```tsx
{error.batchStatus ? (
  <p className="mt-2 text-sm">
    {t("batch_status")}: <strong>{error.batchStatus}</strong>
  </p>
) : null}
{error.variables?.length ? (
  <p className="mt-2 text-sm">
    {t("invalid_variables")}: {error.variables.join(", ")}
  </p>
) : null}
{error.traceId ? (
  <p className="mt-3 break-all text-xs opacity-75">
    {t("trace_id")}: <code>{error.traceId}</code>
  </p>
) : null}
```

Keep recipient count/limit interpolation. Do not render `error.message` or raw
backend validation strings.

- [ ] **Step 7: Replace raw email page errors with structured errors**

Each page follows this pattern:

```tsx
const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);

try {
  // existing operation
} catch (error) {
  setPageError(classifySettingsWorkflowError(error));
}

{pageError ? (
  <div className="mb-4">
    <SettingsWorkflowErrorAlert error={pageError} />
  </div>
) : null}
```

Keep success toasts. Remove `showError(error.message)` and string page errors
from email pages. On connection and template forms, compare normalized
`invalidFields` with recognized form field names; leave unrecognized fields to
the structured generic validation alert.

For each recognized form field, use the presence of a backend field-error key to
set the existing localized generic invalid-field message. Never display the
backend field-error string itself.

- [ ] **Step 8: Run classifier, alert, message, and page tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/shared/utils/__tests__/settingsWorkflowErrors.test.ts src/features/settings/shared/components/__tests__/SettingsWorkflowErrorAlert.test.tsx src/features/settings/email
```

Expected: PASS with no raw backend message assertion.

- [ ] **Step 9: Commit Task 4**

```powershell
git add -- src/features/settings/shared/utils/settingsWorkflowErrors.ts src/features/settings/shared/utils/__tests__/settingsWorkflowErrors.test.ts src/features/settings/shared/components/SettingsWorkflowErrorAlert.tsx src/features/settings/shared/components/__tests__/SettingsWorkflowErrorAlert.test.tsx src/features/settings/email/connection/pages/EmailConnectionPage.tsx src/features/settings/email/templates/pages/EmailTemplatesPage.tsx src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx src/features/settings/email/campaigns/pages/EmailCampaignDetailPage.tsx src/messages/en.json src/messages/ar.json
git commit -m "fix: handle email backend errors safely"
```

Before committing, inspect `git diff --cached --name-only` and unstage unrelated pre-existing email files if they were not intentionally changed by this task.

---

### Task 5: Connection Workflow and SMTP-Only UI

**Files:**
- Modify: `src/features/settings/email/connection/components/EmailConnectionForm.tsx`
- Modify: `src/features/settings/email/connection/components/EmailConnectionStatusCard.tsx`
- Modify: `src/features/settings/email/connection/components/__tests__/EmailConnectionForm.test.tsx`
- Modify: `src/features/settings/email/connection/pages/EmailConnectionPage.tsx`
- Create: `src/features/settings/email/connection/pages/__tests__/EmailConnectionPage.test.tsx`

**Interfaces:**
- Consumes: exact connection mapper from Task 1.
- Consumes: structured errors from Task 4.
- Produces: successful test replacement and failed test refresh behavior.

- [ ] **Step 1: Write failing SMTP-only form test**

```tsx
function renderConnectionForm() {
  render(
    <EmailConnectionForm
      values={{
        providerType: "SMTP",
        fromName: "",
        fromEmail: "",
        replyToEmail: "",
        host: "",
        port: "",
        secure: false,
        username: "",
        password: "",
        apiKey: "",
        testRecipientEmail: "",
      }}
      canManage
      hasPassword={false}
      hasApiKey={false}
      onChange={vi.fn()}
      labels={labels}
    />,
  );
}

it("offers only the SMTP provider", () => {
  renderConnectionForm();
  fireEvent.click(screen.getByRole("button", { name: "Provider" }));

  expect(screen.getByRole("button", { name: "SMTP" })).toBeVisible();
  expect(screen.queryByText("SendGrid")).not.toBeInTheDocument();
  expect(screen.queryByText("Mailgun")).not.toBeInTheDocument();
  expect(screen.queryByText("SES")).not.toBeInTheDocument();
  expect(screen.queryByText("Custom")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Write failing connection page workflow tests**

```tsx
function connection(
  status: EmailConnectionStatus | null,
  overrides: Partial<EmailConnection> = {},
): EmailConnection {
  return {
    configured: true,
    providerType: "SMTP",
    fromName: "School",
    fromEmail: "school@example.com",
    replyToEmail: null,
    host: "smtp.example.com",
    port: 587,
    secure: false,
    username: "mailer",
    hasPassword: true,
    hasApiKey: false,
    status,
    lastTestedAt: null,
    verifiedAt: null,
    failureReason: null,
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
    ...overrides,
  };
}

function draftConnection(): EmailConnection {
  return connection("DRAFT");
}

function verifiedConnectionTestResponse(): TestEmailConnectionResponse {
  return {
    ...connection("VERIFIED", {
      lastTestedAt: "2026-07-30T10:00:00.000Z",
      verifiedAt: "2026-07-30T10:00:00.000Z",
    }),
    testRecipient: "admin@example.com",
    deliveryMode: "configuration_validation",
    message: "SMTP configuration was validated.",
  };
}

function failedConnection(
  overrides: Partial<EmailConnection> = {},
): EmailConnection {
  return connection("FAILED", {
    lastTestedAt: "2026-07-30T10:00:00.000Z",
    ...overrides,
  });
}

it("replaces connection state with the successful test response", async () => {
  serviceMocks.fetchEmailConnection.mockResolvedValue(draftConnection());
  serviceMocks.testEmailConnection.mockResolvedValue(
    verifiedConnectionTestResponse(),
  );

  render(<EmailConnectionPage />);
  await userEvent.click(await screen.findByRole("button", { name: "Test" }));

  expect(await screen.findByText("VERIFIED")).toBeVisible();
  expect(screen.getByText(/2026/)).toBeVisible();
});

it("refreshes backend-recorded FAILED state after a rejected test", async () => {
  serviceMocks.fetchEmailConnection
    .mockResolvedValueOnce(draftConnection())
    .mockResolvedValueOnce(
      failedConnection({ failureReason: "smtp_password_missing" }),
    );
  serviceMocks.testEmailConnection.mockRejectedValue(
    new ApiError(
      "raw",
      422,
      "settings.email.connection_test_failed",
      undefined,
      { reason: "smtp_password_missing" },
    ),
  );

  render(<EmailConnectionPage />);
  await userEvent.click(await screen.findByRole("button", { name: "Test" }));

  expect(serviceMocks.fetchEmailConnection).toHaveBeenCalledTimes(2);
  expect(await screen.findByText("FAILED")).toBeVisible();
  expect(screen.getByRole("alert")).toBeVisible();
});

it("gates connection actions to backend-valid states", async () => {
  serviceMocks.fetchEmailConnection.mockResolvedValue(draftConnection());

  render(<EmailConnectionPage />);

  expect(
    await screen.findByRole("button", { name: "Test" }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "Activate" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Disable" })).toBeEnabled();
});

it("allows activation only for a verified connection", async () => {
  serviceMocks.fetchEmailConnection.mockResolvedValue(
    connection("VERIFIED"),
  );

  render(<EmailConnectionPage />);

  expect(
    await screen.findByRole("button", { name: "Activate" }),
  ).toBeEnabled();
});

it("disables test and lifecycle actions before a connection exists", async () => {
  serviceMocks.fetchEmailConnection.mockResolvedValue(
    connection(null, {
      configured: false,
      providerType: null,
      status: null,
    }),
  );

  render(<EmailConnectionPage />);

  expect(
    await screen.findByRole("button", { name: "Test" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Activate" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Disable" })).toBeDisabled();
});
```

- [ ] **Step 3: Run connection UI tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/connection/components/__tests__/EmailConnectionForm.test.tsx src/features/settings/email/connection/pages/__tests__/EmailConnectionPage.test.tsx
```

Expected: FAIL for unsupported provider options, stale test state, and
backend-invalid action availability.

- [ ] **Step 4: Implement SMTP-only and authoritative state replacement**

```tsx
options={[{ value: "SMTP", label: labels.smtp }]}
```

On success:

```ts
const testedConnection = await testEmailConnection({
  toEmail: values.testRecipientEmail.trim(),
});
setConnection(testedConnection);
```

On failure:

```ts
} catch (error) {
  setPageError(classifySettingsWorkflowError(error));
  try {
    setConnection(await fetchEmailConnection());
  } catch (refreshError) {
    setRefreshError(classifySettingsWorkflowError(refreshError));
  }
}
```

Render `refreshError`, when present, in a second `SettingsWorkflowErrorAlert`.
Do not replace the original actionable test error with a generic refresh failure.

Derive action availability from the backend state machine. Testing requires an
existing configuration, activation requires `VERIFIED`, and disabling requires
an existing connection that is not already `DISABLED`. Prevent overlapping
mutations:

```ts
const mutationPending =
  isSaving || isTesting || isActivating || isDisabling;
const configured = connection?.configured === true;
const canTest = configured && !mutationPending;
const canActivate =
  configured && connection?.status === "VERIFIED" && !mutationPending;
const canDisable =
  configured && connection?.status !== "DISABLED" && !mutationPending;
```

Apply these booleans through each button's `disabled` prop. The backend rejects
activation outside `VERIFIED` with
`settings.email.connection_not_verified`, and test/disable require a persisted
connection. Keep the buttons visible for authorized users so their disabled
state explains the workflow.

- [ ] **Step 5: Make the status card null-safe**

Render status only when `connection.configured` and `connection.status` are present. Use `lastTestedAt`, not `lastTestAt`.

```tsx
const configured = connection?.configured === true;
const status = configured ? connection.status : null;
```

- [ ] **Step 6: Run connection tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/connection
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```powershell
git add -- src/features/settings/email/connection/components/EmailConnectionForm.tsx src/features/settings/email/connection/components/EmailConnectionStatusCard.tsx src/features/settings/email/connection/components/__tests__/EmailConnectionForm.test.tsx src/features/settings/email/connection/pages/EmailConnectionPage.tsx src/features/settings/email/connection/pages/__tests__/EmailConnectionPage.test.tsx
git commit -m "fix: synchronize email connection workflow"
```

---

### Task 6: Credential Delivery Canonical Preview Gate

**Files:**
- Create: `src/features/settings/email/shared/previewFingerprint.ts`
- Create: `src/features/settings/email/shared/__tests__/previewFingerprint.test.ts`
- Create: `src/features/settings/email/credential-deliveries/utils/credentialDeliveryPayloads.ts`
- Create: `src/features/settings/email/credential-deliveries/utils/__tests__/credentialDeliveryPayloads.test.ts`
- Modify: `src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx`
- Create: `src/features/settings/email/credential-deliveries/components/__tests__/CredentialDeliveryWizard.test.tsx`
- Modify: `src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx`
- Create: `src/features/settings/email/credential-deliveries/pages/__tests__/CredentialDeliveriesPage.test.tsx`

**Interfaces:**
- Produces: `normalizeStringSet(values)`.
- Produces: `fingerprintCanonicalPayload(payload)`.
- Produces: `buildCredentialRecipientSelection(values)`.
- Produces: `buildCredentialPreviewPayload(values)`.
- Produces: `buildCredentialCreatePayload(values)`.
- Produces: `credentialPreviewFingerprint(values)`.
- Consumes: the existing dirty `initialUserId` and structured error changes without replacing them.

- [ ] **Step 1: Write failing normalization tests**

```ts
it("sorts, trims, removes blanks, and deduplicates set-like values", () => {
  expect(normalizeStringSet([" user-2 ", "user-1", "", "user-2"])).toEqual([
    "user-1",
    "user-2",
  ]);
});

it("produces equal fingerprints for equivalent canonical payloads", () => {
  expect(
    fingerprintCanonicalPayload({ scope: "selected", userIds: ["a", "b"] }),
  ).toBe(
    fingerprintCanonicalPayload({ scope: "selected", userIds: ["a", "b"] }),
  );
});
```

- [ ] **Step 2: Write failing credential payload tests**

```ts
function wizardValues(
  overrides: Partial<CredentialDeliveryWizardValues> = {},
): CredentialDeliveryWizardValues {
  return {
    audienceMode: "missing-password",
    audience: { missingPasswordOnly: true },
    selectedUserIdsText: "",
    requireContactEmail: true,
    allowLoginEmailFallback: false,
    templateKey: "ACCOUNT_CREDENTIALS",
    credentialMode: "LOGIN_INFO_ONLY",
    ...overrides,
  };
}

it("includes existing-password users when regenerating", () => {
  expect(
    buildCredentialPreviewPayload(
      wizardValues({ credentialMode: "REGENERATE_TEMPORARY_PASSWORD" }),
    ),
  ).toMatchObject({
    scope: "missing_password",
    includeUsersWithPassword: true,
  });
});

it("changes the local fingerprint when credential mode changes", () => {
  expect(
    credentialPreviewFingerprint(
      wizardValues({ credentialMode: "LOGIN_INFO_ONLY" }),
    ),
  ).not.toBe(
    credentialPreviewFingerprint(
      wizardValues({ credentialMode: "GENERATE_TEMPORARY_PASSWORD" }),
    ),
  );
});

it("uses the same regeneration selection for preview and create", () => {
  const values = wizardValues({
    credentialMode: "REGENERATE_TEMPORARY_PASSWORD",
  });
  const preview = buildCredentialPreviewPayload(values);
  const created = buildCredentialCreatePayload(values);

  expect(created).toMatchObject({
    scope: preview.scope,
    userIds: preview.userIds,
    roleKeys: preview.roleKeys,
    userTypes: preview.userTypes,
    includeUsersWithPassword: true,
    includeDisabledUsers: preview.includeDisabledUsers,
    requireContactEmail: preview.requireContactEmail,
    allowLoginEmailFallback: preview.allowLoginEmailFallback,
  });
  expect(created).not.toHaveProperty("limit");
  expect(created).not.toHaveProperty("maxRecipients");
});
```

- [ ] **Step 3: Run utility tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/shared/__tests__/previewFingerprint.test.ts src/features/settings/email/credential-deliveries/utils/__tests__/credentialDeliveryPayloads.test.ts
```

Expected: FAIL because canonical builders do not exist.

- [ ] **Step 4: Implement canonical helpers**

```ts
export function normalizeStringSet(values: string[] | undefined): string[] {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
}

export function fingerprintCanonicalPayload(payload: unknown): string {
  return JSON.stringify(payload);
}
```

Build the credential payload with a fixed key order:

```ts
const SCOPE_BY_AUDIENCE_MODE: Record<
  CredentialDeliveryWizardValues["audienceMode"],
  EmailRecipientScope
> = {
  "selected-users": "selected",
  role: "role",
  "user-type": "user_type",
  "missing-password": "missing_password",
  "must-change-password": "must_change_password",
  "all-school": "all_school_users",
};

function normalizedOrUndefined(
  values: string[] | undefined,
): string[] | undefined {
  const normalized = normalizeStringSet(values);
  return normalized.length > 0 ? normalized : undefined;
}

export function buildCredentialRecipientSelection(
  values: CredentialDeliveryWizardValues,
): Omit<CredentialDeliveryPreviewRequest, "limit"> {
  return {
    scope: SCOPE_BY_AUDIENCE_MODE[values.audienceMode],
    userIds: normalizedOrUndefined(values.audience.userIds),
    roleKeys: normalizedOrUndefined(
      values.audience.roleKey ? [values.audience.roleKey] : undefined,
    ),
    userTypes: normalizedOrUndefined(
      values.audience.userType ? [values.audience.userType] : undefined,
    ),
    includeUsersWithPassword:
      values.credentialMode === "REGENERATE_TEMPORARY_PASSWORD",
    includeDisabledUsers: false,
    requireContactEmail: values.requireContactEmail,
    allowLoginEmailFallback: values.allowLoginEmailFallback,
  };
}

export function buildCredentialPreviewPayload(
  values: CredentialDeliveryWizardValues,
): CredentialDeliveryPreviewRequest {
  return {
    ...buildCredentialRecipientSelection(values),
    limit: 100,
  };
}

export function buildCredentialCreatePayload(
  values: CredentialDeliveryWizardValues,
): CreateCredentialDeliveryRequest {
  return {
    ...buildCredentialRecipientSelection(values),
    templateKey: values.templateKey,
    credentialMode: values.credentialMode,
  };
}

export function credentialPreviewFingerprint(
  values: CredentialDeliveryWizardValues,
): string {
  return fingerprintCanonicalPayload({
    ...buildCredentialPreviewPayload(values),
    credentialMode: values.credentialMode,
  });
}
```

- [ ] **Step 5: Write failing wizard/page integrity tests**

```tsx
const credentialValues: CredentialDeliveryWizardValues = {
  audienceMode: "missing-password",
  audience: { missingPasswordOnly: true },
  selectedUserIdsText: "",
  requireContactEmail: true,
  allowLoginEmailFallback: false,
  templateKey: "ACCOUNT_CREDENTIALS",
  credentialMode: "LOGIN_INFO_ONLY",
};

function eligiblePreview(): CredentialDeliveryPreviewResponse {
  return {
    totalMatched: 1,
    eligibleCount: 1,
    skippedCount: 0,
    skippedReasons: {},
    eligibleSample: [],
    skippedSample: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

vi.mock(
  "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard",
  () => ({
    default: (props: {
      preview: CredentialDeliveryPreviewResponse | null;
      onPreview: (
        values: CredentialDeliveryWizardValues,
      ) => Promise<CredentialDeliveryPreviewResponse | null>;
      onCreate: (
        values: CredentialDeliveryWizardValues,
      ) => Promise<EmailDeliveryBatch | null>;
      onPreviewInvalidated: () => void;
    }) => (
      <div>
        <span>{props.preview ? "preview-present" : "preview-empty"}</span>
        <button type="button" onClick={() => void props.onPreview(credentialValues)}>
          preview
        </button>
        <button type="button" onClick={props.onPreviewInvalidated}>
          invalidate
        </button>
        <button
          type="button"
          onClick={() =>
            void props.onCreate({
              ...credentialValues,
              credentialMode: "GENERATE_TEMPORARY_PASSWORD",
            })
          }
        >
          create-changed
        </button>
      </div>
    ),
  }),
);

it("ignores a late preview response after values change", async () => {
  const previewRequest = deferred<CredentialDeliveryPreviewResponse>();
  serviceMocks.previewCredentialDeliveryRecipients.mockReturnValue(
    previewRequest.promise,
  );
  render(<CredentialDeliveriesPage />);

  await userEvent.click(screen.getByRole("button", { name: "preview" }));
  await userEvent.click(screen.getByRole("button", { name: "invalidate" }));
  previewRequest.resolve(eligiblePreview());

  expect(await screen.findByText("preview-empty")).toBeVisible();
  expect(screen.queryByText("preview-present")).not.toBeInTheDocument();
});

it("clears a prior successful preview before a failed re-preview", async () => {
  serviceMocks.previewCredentialDeliveryRecipients
    .mockResolvedValueOnce(eligiblePreview())
    .mockRejectedValueOnce(new ApiError("raw", 503, "service_unavailable"));
  render(<CredentialDeliveriesPage />);

  await userEvent.click(screen.getByRole("button", { name: "preview" }));
  expect(await screen.findByText("preview-present")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "preview" }));

  expect(await screen.findByText("preview-empty")).toBeVisible();
});

it("blocks create when current values do not match the preview", async () => {
  serviceMocks.previewCredentialDeliveryRecipients.mockResolvedValue(
    eligiblePreview(),
  );
  render(<CredentialDeliveriesPage />);

  await userEvent.click(screen.getByRole("button", { name: "preview" }));
  expect(await screen.findByText("preview-present")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "create-changed" }));

  expect(serviceMocks.createCredentialDelivery).not.toHaveBeenCalled();
});
```

In `CredentialDeliveryWizard.test.tsx`, cover the real component:

```tsx
it("invalidates preview when credential mode changes", async () => {
  const onPreviewInvalidated = vi.fn();
  render(
    <CredentialDeliveryWizard
      canManage
      roles={[]}
      preview={eligiblePreview()}
      previewFingerprint="current"
      createdBatch={null}
      isPreviewing={false}
      isCreating={false}
      onPreview={vi.fn()}
      onCreate={vi.fn()}
      onPreviewInvalidated={onPreviewInvalidated}
    />,
  );

  await openModeStep();
  await userEvent.click(
    screen.getByRole("button", { name: /REGENERATE_TEMPORARY_PASSWORD/ }),
  );

  expect(onPreviewInvalidated).toHaveBeenCalledTimes(1);
});
```

Define `openModeStep` in that test using the real wizard's translated Next
button:

```ts
async function openModeStep() {
  await userEvent.click(screen.getByRole("button", { name: /actions\.next/ }));
}
```

- [ ] **Step 6: Implement preview token and fingerprint state**

In the page:

```ts
const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(null);
const activePreviewFingerprint = useRef<string | null>(null);

const invalidatePreview = () => {
  activePreviewFingerprint.current = null;
  setPreview(null);
  setPreviewFingerprint(null);
  setCreatedBatch(null);
};

const handlePreview = async (values: CredentialDeliveryWizardValues) => {
  const fingerprint = credentialPreviewFingerprint(values);
  activePreviewFingerprint.current = fingerprint;
  setPreview(null);
  setPreviewFingerprint(null);
  const response = await previewCredentialDeliveryRecipients(
    buildCredentialPreviewPayload(values),
  );
  if (activePreviewFingerprint.current !== fingerprint) return null;
  setPreview(response);
  setPreviewFingerprint(fingerprint);
  return response;
};
```

Before create, compare `credentialPreviewFingerprint(values)` with state and
send `buildCredentialCreatePayload(values)`. Pass `previewFingerprint` and
`onPreviewInvalidated` to the wizard. Call invalidation from wizard value updates
that affect audience, contact email, template, credential mode, or login-email
fallback. Do not clear a still-matching preview when create fails, so the
operator can retry.

In the wizard, derive the create guard from all required conditions:

```ts
const hasCurrentEligiblePreview =
  preview !== null &&
  preview.eligibleCount > 0 &&
  previewFingerprint === credentialPreviewFingerprint(values);

const createDisabled =
  !canManage || !hasCurrentEligiblePreview || isCreating || Boolean(createdBatch);
```

Use `createDisabled` on the create button. Existing loading flags continue to
disable repeated preview/create submissions.

- [ ] **Step 7: Preserve the existing selected-user workflow**

Keep:

```ts
key={selectedUserId ?? "default"}
initialUserId={selectedUserId}
```

and `initialValuesForUser(initialUserId)`. Add a regression test asserting a `userId` query initializes `selected-users` mode and still requires preview before creation.

- [ ] **Step 8: Run credential workflow tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/shared/__tests__/previewFingerprint.test.ts src/features/settings/email/credential-deliveries
```

Expected: PASS.

- [ ] **Step 9: Commit Task 6**

Because these files already contain user changes, inspect the complete diff and stage only the combined intended result:

```powershell
git diff -- src/features/settings/email/credential-deliveries
git add -- src/features/settings/email/shared/previewFingerprint.ts src/features/settings/email/shared/__tests__/previewFingerprint.test.ts src/features/settings/email/credential-deliveries/utils/credentialDeliveryPayloads.ts src/features/settings/email/credential-deliveries/utils/__tests__/credentialDeliveryPayloads.test.ts src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx src/features/settings/email/credential-deliveries/components/__tests__/CredentialDeliveryWizard.test.tsx src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx src/features/settings/email/credential-deliveries/pages/__tests__/CredentialDeliveriesPage.test.tsx
git diff --cached --check
git commit -m "fix: require current credential recipient preview"
```

---

### Task 7: Campaign Canonical Preview Gate

**Files:**
- Create: `src/features/settings/email/campaigns/utils/campaignPayloads.ts`
- Create: `src/features/settings/email/campaigns/utils/__tests__/campaignPayloads.test.ts`
- Modify: `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- Modify: `src/features/settings/email/campaigns/components/CampaignAudienceStep.tsx`
- Modify: `src/features/settings/email/campaigns/components/__tests__/CampaignComposer.test.tsx`
- Modify: `src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx`
- Create: `src/features/settings/email/campaigns/pages/__tests__/EmailCampaignsPage.test.tsx`
- Modify: `src/features/settings/__tests__/sprint11EndpointContracts.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Produces: exact campaign content-preview request/response DTOs, including `footerHtml` and response `key`.
- Produces: `mapEmailCampaignPreview(dto)`.
- Produces: `buildCampaignRecipientPreviewPayload(values)`.
- Produces: `campaignRecipientPreviewFingerprint(values)`.
- Produces: `buildPreviewCampaignPayload(values)`.
- Produces: `buildCreateCampaignPayload(values)`.
- Consumes: `normalizeStringSet` and `fingerprintCanonicalPayload` from Task 6.

- [ ] **Step 1: Lock the exact campaign content contracts**

In `campaigns/types.ts`, separate backend DTO optionality from the stricter
composer form:

```ts
export interface EmailCampaignPreviewRequest {
  templateKey?: EmailTemplateKey;
  subject?: string;
  title?: string;
  bodyHtml: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  previewData?: Record<string, unknown>;
}

export interface EmailCampaignPreviewResponseDto {
  key: EmailTemplateKey;
  subject: string;
  html: string;
  text: string | null;
  missingVariables: string[];
  unknownVariables: string[];
}

export type EmailCampaignPreviewResponse =
  EmailCampaignPreviewResponseDto;

export function mapEmailCampaignPreview(
  dto: EmailCampaignPreviewResponseDto,
): EmailCampaignPreviewResponse {
  return {
    ...dto,
    missingVariables: [...dto.missingVariables],
    unknownVariables: [...dto.unknownVariables],
  };
}

export interface CreateEmailCampaignRequest
  extends EmailCampaignPreviewRequest {
  recipientScope: EmailRecipientScopeRequest;
  customEmails?: string[];
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  maxRecipients?: number;
}
```

Keep `CampaignComposerValues.subject` and `bodyHtml` required by client
validation, add `footerHtml: string`, and keep `templateKey` fixed to
`"GENERAL_MESSAGE"` in the UI even though the backend DTO enum is broader. The
backend rejects other campaign template keys at runtime.

Have `previewEmailCampaign` map its response through
`mapEmailCampaignPreview` instead of returning the transport object directly.

- [ ] **Step 2: Write failing campaign payload tests**

```ts
function composerValues(
  overrides: Partial<CampaignComposerValues> = {},
): CampaignComposerValues {
  return {
    audienceMode: "all-school",
    audience: { allSchool: true },
    selectedUserIdsText: "",
    customEmailsText: "",
    templateKey: "GENERAL_MESSAGE",
    subject: "Subject",
    title: "",
    bodyHtml: "<p>Hello</p>",
    bodyText: "Hello",
    footerHtml: "",
    ...overrides,
  };
}

it("normalizes set-like audience fields and custom emails", () => {
  expect(
    buildCampaignRecipientPreviewPayload(
      composerValues({
        audienceMode: "selected-users",
        audience: {
          userIds: ["user-2", "user-1", "user-2"],
          customEmails: [" B@example.com ", "a@example.com"],
        },
      }),
    ),
  ).toEqual({
    recipientScope: {
      scope: "selected",
      userIds: ["user-1", "user-2"],
    },
    customEmails: ["a@example.com", "b@example.com"],
    includeDisabledUsers: false,
    requireContactEmail: true,
    allowLoginEmailFallback: false,
    limit: 100,
  });
});

it("changes fingerprint when any recipient-sensitive field changes", () => {
  const original = composerValues();
  const changed = composerValues({
    audience: { allSchool: true, customEmails: ["extra@example.com"] },
  });
  expect(campaignRecipientPreviewFingerprint(original)).not.toBe(
    campaignRecipientPreviewFingerprint(changed),
  );
});

it("does not turn the preview sample limit into the campaign send cap", () => {
  const payload = buildCreateCampaignPayload(composerValues());
  expect(payload).not.toHaveProperty("limit");
  expect(payload).not.toHaveProperty("maxRecipients");
});

it("preserves the campaign footer in the content-preview payload", () => {
  const values = composerValues({ footerHtml: "<footer>School</footer>" });
  expect(buildPreviewCampaignPayload(values)).toMatchObject({
    footerHtml: "<footer>School</footer>",
  });
});
```

In `emailCampaignsService.test.ts`:

```ts
it("keeps the exact campaign preview response", async () => {
  apiMocks.apiPost.mockResolvedValue({
    key: "GENERAL_MESSAGE",
    subject: "Subject",
    html: "<p>Hello</p><footer>School</footer>",
    text: "Hello",
    missingVariables: [],
    unknownVariables: [],
  });

  await expect(
    previewEmailCampaign({
      templateKey: "GENERAL_MESSAGE",
      subject: "Subject",
      bodyHtml: "<p>Hello</p>",
      footerHtml: "<footer>School</footer>",
    }),
  ).resolves.toMatchObject({
    key: "GENERAL_MESSAGE",
    text: "Hello",
  });
});
```

- [ ] **Step 3: Run payload tests and confirm failure**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/campaigns/utils/__tests__/campaignPayloads.test.ts
```

Expected: FAIL because payload logic still lives in the component and has no fingerprint.

- [ ] **Step 4: Implement focused campaign payload module**

```ts
function normalizedOrUndefined(
  values: string[] | undefined,
): string[] | undefined {
  const normalized = normalizeStringSet(values);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeEmails(values: string[] | undefined): string[] | undefined {
  return normalizedOrUndefined(
    values?.map((email) => email.trim().toLowerCase()),
  );
}

function recipientScopeFor(
  mode: CampaignComposerValues["audienceMode"],
  audience: EmailCampaignAudience,
): EmailRecipientScopeRequest {
  if (mode === "selected-users") {
    return {
      scope: "selected",
      userIds: normalizedOrUndefined(audience.userIds),
    };
  }
  if (mode === "role") {
    return {
      scope: "role",
      roleKeys: normalizedOrUndefined(
        audience.roleKey ? [audience.roleKey] : undefined,
      ),
    };
  }
  if (mode === "user-type") {
    return {
      scope: "user_type",
      userTypes: normalizedOrUndefined(
        audience.userType ? [audience.userType] : undefined,
      ),
    };
  }
  return { scope: "all_school_users" };
}

export function buildCampaignRecipientPreviewPayload(
  values: CampaignComposerValues,
): EmailCampaignPreviewRecipientsRequest {
  const audience = buildCampaignAudience(values);
  return {
    recipientScope: recipientScopeFor(values.audienceMode, audience),
    customEmails: normalizeEmails(audience.customEmails),
    includeDisabledUsers: false,
    requireContactEmail: true,
    allowLoginEmailFallback: false,
    limit: 100,
  };
}

export function campaignRecipientPreviewFingerprint(
  values: CampaignComposerValues,
): string {
  return fingerprintCanonicalPayload(
    buildCampaignRecipientPreviewPayload(values),
  );
}

export function buildPreviewCampaignPayload(
  values: CampaignComposerValues,
): EmailCampaignPreviewRequest {
  return {
    templateKey: values.templateKey,
    subject: values.subject.trim(),
    title: values.title.trim() || undefined,
    bodyHtml: values.bodyHtml,
    bodyText: values.bodyText.trim() || null,
    footerHtml: values.footerHtml.trim() || null,
    previewData: {},
  };
}

export function buildCreateCampaignPayload(
  values: CampaignComposerValues,
): CreateEmailCampaignRequest {
  const recipients = buildCampaignRecipientPreviewPayload(values);
  return {
    recipientScope: recipients.recipientScope,
    customEmails: recipients.customEmails,
    includeDisabledUsers: recipients.includeDisabledUsers,
    requireContactEmail: recipients.requireContactEmail,
    allowLoginEmailFallback: recipients.allowLoginEmailFallback,
    templateKey: values.templateKey,
    subject: values.subject.trim(),
    title: values.title.trim() || undefined,
    bodyHtml: values.bodyHtml,
    bodyText: values.bodyText.trim() || null,
    footerHtml: values.footerHtml.trim() || null,
  };
}
```

Move `findCredentialVariables` into this module, extend its scanned fields with
`values.footerHtml`, and continue invoking it from the composer's preview/create
validation. Remove the old exported payload builders from
`CampaignComposer.tsx`.

Add a Footer HTML textarea to the composer using
`settings.email.campaigns.fields.footer_html`. Add:

```json
// en.json
"footer_html": "Footer HTML"

// ar.json
"footer_html": "تذييل HTML"
```

The comments are plan annotations and must not be copied into JSON.

- [ ] **Step 5: Write failing composer/page integrity tests**

```tsx
const campaignValues: CampaignComposerValues = {
  audienceMode: "all-school",
  audience: { allSchool: true },
  selectedUserIdsText: "",
  customEmailsText: "",
  templateKey: "GENERAL_MESSAGE",
  subject: "Subject",
  title: "",
  bodyHtml: "<p>Hello</p>",
  bodyText: "Hello",
  footerHtml: "",
};

function eligibleCampaignPreview(): EmailCampaignPreviewRecipientsResponse {
  return {
    totalMatched: 1,
    eligibleCount: 1,
    skippedCount: 0,
    skippedReasons: {},
    recipients: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

vi.mock(
  "@/features/settings/email/campaigns/components/CampaignComposer",
  () => ({
    default: (props: {
      recipientPreview: EmailCampaignPreviewRecipientsResponse | null;
      onPreviewRecipients: (
        values: CampaignComposerValues,
      ) => Promise<EmailCampaignPreviewRecipientsResponse | null>;
      onCreate: (
        values: CampaignComposerValues,
      ) => Promise<EmailCampaignBatch | null>;
      onRecipientPreviewInvalidated: () => void;
    }) => (
      <div>
        <span>
          {props.recipientPreview ? "preview-present" : "preview-empty"}
        </span>
        <button
          type="button"
          onClick={() => void props.onPreviewRecipients(campaignValues)}
        >
          preview
        </button>
        <button type="button" onClick={props.onRecipientPreviewInvalidated}>
          invalidate
        </button>
        <button
          type="button"
          onClick={() =>
            void props.onCreate({
              ...campaignValues,
              audienceMode: "role",
              audience: { roleKey: "teacher" },
            })
          }
        >
          create-changed
        </button>
      </div>
    ),
  }),
);

it("ignores a late recipient preview for an older audience", async () => {
  const request = deferred<EmailCampaignPreviewRecipientsResponse>();
  serviceMocks.previewEmailCampaignRecipients.mockReturnValue(request.promise);
  render(<EmailCampaignsPage />);

  await userEvent.click(screen.getByRole("button", { name: "preview" }));
  await userEvent.click(screen.getByRole("button", { name: "invalidate" }));
  request.resolve(eligibleCampaignPreview());

  expect(await screen.findByText("preview-empty")).toBeVisible();
  expect(screen.queryByText("preview-present")).not.toBeInTheDocument();
});

it("clears a prior recipient preview before a failed re-preview", async () => {
  serviceMocks.previewEmailCampaignRecipients
    .mockResolvedValueOnce(eligibleCampaignPreview())
    .mockRejectedValueOnce(new ApiError("raw", 503, "service_unavailable"));
  render(<EmailCampaignsPage />);

  await userEvent.click(screen.getByRole("button", { name: "preview" }));
  expect(await screen.findByText("preview-present")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "preview" }));

  expect(await screen.findByText("preview-empty")).toBeVisible();
});

it("blocks create for an audience different from the preview", async () => {
  serviceMocks.previewEmailCampaignRecipients.mockResolvedValue(
    eligibleCampaignPreview(),
  );
  render(<EmailCampaignsPage />);

  await userEvent.click(screen.getByRole("button", { name: "preview" }));
  expect(await screen.findByText("preview-present")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "create-changed" }));

  expect(serviceMocks.createEmailCampaign).not.toHaveBeenCalled();
});
```

Extend the real `CampaignComposer.test.tsx` with explicit audience/content
invalidation checks:

```tsx
it("invalidates recipient preview for audience changes but not content edits", async () => {
  const onRecipientPreviewInvalidated = vi.fn();
  render(
    <CampaignComposer
      canManage
      roles={[]}
      recipientPreview={eligibleCampaignPreview()}
      recipientPreviewFingerprint="current"
      renderedPreview={null}
      createdBatch={null}
      isPreviewingRecipients={false}
      isPreviewingCampaign={false}
      isCreating={false}
      onPreviewRecipients={vi.fn()}
      onPreviewCampaign={vi.fn()}
      onCreate={vi.fn()}
      onRecipientPreviewInvalidated={onRecipientPreviewInvalidated}
    />,
  );

  fireEvent.change(screen.getByRole("textbox", { name: /fields\.subject/ }), {
    target: { value: "Updated" },
  });
  expect(onRecipientPreviewInvalidated).not.toHaveBeenCalled();

  await addCustomEmailThroughAudienceStep("extra@example.com");
  expect(onRecipientPreviewInvalidated).toHaveBeenCalledTimes(1);
});
```

Define the helper with the real custom-email control:

```ts
async function addCustomEmailThroughAudienceStep(email: string) {
  await userEvent.type(
    screen.getByRole("textbox", { name: /audience\.custom_emails/ }),
    email,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /audience\.custom_email_add/ }),
  );
}
```

- [ ] **Step 6: Implement campaign preview state and race guard**

Use the same captured-fingerprint pattern as credentials:

```ts
const [recipientPreviewFingerprint, setRecipientPreviewFingerprint] =
  useState<string | null>(null);
const activeRecipientPreviewFingerprint = useRef<string | null>(null);

const invalidateRecipientPreview = () => {
  activeRecipientPreviewFingerprint.current = null;
  setRecipientPreview(null);
  setRecipientPreviewFingerprint(null);
  setCreatedBatch(null);
};
```

At the start of each recipient-preview request, record its captured fingerprint
and clear the prior preview and stored fingerprint. After the response returns,
commit it only when its captured fingerprint still equals the active
fingerprint. Before create, compare the current fingerprint again and build the
request with `buildCreateCampaignPayload(values)`. Pass invalidation only through
audience update paths, not content update paths. Do not clear a still-matching
recipient preview when create fails.

In the composer, derive the create guard explicitly:

```ts
const hasCurrentEligibleRecipientPreview =
  recipientPreview !== null &&
  recipientPreview.eligibleCount > 0 &&
  recipientPreviewFingerprint === campaignRecipientPreviewFingerprint(values);

const createDisabled =
  !canManage ||
  !hasCurrentEligibleRecipientPreview ||
  isCreating ||
  Boolean(createdBatch);
```

Use `createDisabled` on the create button while keeping campaign content
validation in `handleCreate`.

- [ ] **Step 7: Run campaign tests**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email/campaigns src/features/settings/__tests__/sprint11EndpointContracts.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 7**

```powershell
git add -- src/features/settings/email/campaigns/utils/campaignPayloads.ts src/features/settings/email/campaigns/utils/__tests__/campaignPayloads.test.ts src/features/settings/email/campaigns/components/CampaignComposer.tsx src/features/settings/email/campaigns/components/CampaignAudienceStep.tsx src/features/settings/email/campaigns/components/__tests__/CampaignComposer.test.tsx src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx src/features/settings/email/campaigns/pages/__tests__/EmailCampaignsPage.test.tsx src/features/settings/email/campaigns/types.ts src/features/settings/email/campaigns/services/emailCampaignsService.ts src/features/settings/email/campaigns/services/__tests__/emailCampaignsService.test.ts src/features/settings/__tests__/sprint11EndpointContracts.test.ts src/messages/en.json src/messages/ar.json
git diff --cached --check
git commit -m "fix: require current campaign recipient preview"
```

---

### Task 8: Cross-Module Regression and Verification

**Files:**
- Modify only when a verification failure exposes a missing requirement.
- Review: `docs/superpowers/specs/2026-07-30-email-backend-contract-workflow-alignment-design.md`
- Review: every changed source and test file from Tasks 1–7.
- Modify: `src/features/settings/__tests__/sprint11EndpointContracts.test.ts`

**Interfaces:**
- Consumes all prior task outputs.
- Produces a verified, merge-ready frontend implementation.

- [ ] **Step 1: Run all focused email and shared workflow tests**

Before the run, confirm `sprint11EndpointContracts.test.ts` has explicit
method/path coverage for all 21 backend email routes listed in the verified
source matrix. Add any missing operation to the contract test, using a valid
UUID fixture for `:batchId` paths.

Run:

```powershell
.\node_modules\.bin\vitest.cmd run src/features/settings/email src/features/settings/shared src/features/settings/__tests__/sprint11EndpointContracts.test.ts src/features/settings/__tests__/emailPermissionsContract.test.ts e2e/sprint11-frontend-endpoints.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript typecheck**

Run:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit --pretty false
```

Expected: exit code 0. If unrelated pre-existing failures occur, record them separately and still fix every failure caused by the email changes.

- [ ] **Step 3: Run ESLint on changed email and shared files**

Run:

```powershell
.\node_modules\.bin\eslint.cmd src/features/settings/email src/features/settings/shared src/messages/en.json src/messages/ar.json
```

Expected: exit code 0 for changed source files. If ESLint does not accept JSON paths, rerun without the two message files and validate them by parsing.

- [ ] **Step 4: Parse translation JSON**

Run:

```powershell
node -e "for (const file of ['src/messages/en.json','src/messages/ar.json']) JSON.parse(require('fs').readFileSync(file,'utf8')); console.log('translations ok')"
```

Expected: `translations ok`.

- [ ] **Step 5: Run contract grep checks**

Run:

```powershell
rg -n "lastTestAt|lastTestStatus|cancelledCount|skippedAt|CreateCredentialDeliveryResponse|CreateEmailCampaignResponse|CancelEmailDeliveryResponse|providerType: \"SENDGRID\"|error\\.message" src/features/settings/email
```

Expected: no production matches. Test descriptions may mention removed names only when asserting absence.

Run:

```powershell
rg -n "maxRecipients\\s*:" src/features/settings/email/credential-deliveries/utils/credentialDeliveryPayloads.ts src/features/settings/email/campaigns/utils/campaignPayloads.ts
```

Expected: no matches; the backend's 250/500 create defaults remain authoritative.

Run:

```powershell
rg -n "settings\\.email\\.(connection_missing|connection_not_verified|connection_test_failed|secret_encryption_failed|template_invalid|delivery_connection_inactive|delivery_template_missing|delivery_no_recipients|delivery_recipient_invalid|delivery_batch_not_found|delivery_batch_not_cancelable|delivery_too_many_recipients|delivery_send_failed|campaign_invalid|campaign_credential_variables_forbidden)" src/features/settings/shared/utils/__tests__/settingsWorkflowErrors.test.ts
```

Expected: every backend email code appears in the exhaustive classifier test.

- [ ] **Step 6: Review dirty-worktree preservation**

Run:

```powershell
git status --short
git diff --stat
git log --oneline -10
```

Confirm selected-user credential initialization, shared workflow errors, and every unrelated pre-existing change remain present. Do not reset or discard them.

- [ ] **Step 7: Apply quality guards**

Use `test-guard` on all changed test files and `clean-code-guard` on all changed production files. Fix concrete findings, rerun the affected focused tests, and do not broaden scope into unrelated refactoring.

- [ ] **Step 8: Final verification rerun**

Repeat Steps 1–5 after guard fixes.

Expected: all focused tests pass, typecheck is clean or only has explicitly documented unrelated failures, lint is clean, and translations parse.

- [ ] **Step 9: Commit verification or guard fixes with their owning files if needed**

If the route inventory check or a guard requires a change, rerun the owning
task's focused tests and commit only the exact production and test files changed
by that correction. Do not create an empty verification commit and do not stage
unrelated worktree files.
