import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { permissionCatalog } from "@/features/settings/constants/permissions";
import { settingsNavigationPermissionByKey } from "@/hooks/usePermissions";

const emailPermissionPairs = [
  ["connection", "settings.email.connection.view", "settings.email.connection.manage"],
  ["templates", "settings.email.templates.view", "settings.email.templates.manage"],
  [
    "credential-deliveries",
    "settings.email.credential_deliveries.view",
    "settings.email.credential_deliveries.manage",
  ],
  ["deliveries", "settings.email.deliveries.view", "settings.email.deliveries.manage"],
  ["campaigns", "settings.email.campaigns.view", "settings.email.campaigns.manage"],
] as const;

const emailPermissions = emailPermissionPairs.flatMap(([, view, manage]) => [
  view,
  manage,
]);

const emailPageContracts = [
  [
    "connection/pages/EmailConnectionPage.tsx",
    "settings.email.connection.view",
    "settings.email.connection.manage",
  ],
  [
    "templates/pages/EmailTemplatesPage.tsx",
    "settings.email.templates.view",
    "settings.email.templates.manage",
  ],
  [
    "credential-deliveries/pages/CredentialDeliveriesPage.tsx",
    "settings.email.credential_deliveries.view",
    "settings.email.credential_deliveries.manage",
  ],
  [
    "deliveries/pages/EmailDeliveriesPage.tsx",
    "settings.email.deliveries.view",
    "settings.email.deliveries.manage",
  ],
  [
    "deliveries/pages/EmailDeliveryDetailPage.tsx",
    "settings.email.deliveries.view",
    "settings.email.deliveries.manage",
  ],
  [
    "campaigns/pages/EmailCampaignsPage.tsx",
    "settings.email.campaigns.view",
    "settings.email.campaigns.manage",
  ],
  [
    "campaigns/pages/EmailCampaignDetailPage.tsx",
    "settings.email.campaigns.view",
    null,
  ],
] as const;

const emailFeatureRoot = resolve(
  process.cwd(),
  "src/features/settings/email",
);

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFilesUnder(entryPath) : [entryPath];
  });
}

describe("granular Settings email permissions", () => {
  it("maps every email navigation entry to its view permission", () => {
    emailPermissionPairs.forEach(([navigationKey, viewPermission]) => {
      expect(
        settingsNavigationPermissionByKey[`settings-email-${navigationKey}`],
      ).toBe(viewPermission);
    });
  });

  it("maps every Settings Overview email shortcut to its view permission", () => {
    const overviewSource = readFileSync(
      resolve(
        process.cwd(),
        "src/features/settings/dashboard/pages/SettingsOverviewPage.tsx",
      ),
      "utf8",
    );

    emailPermissionPairs.forEach(([, viewPermission]) => {
      expect(overviewSource).toContain(`permission: "${viewPermission}"`);
    });
  });

  it("publishes every backend email permission in the role catalog", () => {
    const catalogEmailPermissions = permissionCatalog
      .map(({ key }) => key)
      .filter((key) => key.startsWith("settings.email."));

    expect(new Set(catalogEmailPermissions)).toEqual(new Set(emailPermissions));
  });

  it.each(emailPageContracts)(
    "enforces the permission contract in %s",
    (relativePath, viewPermission, managePermission) => {
      const pageSource = readFileSync(resolve(emailFeatureRoot, relativePath), "utf8");

      expect(pageSource).toContain(
        `<SettingsAccessGuard permission="${viewPermission}">`,
      );
      if (managePermission) {
        const escapedPermission = managePermission.replaceAll(".", "\\.");
        expect(pageSource).toMatch(
          new RegExp(
            `hasPermission\\(\\s*"${escapedPermission}"\\s*,?\\s*\\)`,
          ),
        );
      }
    },
  );

  it("prevents the 2026-06-29 broad Security permission regression", () => {
    const emailFeatureSource = sourceFilesUnder(emailFeatureRoot)
      .filter((path) => /\.[jt]sx?$/.test(path))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(emailFeatureSource).not.toMatch(
      /settings\.security\.(?:view|manage)/,
    );
  });
});
