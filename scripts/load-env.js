import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function loadDotEnv(fileName = ".env") {
  const envPath = path.join(process.cwd(), fileName);
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = unquoteEnvValue(rawValue);
  }
}

function unquoteEnvValue(value) {
  const quote = value[0];
  if (
    (quote === '"' || quote === "'") &&
    value[value.length - 1] === quote
  ) {
    return value.slice(1, -1);
  }

  return value;
}
