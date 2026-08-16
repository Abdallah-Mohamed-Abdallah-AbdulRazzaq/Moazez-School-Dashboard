import { Assignment, AssignmentQuestion, AssignmentAttachment } from "@/features/academics/curriculum/services/curriculumService";

// Builder-specific types
export interface AssignmentBuilderState {
  assignment: Assignment | null;
  questions: AssignmentQuestion[];
  attachments: AssignmentAttachment[];
  selectedQuestionId: string | null;
  loading: boolean;
  saving: boolean;
  isReadOnly: boolean;
}

export interface ValidationErrors {
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  maxScore?: string;
  expectedTimeMinutes?: string;
  dueDate?: string;
  questions?: Record<string, QuestionValidationError>;
  general?: string[];
}

export interface QuestionValidationError {
  textAr?: string;
  textEn?: string;
  points?: string;
  options?: string;
  correctAnswer?: string;
  acceptedAnswers?: string;
  matchingPairs?: string;
  media?: string;
  general?: string;
  instructions?: string;
  expectedAnswer?: string;
}

export interface PointsSummary {
  maxScore: number;
  totalPoints: number;
  difference: number;
  isMatch: boolean;
}

export interface AssignmentMutations {
  updateAssignment: (updates: Partial<Assignment>) => Promise<void>;
  addQuestion: () => Promise<void>;
  updateQuestion: (questionId: string, updates: Partial<AssignmentQuestion>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorderQuestions: (questionIds: string[]) => Promise<void>;
  autoDistributePoints: () => Promise<void>;
  uploadAttachment: (file: File) => Promise<void>;
  addLinkAttachment: (title: string, url: string) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  publishToggle: () => Promise<void>;
  resetAssignment: () => Promise<void>;
}

export type QuestionType =
  | "MCQ_SINGLE"
  | "MCQ_MULTI"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_IN_BLANK"
  | "MATCHING"
  | "MEDIA";

export interface QuestionOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
  order: number;
}

// Component Props Types
export interface BuilderHeaderProps {
  title: string;
  isPublished: boolean;
  isReadOnly: boolean;
  isDirty: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onReset: () => void;
  onDelete: () => void;
}

export interface QuestionsOutlineProps {
  questions: AssignmentQuestion[];
  selectedQuestionId: string | null;
  isReadOnly: boolean;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
  onDeleteQuestion: (questionId: string) => void;
}

export interface AssignmentSettingsPanelProps {
  assignment: Assignment;
  isReadOnly: boolean;
  validationErrors: ValidationErrors;
  pointsSummary: PointsSummary;
  onUpdate: (updates: Partial<Assignment>) => void;
  onAutoDistribute: () => void;
}

export interface AttachmentsPanelProps {
  attachments: AssignmentAttachment[];
  isReadOnly: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onAddLink: (title: string, url: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => void;
}

export interface QuestionEditorProps {
  question: AssignmentQuestion;
  isReadOnly: boolean;
  validationErrors?: QuestionValidationError;
  onUpdate: (updates: Partial<AssignmentQuestion>) => void;
}

export interface PointsSummaryProps {
  summary: PointsSummary;
  onAutoDistribute: () => void;
  isReadOnly: boolean;
}
