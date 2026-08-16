import { describe, expect, it } from "vitest";
import type {
  CreateXpPolicyPayload,
  ManualXpGrantPayload,
  PatchXpPolicyPayload,
} from "@/features/reinforcement/types";
import {
  mapXpPolicyResponse,
  serializeCreateXpPolicyPayload,
  serializeManualXpGrantPayload,
  serializePatchXpPolicyPayload,
} from "@/features/reinforcement/services/reinforcementXpService";

describe("reinforcement XP payload contracts", () => {
  it("keeps XP policy create and patch payloads aligned with Sprint 5A", () => {
    const createPayload: CreateXpPolicyPayload = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "classroom",
      scopeId: "classroom-1",
      dailyCap: 20,
      weeklyCap: 100,
      cooldownMinutes: 30,
      allowedReasons: ["helpful", "leadership"],
      startsAt: "2026-05-14T00:00:00.000Z",
      endsAt: "2026-06-14T00:00:00.000Z",
      isActive: true,
    };
    const patchPayload: PatchXpPolicyPayload = {
      academicYearId: "year-2",
      termId: "term-2",
      scopeType: "section",
      scopeId: "section-1",
      dailyCap: 25,
      weeklyCap: 125,
      cooldownMinutes: 15,
      allowedReasons: ["improvement"],
      startsAt: "2026-05-15T00:00:00.000Z",
      endsAt: "2026-06-15T00:00:00.000Z",
      isActive: false,
    };

    expect(createPayload).toMatchObject({
      scopeType: "classroom",
      dailyCap: 20,
      allowedReasons: ["helpful", "leadership"],
    });
    expect(serializeCreateXpPolicyPayload(createPayload)).not.toHaveProperty(
      "yearId",
    );
    expect(patchPayload).toEqual({
      academicYearId: "year-2",
      termId: "term-2",
      scopeType: "section",
      scopeId: "section-1",
      dailyCap: 25,
      weeklyCap: 125,
      cooldownMinutes: 15,
      allowedReasons: ["improvement"],
      startsAt: "2026-05-15T00:00:00.000Z",
      endsAt: "2026-06-15T00:00:00.000Z",
      isActive: false,
    });
  });

  it("maps the backend XP policy response contract", () => {
    expect(
      mapXpPolicyResponse({
        id: null,
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "section",
        scopeKey: "section-1",
        dailyCap: null,
        weeklyCap: 1000,
        cooldownMinutes: null,
        allowedReasons: [" helpful ", 7, "", "leadership"],
        startsAt: null,
        endsAt: null,
        isActive: true,
        isDefault: true,
        createdAt: null,
        updatedAt: null,
      }),
    ).toEqual({
      id: null,
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "section",
      scopeKey: "section-1",
      dailyCap: null,
      weeklyCap: 1000,
      cooldownMinutes: null,
      allowedReasons: ["helpful", "leadership"],
      startsAt: null,
      endsAt: null,
      isActive: true,
      isDefault: true,
      createdAt: null,
      updatedAt: null,
    });
  });

  it.each([null, { reason: "helpful" }, "helpful"]) (
    "normalizes unsupported allowedReasons value %j to an empty list",
    (allowedReasons) => {
      expect(
        mapXpPolicyResponse({
          id: "policy-1",
          academicYearId: "year-1",
          termId: "term-1",
          scopeType: "school",
          scopeKey: "school",
          dailyCap: 10,
          weeklyCap: 50,
          cooldownMinutes: 5,
          allowedReasons,
          startsAt: null,
          endsAt: null,
          isActive: true,
          isDefault: false,
          createdAt: null,
          updatedAt: null,
        }).allowedReasons,
      ).toEqual([]);
    },
  );

  it("serializes only backend-supported patch fields and preserves null clears", () => {
    expect(
      serializePatchXpPolicyPayload({
        academicYearId: " year-1 ",
        termId: " term-1 ",
        scopeType: "section",
        scopeId: " section-1 ",
        dailyCap: null,
        weeklyCap: 120,
        cooldownMinutes: 0,
        allowedReasons: [" helpful ", ""],
        startsAt: null,
        endsAt: "2026-06-14T00:00:00.000Z",
        isActive: false,
      }),
    ).toEqual({
      dailyCap: null,
      weeklyCap: 120,
      cooldownMinutes: 0,
      allowedReasons: ["helpful"],
      startsAt: null,
      endsAt: "2026-06-14T00:00:00.000Z",
      isActive: false,
    });
  });

  it("omits immutable academic and scope fields from XP policy patch payloads", () => {
    expect(
      serializePatchXpPolicyPayload({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "section",
        scopeId: "section-1",
        weeklyCap: 2000,
      }),
    ).toEqual({
      weeklyCap: 2000,
    });
  });

  it("requires student and enrollment identifiers for manual XP grants", () => {
    const payload: ManualXpGrantPayload = {
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      enrollmentId: "enrollment-1",
      amount: 10,
      reason: "leadership",
      reasonAr: "قيادة",
      sourceId: "teacher-1",
      dedupeKey: "manual-student-1-001",
    };

    expect(payload.studentId).toBe("student-1");
    expect(payload.enrollmentId).toBe("enrollment-1");
    expect(payload.amount).toBe(10);
    expect(serializeManualXpGrantPayload(payload)).not.toHaveProperty("yearId");
    expect(
      serializeManualXpGrantPayload({
        termId: "term-1",
        studentId: "student-1",
        enrollmentId: null,
        amount: 10,
        reason: "leadership",
      }),
    ).toMatchObject({ termId: "term-1", enrollmentId: null });
    expect(
      serializeManualXpGrantPayload({
        termId: "term-1",
        studentId: "student-1",
        amount: 10,
        reason: "leadership",
      }),
    ).not.toHaveProperty("enrollmentId");
  });
});
