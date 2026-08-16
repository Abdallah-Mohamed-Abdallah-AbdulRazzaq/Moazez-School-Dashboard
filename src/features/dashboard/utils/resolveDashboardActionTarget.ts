const dashboardActionRouteAliases: Record<string, string> = {
  "/students": "/students-guardians/students",
  "/homework/assignments": "/academics/homework",
  "/homework/submissions": "/academics/homework",
  "/grades/submissions": "/grades/gradebook",
  "/behavior/review": "/behavior/reviews",
  "/dashboard/activity-feed": "/dashboard/recent-activities",
  "/dashboard/light-mode-dropdown": "/dashboard",
};

export function resolveDashboardActionTarget(target: string): string {
  return dashboardActionRouteAliases[target] ?? target;
}
