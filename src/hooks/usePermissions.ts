/**
 * Permission management hook
 * Permissions resolve exclusively from the authenticated API session.
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { bottomItems, menuItems } from "@/config/navigation";

export type PermissionKey =
  | "dashboard.analytics.view"
  | "dashboard.alerts.view"
  | "dashboard.activity_feed.view"
  | "dashboard.command_center.view"
  | "dashboard.light_mode_dropdown.view"
  | "dashboard.modules.view"
  | "dashboard.summary.view"
  | "dashboard.todos.view"
  | "dashboard.todos.manage"
  | "dashboard.widgets.view"
  | "admissions.leads.view"
  | "admissions.leads.manage"
  | "admissions.applications.view"
  | "admissions.applications.manage"
  | "admissions.tests.view"
  | "admissions.tests.manage"
  | "admissions.interviews.view"
  | "admissions.interviews.manage"
  | "admissions.decisions.view"
  | "admissions.decisions.manage"
  | "admissions.documents.view"
  | "admissions.documents.manage"
  | "students.records.manage"
  | "students.guardians.view"
  | "students.guardians.manage"
  | "students.enrollments.manage"
  | "students.enrollments.view"
  | "students.documents.view"
  | "students.documents.manage"
  | "students.medical.view"
  | "students.medical.manage"
  | "students.notes.view"
  | "students.notes.manage"
  | "students.lifecycle.manage"
  | "students.records.view"
  | "teachers.records.view"
  | "teachers.records.manage"
  | "attendance.policies.view"
  | "attendance.policies.manage"
  | "attendance.sessions.view"
  | "attendance.sessions.manage"
  | "attendance.sessions.submit"
  | "attendance.entries.manage"
  | "attendance.absences.view"
  | "attendance.excuses.view"
  | "attendance.excuses.manage"
  | "attendance.excuses.review"
  | "attendance.reports.view"
  | "behavior.records.view"
  | "behavior.records.create"
  | "behavior.records.manage"
  | "behavior.records.review"
  | "behavior.points.view"
  | "behavior.categories.view"
  | "behavior.categories.manage"
  | "behavior.overview.view"
  | "settings.overview.view"
  | "settings.branding.view"
  | "settings.branding.manage"
  | "settings.users.view"
  | "settings.users.manage"
  | "settings.roles.view"
  | "settings.roles.manage"
  | "settings.permissions.view"
  | "settings.policies.view"
  | "settings.policies.manage"
  | "settings.email.connection.view"
  | "settings.email.connection.manage"
  | "settings.email.templates.view"
  | "settings.email.templates.manage"
  | "settings.email.deliveries.view"
  | "settings.email.deliveries.manage"
  | "settings.email.campaigns.view"
  | "settings.email.campaigns.manage"
  | "settings.email.credential_deliveries.view"
  | "settings.email.credential_deliveries.manage"
  | "settings.admissionsDocuments.view"
  | "settings.admissionsDocuments.manage"
  | "settings.templates.view"
  | "settings.templates.manage"
  | "settings.integrations.view"
  | "settings.integrations.configure"
  | "settings.security.view"
  | "settings.security.manage"
  | "settings.backup.view"
  | "settings.backup.manage"
  | "dismissal.settings.view"
  | "dismissal.settings.manage"
  | "dismissal.profile.view"
  | "dismissal.gates.view"
  | "dismissal.gates.manage"
  | "dismissal.staff.view"
  | "dismissal.staff.manage"
  | "dismissal.requests.view"
  | "dismissal.requests.manage"
  | "dismissal.requests.deliver"
  | "dismissal.requests.escalate"
  | "dismissal.requests.history.view"
  | "dismissal.notifications.view"
  | "dismissal.notifications.manage"
  | "academics.overview.view"
  | "academics.subjects.view"
  | "academics.subjects.manage"
  | "academics.structure.view"
  | "academics.structure.manage"
  | "academics.calendar.view"
  | "academics.calendar.manage"
  | "academics.timetable.view"
  | "academics.curriculum.view"
  | "academics.curriculum.manage"
  | "academics.lesson_plans.view"
  | "academics.lesson_plans.manage"
  | "files.uploads.manage"
  | "files.downloads.view"
  | "homework.assignments.view"
  | "homework.assignments.manage"
  | "homework.targets.view"
  | "homework.targets.manage"
  | "homework.submissions.view"
  | "grades.submissions.view"
  | "grades.submissions.submit"
  | "grades.submissions.review"
  | "grades.gradebook.view"
  | "grades.snapshots.view"
  | "grades.analytics.view"
  | "grades.assessments.view"
  | "grades.assessments.manage"
  | "grades.assessments.publish"
  | "grades.assessments.approve"
  | "grades.assessments.lock"
  | "grades.items.view"
  | "grades.items.manage"
  | "grades.questions.view"
  | "grades.questions.manage"
  | "grades.rules.view"
  | "grades.rules.manage"
  | "communication.admin.view"
  | "communication.admin.manage"
  | "communication.overview.view"
  | "communication.policies.view"
  | "communication.policies.manage"
  | "communication.announcements.view"
  | "communication.announcements.manage"
  | "communication.notifications.view"
  | "communication.notifications.manage"
  | "communication.conversations.view"
  | "communication.conversations.create"
  | "communication.conversations.manage"
  | "communication.messages.view"
  | "communication.messages.send"
  | "communication.messages.edit"
  | "communication.messages.delete"
  | "communication.messages.react"
  | "communication.messages.attachments.manage"
  | "communication.messages.report"
  | "communication.messages.moderate"
  | "communication.participants.manage"
  | "reinforcement.overview.view"
  | "reinforcement.templates.view"
  | "reinforcement.templates.manage"
  | "reinforcement.tasks.view"
  | "reinforcement.tasks.manage"
  | "reinforcement.submissions.view"
  | "reinforcement.submissions.submit"
  | "reinforcement.xp.view"
  | "reinforcement.xp.manage"
  | "reinforcement.reviews.view"
  | "reinforcement.reviews.manage"
  | "reinforcement.rewards.view"
  | "reinforcement.rewards.manage"
  | "reinforcement.rewards.redemptions.view"
  | "reinforcement.rewards.redemptions.request"
  | "reinforcement.rewards.redemptions.review"
  | "reinforcement.rewards.fulfill"
  | "reinforcement.hero.view"
  | "reinforcement.hero.manage"
  | "reinforcement.hero.badges.view"
  | "reinforcement.hero.badges.manage"
  | "reinforcement.hero.progress.view"
  | "reinforcement.hero.progress.manage"
  | "reinforcement.hero.missions.start"
  | "reinforcement.hero.missions.complete"
  | "reinforcement.hero.objectives.complete"
  | "school.support.view"
  | "school.support.send";

export const settingsNavigationPermissionByKey: Partial<
  Record<string, PermissionKey>
> = {
  "settings-overview": "settings.overview.view",
  "settings-branding": "settings.branding.view",
  "settings-users": "settings.users.view",
  "settings-login-identity": "settings.users.view",
  "settings-credentials": "settings.users.view",
  "settings-roles": "settings.roles.view",
  "settings-email-connection": "settings.email.connection.view",
  "settings-email-templates": "settings.email.templates.view",
  "settings-email-credential-deliveries":
    "settings.email.credential_deliveries.view",
  "settings-email-deliveries": "settings.email.deliveries.view",
  "settings-email-campaigns": "settings.email.campaigns.view",
  "settings-security": "settings.security.view",
};

export const reinforcementNavigationPermissionByKey: Partial<
  Record<string, PermissionKey>
> = {
  "reinforcement-overview": "reinforcement.overview.view",
  "reinforcement-templates": "reinforcement.templates.view",
  "reinforcement-tasks": "reinforcement.tasks.view",
  "reinforcement-reviews": "reinforcement.reviews.view",
  "reinforcement-rewards": "reinforcement.rewards.view",
  "reinforcement-xp-policies": "reinforcement.xp.view",
  "reinforcement-xp-ledger": "reinforcement.xp.view",
  "hero-journey": "reinforcement.hero.view",
  "hero-journey-missions": "reinforcement.hero.view",
};

const navigationKeysWithoutPermission = new Set(["system-health"]);

type NavigationItem = (typeof menuItems)[number];

export const navigationPermissionByKey: Partial<Record<string, PermissionKey>> =
  {
    ...settingsNavigationPermissionByKey,
    ...reinforcementNavigationPermissionByKey,
    "hero-journey": "reinforcement.hero.view",
    "dashboard-overview": "dashboard.summary.view",
    "dashboard-command-center": "dashboard.command_center.view",
    "dashboard-widgets": "dashboard.widgets.view",
    "communication-overview": "communication.overview.view",
    "communication-conversations": "communication.conversations.view",
    "communication-announcements": "communication.announcements.view",
    "communication-notifications": "communication.notifications.view",
    "communication-notification-deliveries": "communication.notifications.manage",
    "communication-safety": "communication.messages.moderate",
    "communication-settings": "communication.policies.view",
    "admissions-leads": "admissions.leads.view",
    "admissions-applications": "admissions.applications.view",
    "admissions-tests": "admissions.tests.view",
    "admissions-interviews": "admissions.interviews.view",
    "admissions-workflow-policy": "admissions.applications.view",
    "admissions-decisions": "admissions.decisions.view",
    "admissions-enrollment": "students.enrollments.view",
    "students-list": "students.records.view",
    "guardians-list": "students.guardians.view",
    teachers: "teachers.records.view",
    "profile-correction-requests": "students.records.view",
    "documents-center": "students.documents.view",
    "academics-overview": "academics.overview.view",
    "academics-structure": "academics.structure.view",
    "academics-rooms": "academics.structure.view",
    "academics-subjects": "academics.subjects.view",
    "academics-teacher-allocation": "academics.structure.view",
    "academics-timetable": "academics.timetable.view",
    "academics-calendar": "academics.calendar.view",
    "academics-curriculum": "academics.curriculum.view",
    "academics-lesson-plans": "academics.lesson_plans.view",
    "academics-homework": "homework.assignments.view",
    "grades-overview": "grades.analytics.view",
    "grades-assessments": "grades.assessments.view",
    "grades-gradebook": "grades.gradebook.view",
    "grades-rules": "grades.rules.view",
    "attendance-reports": "attendance.reports.view",
    "attendance-policies": "attendance.policies.view",
    "attendance-roll-call": "attendance.sessions.view",
    "attendance-absences": "attendance.absences.view",
    "attendance-late-early": "attendance.absences.view",
    "attendance-excuses": "attendance.excuses.view",
    "behavior-overview": "behavior.overview.view",
    "behavior-reviews": "behavior.records.view",
    "behavior-records": "behavior.records.view",
    "behavior-categories": "behavior.categories.view",
    "nedaa-settings": "dismissal.settings.view",
    "nedaa-operations": "dismissal.requests.view",
    "nedaa-gates": "dismissal.gates.view",
    "nedaa-staff-assignments": "dismissal.staff.view",
    "dashboard-analytics": "dashboard.analytics.view",
    "dashboard-recent-activities": "dashboard.activity_feed.view",
    help: "school.support.view",
  };

export function filterNavigationItemsByPermission<
  T extends { key: string; children?: T[] },
>(
  items: readonly T[],
  hasPermission: (permission: PermissionKey) => boolean,
): T[] {
  return items.flatMap((item) => {
    if (!item.children) {
      if (navigationKeysWithoutPermission.has(item.key)) return [item];

      const requiredPermission = navigationPermissionByKey[item.key];
      return requiredPermission && hasPermission(requiredPermission) ? [item] : [];
    }

    const visibleChildren = filterNavigationItemsByPermission(
      item.children,
      hasPermission,
    );
    return visibleChildren.length > 0 ? [{ ...item, children: visibleChildren }] : [];
  });
}

function getFirstNavigationHref(
  items: readonly NavigationItem[],
  isArabic: boolean,
): string | null {
  for (const item of items) {
    const childHref = item.children
      ? getFirstNavigationHref(item.children, isArabic)
      : null;
    if (childHref) return childHref;
    if (!item.children) return isArabic ? item.href_ar : item.href_en;
  }

  return null;
}

export function getDefaultAuthorizedNavigationPath(
  permissions: readonly string[],
  locale: string,
): string {
  const hasPermission = (permission: PermissionKey) =>
    permissions.includes(permission);
  const isArabic = locale === "ar";

  if (hasPermission("dashboard.summary.view")) {
    return isArabic ? "/ar/dashboard" : "/en/dashboard";
  }

  const visibleItems = filterNavigationItemsByPermission(
    [...menuItems, ...bottomItems],
    hasPermission,
  );

  return (
    getFirstNavigationHref(visibleItems, isArabic) ??
    `/${locale}/settings/health`
  );
}

export function usePermissions() {
  const { user, isLoading } = useAuth();

  const membershipPermissions = useMemo(
    () => (user?.activeMembership?.permissions ?? []) as PermissionKey[],
    [user],
  );

  const grantedPermissions = useMemo(
    () => new Set<PermissionKey>(membershipPermissions),
    [membershipPermissions],
  );

  const hasPermission = (key: PermissionKey): boolean =>
    grantedPermissions.has(key);
  const hasAnyPermission = (keys: PermissionKey[]): boolean =>
    keys.some((key) => grantedPermissions.has(key));
  const hasAllPermissions = (keys: PermissionKey[]): boolean =>
    keys.every((key) => grantedPermissions.has(key));

  return {
    role: user?.activeMembership?.roleKey ?? user?.userType ?? null,
    currentUser:
      user === null
        ? null
        : {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            roleId: user.activeMembership?.roleKey ?? user.userType,
          },
    grantedPermissions: Array.from(grantedPermissions),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    isPermissionsReady: !isLoading,
  };
}
