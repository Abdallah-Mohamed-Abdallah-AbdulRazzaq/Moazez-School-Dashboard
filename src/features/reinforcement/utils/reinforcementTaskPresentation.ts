import type {
  ReinforcementFilterOptions,
  ReinforcementNamedOption,
  ReinforcementTaskTarget,
  ReinforcementTargetScope,
} from "../types";

type ReinforcementLocale = "ar" | "en";

const optionCollections: Record<
  Exclude<ReinforcementTargetScope, "school">,
  keyof ReinforcementFilterOptions
> = {
  stage: "stages",
  grade: "grades",
  section: "sections",
  classroom: "classrooms",
  student: "students",
};

const optionId = (option: ReinforcementNamedOption): string =>
  option.studentId || option.value || option.id;

const isNamedOption = (value: unknown): value is ReinforcementNamedOption =>
  Boolean(value) &&
  typeof value === "object" &&
  typeof (value as { id?: unknown }).id === "string";

const localizedOptionName = (
  option: ReinforcementNamedOption,
  locale: ReinforcementLocale,
): string | undefined => {
  const preferred =
    locale === "ar"
      ? option.nameAr || option.nameEn
      : option.nameEn || option.name;
  const fallback = option.name || option.nameAr;
  const studentName = [option.firstName, option.lastName]
    .filter(Boolean)
    .join(" ");

  return preferred || fallback || studentName || undefined;
};

export function getReinforcementTaskTargetLabel(
  target: ReinforcementTaskTarget,
  options: ReinforcementFilterOptions,
  locale: ReinforcementLocale,
): string {
  const scopedOption = options.scopeTargets?.[target.scopeType]?.find(
    (option) => option.value === target.scopeKey,
  );
  if (scopedOption) {
    return (
      (locale === "ar"
        ? scopedOption.nameAr || scopedOption.nameEn
        : scopedOption.nameEn || scopedOption.nameAr) || target.scopeKey
    );
  }

  if (target.scopeType === "school") {
    return locale === "ar" ? "المدرسة بالكامل" : "Whole school";
  }

  const collection = options[optionCollections[target.scopeType]];
  const option = (Array.isArray(collection) ? collection : [])
    .filter(isNamedOption)
    .find((item) => optionId(item) === target.scopeKey);
  return option ? localizedOptionName(option, locale) || target.scopeKey : target.scopeKey;
}
