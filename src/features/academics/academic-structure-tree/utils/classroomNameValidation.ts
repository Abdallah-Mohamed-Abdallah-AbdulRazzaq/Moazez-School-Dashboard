export type StructureNameType = "stage" | "grade" | "section" | "classroom";

export interface BilingualNameErrors {
  ar?: string;
  en?: string;
}

export function getClassroomNameWhitespaceErrors(
  type: StructureNameType,
  nameAr: string | undefined,
  nameEn: string | undefined,
  errorMessage: string,
): BilingualNameErrors {
  if (type !== "classroom") return {};

  return {
    ...(nameAr && /\s/.test(nameAr) ? { ar: errorMessage } : {}),
    ...(nameEn && /\s/.test(nameEn) ? { en: errorMessage } : {}),
  };
}
