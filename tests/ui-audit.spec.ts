import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, type Browser, type ConsoleMessage } from "@playwright/test";

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

type UiIssue = {
  page: string;
  viewport: string;
  type: "console-error" | "horizontal-scroll" | "overflow";
  severity: "high" | "medium" | "low";
  message: string;
  details?: unknown;
};

type OverflowElement = {
  selector: string;
  tagName: string;
  text: string;
  rect: { left: number; right: number; width: number };
};

const reportDir = path.join(process.cwd(), "ui-audit-report");
const screenshotsDir = path.join(reportDir, "screenshots");
const issues: UiIssue[] = [];
const config = await readAuditConfig();

test.describe.configure({ mode: "serial" });

for (const viewport of config.viewports) {
  for (const pagePath of config.pages) {
    test(`audits ${pagePath} at ${viewport.name}`, async ({ browser }) => {
      const pageIssues = await auditPage(browser, pagePath, viewport);
      issues.push(...pageIssues);
    });
  }
}

test.afterAll(async () => {
  await mkdir(reportDir, { recursive: true });
  await writeFile(
    path.join(reportDir, "ui-issues.json"),
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

async function auditPage(
  browser: Browser,
  pagePath: string,
  viewport: AuditConfig["viewports"][number],
): Promise<UiIssue[]> {
  await mkdir(screenshotsDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    storageState: storageStateFor(pagePath),
  });
  const page = await context.newPage();
  const pageIssues: UiIssue[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    if (failure?.errorText === "net::ERR_ABORTED") {
      return;
    }

    failedResponses.push(`${failure?.errorText ?? "request failed"} ${request.url()}`);
  });

  await page.goto(new URL(pagePath, config.baseUrl).toString(), {
    waitUntil: "networkidle",
  });

  await page.screenshot({
    path: path.join(screenshotsDir, `${safeName(pagePath)}--${viewport.name}.png`),
    fullPage: true,
  });

  for (const message of consoleErrors) {
    pageIssues.push({
      page: pagePath,
      viewport: viewport.name,
      type: "console-error",
      severity: "medium",
      message,
    });
  }
  for (const message of failedResponses) {
    pageIssues.push({
      page: pagePath,
      viewport: viewport.name,
      type: "console-error",
      severity: "medium",
      message,
    });
  }

  const layoutMetrics = await page.evaluate(() => {
    const tolerance = 1;
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const overflowingElements = Array.from(document.body.querySelectorAll("*"))
      .filter((element) => shouldAuditOverflow(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, rect };
      })
      .filter(({ rect }) => rect.width > 0 && (rect.left < -tolerance || rect.right > viewportWidth + tolerance))
      .filter(({ element, rect }) => !isInsideHorizontalScrollContainer(element, rect, viewportWidth, tolerance))
      .slice(0, 50)
      .map(({ element, rect }) => ({
        selector: selectorFor(element),
        tagName: element.tagName.toLowerCase(),
        text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        },
      }));

    return {
      viewportWidth,
      scrollWidth,
      hasHorizontalScroll: scrollWidth > viewportWidth + tolerance,
      overflowingElements,
    };

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;

      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

      const parts: string[] = [];
      let current: Element | null = element;
      while (current && current !== document.body && parts.length < 4) {
        const tag = current.tagName.toLowerCase();
        const className = Array.from(current.classList).slice(0, 2).map((name) => `.${CSS.escape(name)}`).join("");
        parts.unshift(`${tag}${className}`);
        current = current.parentElement;
      }

      return parts.join(" > ") || element.tagName.toLowerCase();
    }

    function shouldAuditOverflow(element: Element): boolean {
      const tagName = element.tagName.toLowerCase();
      if (["svg", "path", "circle", "line", "rect", "polyline", "polygon"].includes(tagName)) {
        return false;
      }

      if (element.closest("[aria-hidden='true'], [hidden]")) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (!element.textContent?.trim() && rect.width <= 24 && rect.height <= 24) {
        return false;
      }

      const fixedOrAbsoluteAncestor = element.closest(".fixed, .absolute");
      if (fixedOrAbsoluteAncestor && isOffCanvas(fixedOrAbsoluteAncestor)) {
        return false;
      }

      return true;
    }

    function isOffCanvas(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        (style.position === "fixed" || style.position === "absolute") &&
        (rect.right <= tolerance || rect.left >= viewportWidth - tolerance)
      );
    }

    function isInsideHorizontalScrollContainer(
      element: Element,
      rect: DOMRect,
      viewportWidth: number,
      tolerance: number,
    ): boolean {
      let current = element.parentElement;
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const canScrollHorizontally =
          ["auto", "scroll"].includes(style.overflowX) &&
          current.scrollWidth > current.clientWidth + tolerance;

        if (canScrollHorizontally) {
          const containerRect = current.getBoundingClientRect();
          const containerClipsElement =
            rect.left < containerRect.left - tolerance ||
            rect.right > containerRect.right + tolerance ||
            containerRect.left < -tolerance ||
            containerRect.right > viewportWidth + tolerance;

          if (containerClipsElement) {
            return true;
          }
        }

        current = current.parentElement;
      }

      return false;
    }
  });

  if (layoutMetrics.hasHorizontalScroll) {
    pageIssues.push({
      page: pagePath,
      viewport: viewport.name,
      type: "horizontal-scroll",
      severity: "high",
      message: `Document scroll width ${layoutMetrics.scrollWidth}px exceeds viewport width ${layoutMetrics.viewportWidth}px.`,
      details: layoutMetrics,
    });
  }

  for (const element of layoutMetrics.overflowingElements as OverflowElement[]) {
    pageIssues.push({
      page: pagePath,
      viewport: viewport.name,
      type: "overflow",
      severity: "medium",
      message: `${element.selector} overflows the viewport.`,
      details: element,
    });
  }

  await context.close();
  return pageIssues;
}

function safeName(pagePath: string): string {
  const name = pagePath.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return name || "root";
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
