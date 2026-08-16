import { spawn } from "node:child_process";
import path from "node:path";
import { loadDotEnv } from "./load-env.js";

loadDotEnv();

const playwrightCli = path.join(
  process.cwd(),
  "node_modules",
  "playwright",
  "cli.js",
);

const child = spawn(
  process.execPath,
  [
    playwrightCli,
    "test",
    "tests/auth.setup.ts",
    "--config=playwright.ui-audit.config.ts",
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
