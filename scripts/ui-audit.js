import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadDotEnv } from "./load-env.js";

loadDotEnv();

const playwrightCli = path.join(
  process.cwd(),
  "node_modules",
  "playwright",
  "cli.js",
);

async function main() {
  const config = readAuditConfig();

  if (config.auth?.enabled) {
    const hasCredentials = Boolean(
      process.env[config.auth.credentials.emailEnv] &&
      process.env[config.auth.credentials.passwordEnv],
    );
    const hasStorageState = existsSync(config.auth.storageStatePath);

    if (hasCredentials) {
      await run("Playwright auth setup", [
        "test",
        "tests/auth.setup.ts",
        "--config=playwright.ui-audit.config.ts",
      ]);
    } else if (!hasStorageState) {
      throw new Error(
        `Missing UI audit auth state at ${config.auth.storageStatePath}. Set ${config.auth.credentials.emailEnv} and ${config.auth.credentials.passwordEnv} before running npm run skill:uiux, or run npm run auth:manual first.`,
      );
    } else if (isStoredAccessTokenExpired(config.auth.storageStatePath)) {
      throw new Error(
        `UI audit auth state at ${config.auth.storageStatePath} has an expired access token. Set ${config.auth.credentials.emailEnv} and ${config.auth.credentials.passwordEnv} before running npm run skill:uiux, or run npm run auth:manual to refresh the saved login.`,
      );
    } else {
      console.log(`\n> Reusing auth state at ${config.auth.storageStatePath}`);
    }
  }

  await run("Playwright UI audit", [
    "test",
    "tests/ui-audit.spec.ts",
    "--config=playwright.ui-audit.config.ts",
  ]);
  await run("Playwright accessibility audit", [
    "test",
    "tests/accessibility-audit.spec.ts",
    "--config=playwright.ui-audit.config.ts",
  ]);
  await run("Build AI review prompt", [
    path.join("scripts", "build-ui-audit-prompt.js"),
  ], process.execPath);
}

function readAuditConfig() {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "ui-audit.config.json"), "utf8"),
  );
}

function isStoredAccessTokenExpired(storageStatePath) {
  const state = JSON.parse(readFileSync(storageStatePath, "utf8"));
  const localStorageToken = state.origins
    ?.flatMap((origin) => origin.localStorage || [])
    .find((item) => item.name === "moazez_access_token")?.value;
  const cookieToken = state.cookies?.find(
    (cookie) => cookie.name === "moazez_access_token",
  )?.value;
  const accessToken = localStorageToken || cookieToken;

  if (!accessToken) {
    return false;
  }

  const expiresAt = getJwtExpiryMs(accessToken);
  return Boolean(expiresAt && expiresAt <= Date.now());
}

function getJwtExpiryMs(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function run(label, args, command = process.execPath) {
  console.log(`\n> ${label}`);

  const commandArgs = command === process.execPath && args[0] === "test"
    ? [playwrightCli, ...args]
    : args;

  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}.`));
    });
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
