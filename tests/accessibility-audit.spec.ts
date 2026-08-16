import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type AuditConfig = {
  baseUrl: string;
  locale?: string;
  pages: string[];
  viewports: Array<{ name: string; width: number; height: number }>;
  auth: {
    enabled: boolean;
    loginUrl: string;
    storageStatePath: string;
  };
};

type AccessibilityIssue = {
  page: string;
  viewport: string;
  id: string;
  impact: string | null | undefined;
  description: string;
  help: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary?: string;
  }>;
};

const reportDir = path.join(process.cwd(), "ui-audit-report");
const issues: AccessibilityIssue[] = [];
const config = await readAuditConfig();

test.describe.configure({ mode: "serial" });

for (const viewport of config.viewports) {
  for (const pagePath of config.pages) {
    test(`checks accessibility for ${pagePath} at ${viewport.name}`, async ({ browser }) => {
      const pageIssues = await auditAccessibility(browser, pagePath, viewport);
      issues.push(...pageIssues);
    });
  }
}

test.afterAll(async () => {
  await mkdir(reportDir, { recursive: true });
  await writeFile(
    path.join(reportDir, "accessibility-issues.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: config.baseUrl,
        issueCount: issues.length,
        issues,
      },
      null,
      2,
    ),
  );
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

async function auditAccessibility(
  browser: Browser,
  pagePath: string,
  viewport: AuditConfig["viewports"][number],
): Promise<AccessibilityIssue[]> {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    storageState: storageStateFor(pagePath),
  });
  const page = await context.newPage();

  await page.goto(new URL(pagePath, config.baseUrl).toString(), {
    waitUntil: "networkidle",
  });

  const results = await new AxeBuilder({ page }).analyze();
  await context.close();

  return results.violations.map((violation) => ({
    page: pagePath,
    viewport: viewport.name,
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
  }));
}

function storageStateFor(pagePath: string): string | undefined {
  if (!config.auth.enabled || pagePath === config.auth.loginUrl) {
    return undefined;
  }

  if (!existsSync(config.auth.storageStatePath)) {
    throw new Error(
      `Missing UI audit storage state at ${config.auth.storageStatePath}. Run npm run auth:setup with E2E credentials, or run npm run auth:manual for manual login.`,
    );
  }

  return config.auth.storageStatePath;
}
