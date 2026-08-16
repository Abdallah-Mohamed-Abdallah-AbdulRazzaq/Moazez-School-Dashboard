import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const admissionsRoot = path.resolve("src/features/admissions");

describe("Applicant Portal endpoint ownership", () => {
  it("keeps applicant-owned request endpoints out of Admissions production code", () => {
    const sourceFiles = readdirSync(admissionsRoot, { recursive: true })
      .map(String)
      .filter(
        (filePath) =>
          /\.(ts|tsx)$/.test(filePath) && !filePath.includes("__tests__"),
      );

    const endpointReferences = sourceFiles.filter((filePath) =>
      readFileSync(path.join(admissionsRoot, filePath), "utf8").includes(
        "/applicant-portal/requests",
      ),
    );

    expect(endpointReferences).toEqual([]);
  });
});
