import { describe, expect, it } from "vitest";
import { normalizeProfileCorrectionRequestDetail } from "@/features/students-guardians/profile-correction-requests/utils/profileCorrectionRequestMappers";

describe("profileCorrectionRequestMappers", () => {
  it("normalizes the staff response DTO returned by the backend", () => {
    const detail = normalizeProfileCorrectionRequestDetail({
      id: "request-1",
      status: "PENDING",
      requestedChanges: {
        firstName: "Ahmed",
        studentPhone: "5551",
      },
      currentSnapshot: {
        firstName: "Ahmad",
        studentPhone: "1111",
      },
      reason: "Correct my profile",
      reviewerNote: null,
      submittedAt: "2026-07-14T10:00:00.000Z",
      resolvedAt: null,
      cancelledAt: null,
      student: {
        studentId: "student-1",
        displayName: "Ahmed Mostafa",
        studentNumber: "ST-100",
        firstName: "Ahmed",
        lastName: "Mostafa",
        status: "Active",
      },
    });

    expect(detail).toMatchObject({
      id: "request-1",
      studentId: "student-1",
      studentName: "Ahmed Mostafa",
      studentNumber: "ST-100",
      status: "PENDING",
      requestedAt: "2026-07-14T10:00:00.000Z",
      reason: "Correct my profile",
      changeCount: 2,
      currentSnapshot: {
        firstName: "Ahmad",
        studentPhone: "1111",
      },
      changes: [
        {
          field: "firstName",
          label: "firstName",
          currentValue: "Ahmad",
          requestedValue: "Ahmed",
        },
        {
          field: "studentPhone",
          label: "studentPhone",
          currentValue: "1111",
          requestedValue: "5551",
        },
      ],
    });
    expect(detail.reviewedAt).toBeUndefined();
    expect(detail.cancelledAt).toBeUndefined();
    expect(detail.reviewerNote).toBeUndefined();
  });

  it("normalizes explicit current vs requested changes", () => {
    expect(
      normalizeProfileCorrectionRequestDetail({
        id: "request-1",
        studentId: "student-1",
        studentName: "Student One",
        status: "PENDING",
        changes: [
          {
            field: "firstName",
            label: "First name",
            currentValue: "Old",
            requestedValue: "New",
          },
        ],
      }),
    ).toMatchObject({
      id: "request-1",
      studentId: "student-1",
      studentName: "Student One",
      status: "PENDING",
      changeCount: 1,
      changes: [
        {
          field: "firstName",
          label: "First name",
          currentValue: "Old",
          requestedValue: "New",
        },
      ],
    });
  });

  it("normalizes current/requested object maps into comparison rows", () => {
    const detail = normalizeProfileCorrectionRequestDetail({
      requestId: "request-1",
      student_id: "student-1",
      currentValues: {
        studentPhone: "111",
      },
      requestedValues: {
        studentPhone: "222",
      },
    });

    expect(detail.changes).toEqual([
      {
        field: "studentPhone",
        label: "studentPhone",
        currentValue: "111",
        requestedValue: "222",
      },
    ]);
  });

  it("uses an em dash for missing comparison values", () => {
    const detail = normalizeProfileCorrectionRequestDetail({
      id: "request-1",
      requestedChanges: { city: "Cairo" },
      currentSnapshot: {},
    });

    expect(detail.changes[0].currentValue).toBe("—");
  });
});
