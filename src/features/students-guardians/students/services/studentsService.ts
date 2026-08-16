import type {
  CreateStudentNotePayload,
  EnrollmentTerm,
  RiskFlag,
  Student,
  StudentDocument,
  StudentEnrollment,
  StudentGuardian,
  StudentMedicalProfile,
  StudentNote,
  StudentTimelineEvent,
  UpdateStudentPayload,
} from "@/features/students-guardians/students/types";
import * as studentsApiService from "./studentsApiService";
import * as guardiansApiService from "@/features/students-guardians/guardians/services/guardiansApiService";
import * as studentDocumentsApiService from "@/features/students-guardians/documents/services/studentDocumentsApiService";
import * as medicalProfileApiService from "@/features/students-guardians/medical/services/medicalProfileApiService";
import * as studentNotesApiService from "@/features/students-guardians/notes/services/studentNotesApiService";
import {
  fetchCurrentEnrollment,
  fetchEnrollments,
} from "@/features/students-guardians/enrollments/services/enrollmentsApiService";

export type StudentWithEnrollmentContext = Student & {
  enrollment?: StudentEnrollment;
  currentTerm?: EnrollmentTerm;
  selectedTerm?: EnrollmentTerm;
  ytdPerformance?: {
    attendance: number;
    gradeAverage: number;
    riskFlags: RiskFlag[];
  };
  contextPerformance?: {
    attendance: number;
    gradeAverage: number;
    riskFlags: RiskFlag[];
  };
};

export async function fetchAllStudents(
  params?: studentsApiService.FetchStudentsParams,
): Promise<Student[]> {
  return studentsApiService.fetchStudents(params);
}

export async function fetchStudentById(
  id: string,
): Promise<Student | undefined> {
  return studentsApiService.fetchStudentById(id);
}

export async function createStudent(
  payload: studentsApiService.CreateStudentPayload,
): Promise<Student> {
  return studentsApiService.createStudent(payload);
}

export async function updateStudent(
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<Student> {
  return studentsApiService.updateStudent(studentId, payload);
}

export async function fetchStudentGuardians(
  studentId: string,
): Promise<StudentGuardian[]> {
  return guardiansApiService.fetchStudentGuardians(studentId);
}

export async function fetchPrimaryGuardian(
  studentId: string,
): Promise<StudentGuardian | undefined> {
  const guardians =
    await guardiansApiService.fetchPrimaryStudentGuardians(studentId);
  return guardians[0];
}

export async function fetchGuardianStudents(
  guardianId: string,
): Promise<Student[]> {
  return guardiansApiService.fetchGuardianStudents(guardianId);
}

export async function fetchAllGuardians(
  params?: guardiansApiService.FetchGuardiansParams,
): Promise<StudentGuardian[]> {
  return guardiansApiService.fetchGuardians(params);
}

export async function fetchGuardianById(
  guardianId: string,
): Promise<StudentGuardian | undefined> {
  return guardiansApiService.fetchGuardianById(guardianId);
}

export async function createGuardian(
  payload: guardiansApiService.GuardianPayload,
): Promise<StudentGuardian> {
  return guardiansApiService.createGuardian(payload);
}

export async function updateGuardian(
  guardianId: string,
  payload: guardiansApiService.GuardianPayload,
): Promise<StudentGuardian> {
  return guardiansApiService.updateGuardian(guardianId, payload);
}

export async function linkGuardianToStudent(
  studentId: string,
  payload: guardiansApiService.LinkGuardianPayload,
) {
  return guardiansApiService.linkGuardianToStudent(studentId, payload);
}

export async function unlinkGuardianFromStudent(
  studentId: string,
  guardianId: string,
): Promise<void> {
  return guardiansApiService.unlinkGuardianFromStudent(studentId, guardianId);
}

export async function updateStudentGuardianLink(
  studentId: string,
  guardianId: string,
  payload: guardiansApiService.UpdateStudentGuardianLinkPayload,
) {
  return guardiansApiService.updateStudentGuardianLink(
    studentId,
    guardianId,
    payload,
  );
}

export async function fetchStudentsWithEnrollment(): Promise<
  StudentWithEnrollmentContext[]
> {
  return fetchStudentsWithEnrollmentForContext();
}

export async function fetchStudentWithEnrollment(
  studentId: string,
  academicYearId?: string | null,
): Promise<StudentWithEnrollmentContext> {
  const student = await fetchStudentById(studentId);
  if (!student) {
    throw new Error("Student not found");
  }

  const enrollment = await fetchCurrentEnrollment({
    studentId,
    ...(academicYearId ? { academicYearId } : {}),
  });

  return {
    ...student,
    ...(enrollment ? { enrollment } : {}),
  };
}

export async function fetchStudentsWithEnrollmentForContext(
  academicYearId?: string | null,
): Promise<StudentWithEnrollmentContext[]> {
  const [students, enrollments] = await Promise.all([
    studentsApiService.fetchStudents(),
    fetchEnrollments({
      ...(academicYearId ? { academicYearId } : {}),
      status: "active",
    }),
  ]);
  const enrollmentByStudentId = new Map(
    enrollments.map((enrollment) => [enrollment.studentId, enrollment]),
  );

  return students.map((student) => ({
    ...student,
    enrollment: enrollmentByStudentId.get(student.id),
  }));
}

export async function fetchStudentDocuments(
  studentId: string,
): Promise<StudentDocument[]> {
  return studentDocumentsApiService.fetchStudentDocuments(studentId);
}

export async function fetchMissingStudentDocuments(
  studentId: string,
): Promise<StudentDocument[]> {
  return studentDocumentsApiService.fetchMissingStudentDocuments(studentId);
}

export async function createStudentDocument(
  studentId: string,
  payload: studentDocumentsApiService.CreateStudentDocumentPayload,
): Promise<StudentDocument> {
  return studentDocumentsApiService.createStudentDocument(studentId, payload);
}

export async function importStudentDocumentsFromApplication(
  studentId: string,
  payload: studentDocumentsApiService.ImportStudentDocumentsFromApplicationPayload,
): Promise<studentDocumentsApiService.ImportStudentDocumentsFromApplicationResponse> {
  return studentDocumentsApiService.importStudentDocumentsFromApplication(
    studentId,
    payload,
  );
}

export async function deleteStudentDocument(
  studentDocumentId: string,
): Promise<studentDocumentsApiService.DeleteStudentDocumentResponse> {
  return studentDocumentsApiService.deleteStudentDocument(studentDocumentId);
}

export async function fetchStudentMedicalProfile(
  studentId: string,
): Promise<StudentMedicalProfile | null> {
  return medicalProfileApiService.fetchMedicalProfile(studentId);
}

export async function upsertStudentMedicalProfile(
  studentId: string,
  payload: Partial<StudentMedicalProfile>,
): Promise<StudentMedicalProfile> {
  return medicalProfileApiService.upsertMedicalProfile(studentId, payload);
}

export async function fetchStudentNotes(
  studentId: string,
): Promise<StudentNote[]> {
  return studentNotesApiService.fetchStudentNotes(studentId);
}

export async function createStudentNote(
  studentId: string,
  payload: CreateStudentNotePayload,
): Promise<StudentNote> {
  return studentNotesApiService.createStudentNote(studentId, payload);
}

export async function updateStudentNote(
  studentId: string,
  studentNoteId: string,
  payload: Partial<CreateStudentNotePayload>,
): Promise<StudentNote> {
  return studentNotesApiService.updateStudentNote(
    studentId,
    studentNoteId,
    payload,
  );
}

export async function fetchStudentTimeline(
  studentId: string,
): Promise<StudentTimelineEvent[]> {
  return studentsApiService.fetchStudentTimeline(studentId);
}
