import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const reportDir = path.join(process.cwd(), "ui-audit-report");
const screenshotsDir = path.join(reportDir, "screenshots");
const promptPath = path.join(reportDir, "ai-review-prompt.md");

async function main() {
  await mkdir(reportDir, { recursive: true });

  const uiIssues = await readJsonReport("ui-issues.json");
  const accessibilityIssues = await readJsonReport("accessibility-issues.json");
  const screenshots = await listScreenshots();

  const markdown = [
    "# UI/UX Audit Review Packet",
    "",
    "## Role",
    "",
    "Senior UI/UX Designer + Frontend QA Engineer + Accessibility Reviewer",
    "",
    "## Screenshots",
    "",
    ...screenshots.map((screenshot) => `- [${screenshot}](screenshots/${screenshot})`),
    screenshots.length ? "" : "_No screenshots found._",
    "",
    "## UI / Responsive Issues JSON",
    "",
    "```json",
    JSON.stringify(uiIssues, null, 2),
    "```",
    "",
    "## Accessibility Issues JSON",
    "",
    "```json",
    JSON.stringify(accessibilityIssues, null, 2),
    "```",
    "",
    "## Review Checklist",
    "",
    "- visual hierarchy",
    "- spacing consistency",
    "- alignment",
    "- typography consistency",
    "- color consistency",
    "- component consistency",
    "- responsive behavior",
    "- overflow issues",
    "- accessibility",
    "- keyboard navigation",
    "- empty/loading/error states",
    "- confusing CTAs",
    "- forms UX",
    "",
    "## Required Output Format",
    "",
    "For each issue, respond with:",
    "",
    "- Issue",
    "- Page",
    "- Viewport",
    "- Severity: High / Medium / Low",
    "- Why it matters",
    "- Exact frontend fix",
    "- Suggested component/CSS/Tailwind change",
    "",
  ].join("\n");

  await writeFile(promptPath, markdown);
  console.log(`Wrote ${path.relative(process.cwd(), promptPath)}`);
}

async function readJsonReport(fileName) {
  const reportPath = path.join(reportDir, fileName);
  if (!existsSync(reportPath)) {
    return { missing: true, fileName, issues: [] };
  }

  return JSON.parse(await readFile(reportPath, "utf8"));
}

async function listScreenshots() {
  if (!existsSync(screenshotsDir)) {
    return [];
  }

  const entries = await readdir(screenshotsDir);
  return entries.filter((entry) => /\.(png|jpe?g|webp)$/i.test(entry)).sort();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
