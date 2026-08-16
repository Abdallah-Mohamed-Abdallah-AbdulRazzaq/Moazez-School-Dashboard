import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  linkGuardianAccount,
  linkStudentAccount,
} from "@/features/students-guardians/services/accountLinkingService";

describe("student/guardian account linking endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiPost.mockReset().mockResolvedValue({});
  });

  it("posts student account linking payload to the Sprint 11 endpoint", async () => {
    await linkStudentAccount("student-1", {
      mode: "create",
      username: "student.one",
      contactEmail: "guardian@example.com",
      temporaryPasswordMode: "generate",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/students/student-1/account",
      {
        mode: "create",
        username: "student.one",
        contactEmail: "guardian@example.com",
        temporaryPasswordMode: "generate",
      },
    );
  });

  it("posts guardian account linking payload to the Sprint 11 endpoint", async () => {
    await linkGuardianAccount("guardian-1", {
      mode: "create",
      username: "guardian.one",
      contactEmail: "guardian@example.com",
      temporaryPasswordMode: "none",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/guardians/guardian-1/account",
      {
        mode: "create",
        username: "guardian.one",
        contactEmail: "guardian@example.com",
        temporaryPasswordMode: "none",
      },
    );
  });
});
