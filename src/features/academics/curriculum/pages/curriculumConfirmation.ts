export type CurriculumConfirmationAction = "archive" | "delete";

export function curriculumConfirmation(action: CurriculumConfirmationAction) {
  if (action === "archive") {
    return {
      titleKey: "actions.archive_curriculum" as const,
      descriptionKey: "actions.archive_confirm" as const,
      confirmLabelKey: "actions.archive_curriculum" as const,
      severity: "warning" as const,
    };
  }

  return {
    titleKey: "actions.delete_curriculum" as const,
    descriptionKey: "actions.delete_confirm" as const,
    confirmLabelKey: "actions.delete_curriculum" as const,
    severity: "danger" as const,
  };
}
