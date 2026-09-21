export function applyScopedClassroomName<T extends { classroomName?: string }>(
  rows: T[],
  classroomName: string | undefined,
): T[] {
  if (!classroomName) return rows;
  return rows.map((row) => row.classroomName ? row : { ...row, classroomName });
}

export function hasClassroomNames(rows: Array<{ classroomName?: string }>): boolean {
  return rows.some((row) => Boolean(row.classroomName));
}
