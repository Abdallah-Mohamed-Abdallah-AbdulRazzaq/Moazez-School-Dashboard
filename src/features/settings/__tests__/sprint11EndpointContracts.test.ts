import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  fetchLoginIdentitySettings,
  updateLoginIdentitySettings,
} from "@/features/settings/login-identity/services/loginIdentityService";
import {
  createSettingsUser,
  updateSettingsUser,
} from "@/features/settings/services/settingsUsersService";
import { fetchAdmissionRequiredDocumentsForSchool } from "@/features/settings/services/settingsService";
import {
  fetchCredentialStatuses,
  generateBulkCredentials,
  mapBulkGenerateCredentialsResponse,
  mapGeneratedCredentialResponse,
  previewBulkCredentials,
  setUserCredentialPassword,
} from "@/features/settings/credentials/services/credentialsService";
import {
  activateEmailConnection,
  disableEmailConnection,
  fetchEmailConnection,
  testEmailConnection,
  updateEmailConnection,
} from "@/features/settings/email/connection/services/emailConnectionService";
import {
  fetchEmailTemplate,
  fetchEmailTemplates,
  previewEmailTemplate,
  resetEmailTemplateToDefault,
  updateEmailTemplate,
} from "@/features/settings/email/templates/services/emailTemplatesService";
import {
  createCredentialDelivery,
  mapCredentialDeliveryPreviewResponse,
  previewCredentialDeliveryRecipients,
} from "@/features/settings/email/credential-deliveries/services/credentialDeliveryService";
import {
  cancelEmailDeliveryBatch,
  fetchEmailDeliveries,
  fetchEmailDeliveryBatch,
  fetchEmailDeliveryRecipients,
  mapDeliveryBatch,
  mapDeliveryRecipient,
} from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import {
  createEmailCampaign,
  fetchEmailCampaign,
  fetchEmailCampaigns,
  mapEmailCampaignRecipientsPreview,
  previewEmailCampaign,
  previewEmailCampaignRecipients,
} from "@/features/settings/email/campaigns/services/emailCampaignsService";
import {
  buildCreateCampaignPayload,
  buildPreviewCampaignPayload,
} from "@/features/settings/email/campaigns/utils/campaignPayloads";
import type { CampaignComposerValues } from "@/features/settings/email/campaigns/components/CampaignComposer";
import {
  fetchHealthReport,
  normalizeHealthReport,
} from "@/features/settings/health/services/healthService";

function emailConnectionDto(
  status: "DRAFT" | "VERIFIED" | "ACTIVE" | "DISABLED" | "FAILED",
) {
  return {
    configured: true,
    providerType: "SMTP" as const,
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
    updatedAt: "2026-07-30T10:00:00.000Z",
  };
}

describe("Sprint 11 endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
    apiMocks.apiPut.mockReset().mockResolvedValue({});
    apiMocks.apiPatch.mockReset().mockResolvedValue({});
    apiMocks.apiDelete.mockReset().mockResolvedValue({});
  });

  it("covers every backend email method and route", async () => {
    const batchId = "00000000-0000-4000-8000-000000000021";
    const connection = emailConnectionDto("VERIFIED");
    const template = {
      id: null,
      key: "GENERAL_MESSAGE" as const,
      customized: false,
      subject: "Message",
      preheader: null,
      title: null,
      subtitle: null,
      bodyHtml: "<p>Hello</p>",
      bodyText: "Hello",
      footerHtml: null,
      supportEmail: null,
      supportPhone: null,
      socialLinks: null,
      isActive: true,
      allowedVariables: [],
      createdAt: null,
      updatedAt: null,
    };
    const batch = {
      batchId,
      status: "QUEUED" as const,
      kind: "GENERAL_CAMPAIGN" as const,
      templateKey: "GENERAL_MESSAGE" as const,
      subjectSnapshot: "Message",
      totalRecipients: 0,
      queuedCount: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      failureReason: null,
      createdAt: "2026-07-30T10:00:00.000Z",
      updatedAt: "2026-07-30T10:00:00.000Z",
      deliveryMode: "queued",
    };
    const recipientPreview = {
      totalMatched: 0,
      eligible: 0,
      skipped: 0,
      skippedReasons: {},
      sample: { eligible: [], skipped: [] },
    };

    apiMocks.apiGet.mockImplementation(async (path: string) => {
      if (path === "/settings/email/connection") return connection;
      if (path === "/settings/email/templates") return { items: [template] };
      if (path === "/settings/email/templates/GENERAL_MESSAGE") return template;
      if (path === "/settings/email/deliveries") {
        return { items: [batch], pagination: { page: 1, limit: 20, total: 1 } };
      }
      if (path === `/settings/email/deliveries/${batchId}/recipients`) {
        return { items: [], pagination: { page: 1, limit: 20, total: 0 } };
      }
      if (path === `/settings/email/deliveries/${batchId}`) return batch;
      if (path === "/settings/email/campaigns") {
        return { items: [batch], pagination: { page: 1, limit: 20, total: 1 } };
      }
      if (path === `/settings/email/campaigns/${batchId}`) return batch;
      throw new Error(`Unexpected GET ${path}`);
    });
    apiMocks.apiPut.mockImplementation(async (path: string) =>
      path === "/settings/email/connection" ? connection : template,
    );
    apiMocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/settings/email/connection/test") {
        return {
          ...connection,
          testRecipient: "admin@example.com",
          deliveryMode: "configuration_validation",
          message: "Verified",
        };
      }
      if (
        path === "/settings/email/connection/activate" ||
        path === "/settings/email/connection/disable"
      ) {
        return connection;
      }
      if (path === "/settings/email/templates/GENERAL_MESSAGE/preview") {
        return {
          key: "GENERAL_MESSAGE",
          subject: "Message",
          preheader: null,
          html: "<p>Hello</p>",
          text: "Hello",
          unknownVariables: [],
          missingVariables: [],
        };
      }
      if (path === "/settings/email/templates/GENERAL_MESSAGE/reset-default") {
        return template;
      }
      if (
        path ===
          "/settings/email/credential-deliveries/preview-recipients" ||
        path === "/settings/email/campaigns/preview-recipients"
      ) {
        return recipientPreview;
      }
      if (path === "/settings/email/campaigns/preview") {
        return {
          key: "GENERAL_MESSAGE",
          subject: "Message",
          html: "<p>Hello</p>",
          text: "Hello",
          unknownVariables: [],
          missingVariables: [],
        };
      }
      return batch;
    });

    await fetchEmailConnection();
    await updateEmailConnection({ fromName: "School" });
    await testEmailConnection({ toEmail: "admin@example.com" });
    await activateEmailConnection();
    await disableEmailConnection();
    await fetchEmailTemplates();
    await fetchEmailTemplate("GENERAL_MESSAGE");
    await updateEmailTemplate("GENERAL_MESSAGE", { subject: "Message" });
    await previewEmailTemplate("GENERAL_MESSAGE", {});
    await resetEmailTemplateToDefault("GENERAL_MESSAGE");
    await previewCredentialDeliveryRecipients({ scope: "all_school_users" });
    await createCredentialDelivery({
      scope: "all_school_users",
      credentialMode: "LOGIN_INFO_ONLY",
    });
    await fetchEmailDeliveries();
    await fetchEmailDeliveryBatch(batchId);
    await fetchEmailDeliveryRecipients(batchId);
    await cancelEmailDeliveryBatch(batchId);
    await previewEmailCampaignRecipients({
      recipientScope: { scope: "all_school_users" },
    });
    await previewEmailCampaign({ bodyHtml: "<p>Hello</p>" });
    await createEmailCampaign({
      recipientScope: { scope: "all_school_users" },
      bodyHtml: "<p>Hello</p>",
    });
    await fetchEmailCampaigns();
    await fetchEmailCampaign(batchId);

    expect(apiMocks.apiGet.mock.calls).toEqual(
      expect.arrayContaining([
        ["/settings/email/connection"],
        ["/settings/email/templates"],
        ["/settings/email/templates/GENERAL_MESSAGE"],
        ["/settings/email/deliveries"],
        [`/settings/email/deliveries/${batchId}`],
        [`/settings/email/deliveries/${batchId}/recipients`],
        ["/settings/email/campaigns"],
        [`/settings/email/campaigns/${batchId}`],
      ]),
    );
    expect(apiMocks.apiPut.mock.calls).toEqual(
      expect.arrayContaining([
        ["/settings/email/connection", { fromName: "School" }],
        ["/settings/email/templates/GENERAL_MESSAGE", { subject: "Message" }],
      ]),
    );
    expect(apiMocks.apiPost.mock.calls.map(([path]) => path)).toEqual(
      expect.arrayContaining([
        "/settings/email/connection/test",
        "/settings/email/connection/activate",
        "/settings/email/connection/disable",
        "/settings/email/templates/GENERAL_MESSAGE/preview",
        "/settings/email/templates/GENERAL_MESSAGE/reset-default",
        "/settings/email/credential-deliveries/preview-recipients",
        "/settings/email/credential-deliveries",
        `/settings/email/deliveries/${batchId}/cancel`,
        "/settings/email/campaigns/preview-recipients",
        "/settings/email/campaigns/preview",
        "/settings/email/campaigns",
      ]),
    );
    expect(
      apiMocks.apiGet.mock.calls.length +
        apiMocks.apiPut.mock.calls.length +
        apiMocks.apiPost.mock.calls.length,
    ).toBe(21);
  });

  it("loads read-only applicant portal admissions documents for a school", async () => {
    apiMocks.apiGet.mockResolvedValue({
      data: {
        items: [
          {
            id: "doc-late",
            title: "Medical report",
            description: "Recent medical report",
            isMandatory: false,
            acceptedFileTypes: ["application/pdf"],
            maxFiles: 2,
            sortOrder: 2,
          },
          {
            id: "doc-first",
            title: "Passport",
            description: null,
            isMandatory: true,
            acceptedFileTypes: "image/png,image/jpeg",
            maxFiles: "1",
            sortOrder: 1,
          },
        ],
      },
    });

    const documents = await fetchAdmissionRequiredDocumentsForSchool("school/one");

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/applicant-portal/schools/school%2Fone/admission-required-documents",
    );
    expect(documents).toEqual([
      {
        id: "doc-first",
        title: "Passport",
        description: "",
        isMandatory: true,
        acceptedFileTypes: ["image/png", "image/jpeg"],
        maxFiles: 1,
        sortOrder: 1,
      },
      {
        id: "doc-late",
        title: "Medical report",
        description: "Recent medical report",
        isMandatory: false,
        acceptedFileTypes: ["application/pdf"],
        maxFiles: 2,
        sortOrder: 2,
      },
    ]);
  });

  it("uses the backend login identity field names", async () => {
    apiMocks.apiGet.mockResolvedValue({
      configured: true,
      loginDomain: "school.edu",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      allowedCharacters: "letters",
      reservedUsernames: [],
      status: "active",
    });

    const settings = await fetchLoginIdentitySettings();
    await updateLoginIdentitySettings({
      loginDomain: "school.edu",
      allowedCharacters: "letters",
      reservedUsernames: [],
      status: "disabled",
    });

    expect(settings.configured).toBe(true);
    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/login-identity",
      expect.objectContaining({
        allowedCharacters: "letters",
        status: "disabled",
      }),
    );
    expect(apiMocks.apiPut).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ usernamePattern: expect.anything() }),
    );
  });

  it("creates users with username/contactEmail and edits without contactEmail", async () => {
    apiMocks.apiPost.mockResolvedValue({
      id: "u1",
      fullName: "Sara Ali",
      email: "sara@school.edu",
      roleId: "role-1",
      status: "active",
    });
    apiMocks.apiPatch.mockResolvedValue({
      id: "u1",
      fullName: "Sara Updated",
      email: "sara@school.edu",
      roleId: "role-2",
      status: "active",
    });

    await createSettingsUser({
      fullName: "Sara Ali",
      username: "sara",
      contactEmail: "sara.parent@example.com",
      roleId: "role-1",
    });
    await updateSettingsUser("u1", {
      fullName: "Sara Updated",
      roleId: "role-2",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users",
      expect.objectContaining({
        username: "sara",
        contactEmail: "sara.parent@example.com",
      }),
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/settings/users/u1",
      {
        fullName: "Sara Updated",
        roleId: "role-2",
      },
    );
  });

  it("uses corrected credential payloads and generated response mappers", async () => {
    apiMocks.apiPost.mockResolvedValueOnce({
      totalMatched: 2,
      eligible: 1,
      skipped: 1,
      skippedReasons: { has_password: 1 },
      sample: { eligible: [], skipped: [] },
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      generatedAt: "2026-05-13T00:00:00Z",
      totalMatched: 1,
      generated: 1,
      skipped: 0,
      items: [
        {
          user: {
            userId: "u1",
            fullName: "Sara Ali",
            username: "sara",
            loginEmail: "sara@school.edu",
          },
          temporaryPassword: "one-time",
        },
      ],
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      user: { userId: "u1", fullName: "Sara Ali", username: "sara" },
      temporaryPassword: "one-time",
      mustChangePassword: true,
      credentialVersion: 2,
    });

    await previewBulkCredentials({ scope: "missing_password" });
    await generateBulkCredentials({ scope: "role", roleKeys: ["teacher"] });
    await setUserCredentialPassword("u1", {
      password: "new-password",
      forceResetOnLogin: true,
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/credentials/bulk-preview",
      { scope: "missing_password" },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/credentials/bulk-generate",
      { scope: "role", roleKeys: ["teacher"] },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/u1/credentials/set",
      {
        password: "new-password",
        forceResetOnLogin: true,
      },
    );

    expect(
      mapGeneratedCredentialResponse({
        user: { userId: "u1", fullName: "Sara Ali", username: "sara" },
        temporaryPassword: "one-time",
        mustChangePassword: true,
        credentialVersion: 3,
      }),
    ).toMatchObject({ userId: "u1", fullName: "Sara Ali" });
    expect(
      mapBulkGenerateCredentialsResponse({
        totalMatched: 1,
        generated: 1,
        skipped: 0,
        items: [{ user: { userId: "u1" }, temporaryPassword: "one-time" }],
      }).credentials[0],
    ).toMatchObject({ userId: "u1", temporaryPassword: "one-time" });
  });

  it("uses only supported credential status query fields", async () => {
    apiMocks.apiGet.mockResolvedValue({ items: [] });

    await fetchCredentialStatuses({
      search: " Sara ",
      page: 2,
      limit: 25,
      roleKey: "teacher",
      userType: "staff",
      credentialStatus: "must_change",
    });

    const requestedPath = apiMocks.apiGet.mock.calls[0]?.[0] as string;
    expect(requestedPath).toBe(
      "/settings/users/credentials/status?search=Sara&page=2&limit=25&roleKey=teacher&userType=staff&credentialStatus=must_change",
    );
    expect(requestedPath).not.toMatch(/[?&](?:status|userStatus)=/);
  });

  it("uses corrected email connection contract", async () => {
    apiMocks.apiPost
      .mockResolvedValueOnce({
        ...emailConnectionDto("VERIFIED"),
        testRecipient: "admin@example.com",
        deliveryMode: "configuration_validation",
        message: "SMTP configuration was validated.",
      })
      .mockResolvedValueOnce(emailConnectionDto("ACTIVE"))
      .mockResolvedValueOnce(emailConnectionDto("DISABLED"));

    await updateEmailConnection({
      providerType: "SMTP",
      fromName: "School",
      fromEmail: "school@example.com",
    });
    await testEmailConnection({ toEmail: "admin@example.com" });
    await activateEmailConnection();
    await disableEmailConnection();

    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/email/connection",
      expect.objectContaining({ providerType: "SMTP" }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/connection/test",
      { toEmail: "admin@example.com" },
    );
  });

  it("uses previewData for templates and flat payloads for credential delivery", async () => {
    apiMocks.apiPost
      .mockResolvedValueOnce({
        key: "ACCOUNT_CREDENTIALS",
        subject: "Subject",
        preheader: null,
        html: "<p>Hello</p>",
        text: "Hello",
        unknownVariables: [],
        missingVariables: [],
      })
      .mockResolvedValueOnce({
        totalMatched: 0,
        eligible: 0,
        skipped: 0,
        skippedReasons: {},
        sample: { eligible: [], skipped: [] },
      })
      .mockResolvedValueOnce({
        batchId: "00000000-0000-4000-8000-000000000001",
        status: "QUEUED",
        kind: "CREDENTIAL_DELIVERY",
        templateKey: "ACCOUNT_CREDENTIALS",
        subjectSnapshot: "Credentials",
        totalRecipients: 0,
        queuedCount: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        failureReason: null,
        createdAt: "2026-07-30T10:00:00.000Z",
        updatedAt: "2026-07-30T10:00:00.000Z",
        deliveryMode: "queued",
      });

    await previewEmailTemplate("ACCOUNT_CREDENTIALS", {
      subject: "Subject",
      bodyHtml: "<p>Hello</p>",
      previewData: { user: { fullName: "Sara" } },
    });
    await previewCredentialDeliveryRecipients({
      scope: "all_school_users",
      requireContactEmail: true,
    });
    await createCredentialDelivery({
      scope: "missing_password",
      templateKey: "ACCOUNT_CREDENTIALS",
      credentialMode: "GENERATE_TEMPORARY_PASSWORD",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/templates/ACCOUNT_CREDENTIALS/preview",
      expect.objectContaining({ previewData: expect.any(Object) }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/credential-deliveries/preview-recipients",
      expect.not.objectContaining({ audience: expect.anything() }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/credential-deliveries",
      expect.objectContaining({ scope: "missing_password" }),
    );
  });

  it("maps credential delivery recipient DTO fields to the preview UI model", () => {
    const preview = mapCredentialDeliveryPreviewResponse({
      totalMatched: 2,
      eligible: 1,
      skipped: 1,
      skippedReasons: { missing_contact_email: 1 },
      sample: {
        eligible: [
          {
            userId: "u1",
            fullName: "Sara Ali",
            username: "sara",
            loginEmail: "sara@school.edu",
            contactEmail: "sara.parent@example.com",
            toEmail: "sara.parent@example.com",
            userType: "student",
            roleKey: "student",
            hasPassword: false,
            mustChangePassword: false,
            credentialVersion: 0,
            reason: null,
          },
        ],
        skipped: [
          {
            userId: "u2",
            fullName: "No Contact",
            username: null,
            loginEmail: "no-contact@school.edu",
            contactEmail: null,
            toEmail: null,
            userType: "parent",
            roleKey: "parent",
            hasPassword: false,
            mustChangePassword: false,
            credentialVersion: 0,
            reason: "missing_contact_email",
          },
        ],
      },
    });

    expect(preview.eligibleSample[0]).toMatchObject({
      userId: "u1",
      loginEmail: "sara@school.edu",
      recipientEmail: "sara.parent@example.com",
      eligible: true,
      skipReason: null,
    });
    expect(preview.skippedSample[0]).toMatchObject({
      userId: "u2",
      loginEmail: "no-contact@school.edu",
      recipientEmail: null,
      eligible: false,
      skipReason: "missing_contact_email",
    });
  });

  it("uses campaign recipientScope, top-level customEmails, and previewData", async () => {
    apiMocks.apiPost
      .mockResolvedValueOnce({
        totalMatched: 0,
        eligible: 0,
        skipped: 0,
        skippedReasons: {},
        sample: { eligible: [], skipped: [] },
      })
      .mockResolvedValueOnce({
        key: "GENERAL_MESSAGE",
        subject: "Subject",
        html: "<p>Hello</p>",
        text: "Hello",
        missingVariables: [],
        unknownVariables: [],
      })
      .mockResolvedValueOnce({
        batchId: "00000000-0000-4000-8000-000000000004",
        status: "QUEUED",
        kind: "GENERAL_CAMPAIGN",
        templateKey: "GENERAL_MESSAGE",
        subjectSnapshot: "Subject",
        totalRecipients: 0,
        queuedCount: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        failureReason: null,
        createdAt: "2026-07-30T10:00:00.000Z",
        updatedAt: "2026-07-30T10:00:00.000Z",
        deliveryMode: "queued",
      });
    const values: CampaignComposerValues = {
      audienceMode: "role",
      audience: { roleKey: "teacher", customEmails: ["extra@example.com"] },
      selectedUserIdsText: "",
      customEmailsText: "extra@example.com",
      templateKey: "GENERAL_MESSAGE",
      subject: "Subject",
      title: "Title",
      bodyHtml: "<p>Hello</p>",
      bodyText: "Hello",
      footerHtml: "",
    };

    await previewEmailCampaignRecipients({
      recipientScope: { scope: "role", roleKeys: ["teacher"] },
      customEmails: ["extra@example.com"],
    });
    await previewEmailCampaign(buildPreviewCampaignPayload(values));
    await createEmailCampaign(buildCreateCampaignPayload(values));

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns/preview-recipients",
      {
        recipientScope: { scope: "role", roleKeys: ["teacher"] },
        customEmails: ["extra@example.com"],
      },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns/preview",
      expect.objectContaining({ previewData: {} }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns",
      expect.objectContaining({
        recipientScope: { scope: "role", roleKeys: ["teacher"] },
        customEmails: ["extra@example.com"],
      }),
    );
  });

  it("maps campaign recipient preview names, usernames, delivery email, and reasons", () => {
    expect(
      mapEmailCampaignRecipientsPreview({
        totalMatched: 16,
        eligible: 8,
        skipped: 8,
        skippedReasons: {
          disabled_user: 2,
          missing_contact_email: 1,
          duplicate_email: 5,
        },
        sample: {
          eligible: [
            {
              userId: "29ce481f-800c-4772-85be-170dd4930f49",
              fullName: "Abdallah",
              username: "abdallah",
              loginEmail: "abdallah@school.edu",
              contactEmail: "safnks0@gmail.com",
              toEmail: "safnks0@gmail.com",
              userType: "school_user",
              roleKey: "teacher",
              hasPassword: true,
              mustChangePassword: false,
              credentialVersion: 2,
              reason: null,
            },
          ],
          skipped: [],
        },
      }).recipients[0],
    ).toMatchObject({
      fullName: "Abdallah",
      username: "abdallah",
      recipientEmail: "safnks0@gmail.com",
      eligible: true,
      skipReason: null,
    });
  });

  it("loads the public health readiness endpoint", async () => {
    apiMocks.apiGet.mockResolvedValue({
      status: "ok",
      timestamp: "2026-06-25T10:00:00.000Z",
      version: "0.1.0",
      checks: {
        db: { status: "ok", durationMs: 12 },
        redis: { status: "ok", durationMs: 5 },
        storage: { status: "ok", durationMs: 18 },
        queues: {
          status: "ok",
          durationMs: 20,
          details: {
            queues: [
              {
                name: "school-email-delivery",
                status: "ok",
                counts: { waiting: 0, active: 0, delayed: 0, failed: 0 },
              },
            ],
          },
        },
        email: {
          status: "skipped",
          durationMs: 3,
          message: "no_active_email_connections",
          details: { activeConnections: 0 },
        },
        push: {
          status: "skipped",
          durationMs: 1,
          message: "push_disabled",
          details: { mode: "disabled" },
        },
      },
    });

    const report = await fetchHealthReport();

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/health");
    expect(report.checks.queues.details?.queues).toHaveLength(1);
  });

  it("normalizes omitted health dependency checks to visible error checks", () => {
    const report = normalizeHealthReport({
      status: "ok",
      timestamp: "2026-06-25T10:00:00.000Z",
      version: "0.1.0",
      checks: {
        db: { status: "ok", durationMs: 12 },
        redis: { status: "ok", durationMs: 5 },
        storage: { status: "ok", durationMs: 18 },
        email: { status: "skipped", durationMs: 3 },
        push: { status: "skipped", durationMs: 1 },
      } as never,
    });

    expect(report.checks.queues).toEqual({
      status: "error",
      durationMs: 0,
      message: "health_check_missing",
    });
  });

  it("maps delivery backend fields to UI fields", () => {
    expect(
      mapDeliveryBatch({
        batchId: "b1",
        kind: "GENERAL_CAMPAIGN",
        status: "DRAFT",
        subjectSnapshot: "Subject",
        totalRecipients: 3,
        queuedCount: 3,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        createdAt: "2026-05-13T00:00:00Z",
      }),
    ).toMatchObject({ subject: "Subject", cancellable: true });
    expect(
      mapDeliveryRecipient({
        id: "r1",
        toEmail: "parent@example.com",
        displayName: "Parent",
        status: "SENDING",
      }),
    ).toMatchObject({ recipientEmail: "parent@example.com", fullName: "Parent" });
  });
});
