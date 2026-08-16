import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test } from "@playwright/test";

type AuditConfig = {
  baseUrl: string;
  auth: {
    enabled: boolean;
    loginUrl: string;
    storageStatePath: string;
    credentials: {
      emailEnv: string;
      passwordEnv: string;
    };
    selectors: {
      email: string;
      password: string;
      submit: string;
    };
    successUrlPattern: string;
  };
};

const config = await readAuditConfig();

test("creates UI audit authenticated storage state", async ({ page }) => {
  if (!config.auth.enabled) {
    test.skip(true, "UI audit auth is disabled.");
  }

  const email = process.env[config.auth.credentials.emailEnv];
  const password = process.env[config.auth.credentials.passwordEnv];

  if (!email || !password) {
    throw new Error(
      `Missing credentials. Set ${config.auth.credentials.emailEnv} and ${config.auth.credentials.passwordEnv}, or run npm run auth:manual to create ${config.auth.storageStatePath}.`,
    );
  }

  await page.goto(new URL(config.auth.loginUrl, config.baseUrl).toString(), {
    waitUntil: "networkidle",
  });

  await page.locator(config.auth.selectors.email).first().fill(email);
  await page.locator(config.auth.selectors.password).first().fill(password);

  const loginPath = new URL(config.auth.loginUrl, config.baseUrl).pathname;
  await Promise.all([
    page.waitForURL(
      (url) =>
        url.href.includes(config.auth.successUrlPattern) ||
        url.pathname !== loginPath,
      { timeout: 30_000 },
    ),
    page.locator(config.auth.selectors.submit).first().click(),
  ]);

  await mkdir(path.dirname(config.auth.storageStatePath), { recursive: true });
  await page.context().storageState({ path: config.auth.storageStatePath });
});

async function readAuditConfig(): Promise<AuditConfig> {
  const configModule = await import("../ui-audit.config.json", {
    with: { type: "json" },
  });
  const fileConfig = configModule.default as AuditConfig;
  return {
    ...fileConfig,
    baseUrl: process.env.UI_AUDIT_BASE_URL || fileConfig.baseUrl,
  };
}
