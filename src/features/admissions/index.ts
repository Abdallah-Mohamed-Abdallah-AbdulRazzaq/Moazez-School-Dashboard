// Admissions Feature Module
// Organized by sub-features matching academics structure

// ============================================================================
// SHARED TYPES & ENUMS
// ============================================================================
export * from './types/enums';

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
export * from './shared';

// ============================================================================
// DASHBOARD
// ============================================================================
export * from './dashboard/components/charts';
export * from './dashboard/pages/AdmissionsDashboard';
export * from './dashboard/pages/AdmissionsDashboardShell';
export * from './dashboard/container/AdmissionsDashboardContainer';
export * from './dashboard/services/admissionsAnalytics';

// ============================================================================
// APPLICATIONS
// ============================================================================
export * from './applications/types';
export * from './applications/components/tabs';
export * from './applications/components/modals';
export * from './applications/pages/ApplicationsList';
export * from './applications/pages/ApplicationDetailsPage';
export * from './applications/utils/applicationsFilters';

// ============================================================================
// LEADS
// ============================================================================
export * from './leads/types';
export * from './leads/pages/LeadsList';
export * from './leads/services/leadsApiService';

// ============================================================================
// INTERVIEWS
// ============================================================================
export * from './interviews/types';
export * from './interviews/pages/InterviewsList';
export * from './interviews/pages/InterviewDetailsPage';

// ============================================================================
// TESTS
// ============================================================================
export * from './tests/types';
export * from './tests/pages/TestsList';
export * from './tests/pages/TestDetailsPage';

// ============================================================================
// DECISIONS
// ============================================================================
export * from './decisions/types';
export * from './decisions/pages/DecisionsList';

// ============================================================================
// ENROLLMENT
// ============================================================================
export * from './enrollment/types';
export * from './enrollment/pages/EnrollmentList';
