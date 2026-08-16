import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadDotEnv } from "./load-env.js";

loadDotEnv();

const config = JSON.parse(
  readFileSync(path.join(process.cwd(), "ui-audit.config.json"), "utf8"),
);
const storageStatePath = config.auth.storageStatePath;
const loginUrl = new URL(
  config.auth.loginUrl,
  process.env.UI_AUDIT_BASE_URL || config.baseUrl,
).toString();
const playwrightCli = path.join(
  process.cwd(),
  "node_modules",
  "playwright",
  "cli.js",
);

mkdirSync(path.dirname(storageStatePath), { recursive: true });

const child = spawn(
  process.execPath,
  [
    playwrightCli,
    "codegen",
    loginUrl,
    `--save-storage=${storageStatePath}`,
  ],
  {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: "inherit",
  },
);

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
