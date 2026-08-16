// Dashboard Feature Module
// School-wide overview and monitoring

// ============================================================================
// COMPONENTS
// ============================================================================
export * from './components/ActivitiesCard';
export * from './components/AttendanceCard';
export * from './components/ComprehensiveDashboard';
export * from './components/ExportModal';
export * from './components/FilterBar';
export * from './components/QuickActionPanel';

// Charts
export * from './components/charts/AbsenceReasonsChart';
export * from './components/charts/AcademicPerformanceCard';
export * from './components/charts/AttendanceTrendChart';
export * from './components/charts/StudentsPerGradeChart';

// Alerts
export * from './components/alerts/CriticalAlerts';

// Monitoring
export * from './components/monitoring/TodayMonitoring';

// ============================================================================
// PAGES
// ============================================================================
export * from './pages/SchoolDashboard';
export * from './pages/RecentActivitiesPage';
export * from './pages/DashboardAlertsPage';
export * from './views/SchoolDashboardView';

// ============================================================================
// CONTAINER
// ============================================================================
export * from './container/SchoolDashboardContainer';

// ============================================================================
// UTILS
// ============================================================================
export * from './utils/dashboardStatsCalculator';
export * from './mappers/dashboardViewMapper';
export * from './services/dashboardApiService';
export * from './types/dashboardApi.types';
