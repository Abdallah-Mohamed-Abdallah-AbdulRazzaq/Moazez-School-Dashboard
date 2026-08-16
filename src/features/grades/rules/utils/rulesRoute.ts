export function findRuleForEditor<T extends { id: string }>(rules: T[], ruleId?: string): T | null {
  return rules.find((rule) => rule.id === ruleId) ?? null;
}

export function buildRulesLocation(pathname: string, query: string): string {
  return query ? `${pathname}?${query}` : pathname;
}
