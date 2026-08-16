// Teacher Directory — Type Barrel Exports

// Enums
export type {
  UserStatus,
  MembershipStatus,
  TeacherGender,
  TeacherEmploymentStatus,
  TeacherEmploymentType,
  TeacherWorkDay,
  PreferredDisplayLanguage,
  ProfileCompletenessFilter,
  TeacherCredentialStatus,
} from './enums';

// Response DTOs
export type {
  ApiErrorPayload,
  ErrorEnvelope,
  TeacherCredentialSummary,
  TeacherProfileCompletenessField,
  TeacherProfileCompleteness,
  TeacherDisplayName,
  TeacherDirectoryListItem,
  TeacherDirectoryDetail,
  Pagination,
  TeachersListResponse,
  AllocationSummary,
  EmploymentTransitionResult,
  TeacherEmploymentStatusResponse,
} from './responses';

// Request DTOs
export type {
  TeacherListQuery,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  ChangeTeacherEmploymentStatusRequest,
  RehireTeacherRequest,
} from './requests';

// Form models
export type {
  TeacherIdentityForm,
  TeacherProfileForm,
  TeacherScheduleForm,
  CreateTeacherFormState,
  EditTeacherFormState,
  EmploymentStatusForm,
  TeacherFormErrors,
} from './forms';
