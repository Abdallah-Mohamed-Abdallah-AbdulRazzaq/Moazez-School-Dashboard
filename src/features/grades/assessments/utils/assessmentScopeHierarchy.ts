import type { ExamScopeType, ScopeEntityOption } from "../../shared/types";

type ScopeEntitiesByType = Record<ExamScopeType, ScopeEntityOption[]>;
type ScopeIds = Partial<Record<ExamScopeType, string>>;

const PARENT_SCOPE_TYPE: Partial<Record<ExamScopeType, ExamScopeType>> = {
  grade: "stage",
  section: "grade",
  classroom: "section",
};

export function getScopeHierarchyPath(
  scopeEntities: ScopeEntitiesByType,
  scopeType: ExamScopeType,
  scopeId: string,
): ScopeIds {
  const selectedIds: ScopeIds = {};
  let currentType: ExamScopeType | undefined = scopeType;
  let currentId = scopeId;

  while (currentType && currentType !== "school" && currentId) {
    selectedIds[currentType] = currentId;
    const parentType: ExamScopeType | undefined = PARENT_SCOPE_TYPE[currentType];
    const parentId = parentType
      ? scopeEntities[currentType].find((entity) => entity.id === currentId)?.parentId
      : undefined;
    currentType = parentType;
    currentId = parentId ?? "";
  }

  return selectedIds;
}

export function getHierarchyOptions(
  scopeEntities: ScopeEntitiesByType,
  scopeType: Exclude<ExamScopeType, "school">,
  selectedIds: ScopeIds,
): ScopeEntityOption[] {
  const parentType = PARENT_SCOPE_TYPE[scopeType];
  const parentId = parentType ? selectedIds[parentType] : undefined;
  if (parentType && !parentId) return [];
  return scopeEntities[scopeType].filter((entity) => !parentId || entity.parentId === parentId);
}
