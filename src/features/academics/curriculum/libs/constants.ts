// Assignment Builder Constants

export const QUESTION_TYPES = {
  MCQ_SINGLE: "MCQ_SINGLE",
  MCQ_MULTI: "MCQ_MULTI",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_ANSWER",
  ESSAY: "ESSAY",
  FILL_IN_BLANK: "FILL_IN_BLANK",
  MATCHING: "MATCHING",
  MEDIA: "MEDIA",
} as const;

export const MIN_OPTIONS_COUNT = 2;
export const DEFAULT_QUESTION_POINTS = 1;
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

export const MOBILE_BREAKPOINT = "md";

export const LAYOUT_DIMENSIONS = {
  OUTLINE_WIDTH: "320px",
  SETTINGS_WIDTH: "384px", // w-96
  HEADER_HEIGHT: "73px",
} as const;

export const DEFAULT_NEW_QUESTION = {
  questionTextAr: "سؤال جديد",
  questionTextEn: "New question",
  questionType: QUESTION_TYPES.MCQ_SINGLE,
  points: DEFAULT_QUESTION_POINTS,
  options: [
    { id: `opt-${Date.now()}-1`, textAr: "الخيار الأول", textEn: "First option", isCorrect: true, order: 1 },
    { id: `opt-${Date.now()}-2`, textAr: "الخيار الثاني", textEn: "Second option", isCorrect: false, order: 2 },
  ],
};

export const ATTACHMENT_RESTRICTIONS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // Backend /files upload limit
  ALLOWED_TYPES: [
    "application/pdf",
    "audio/mp4",
    "audio/mpeg",
    "audio/webm",
    "image/jpeg",
    "image/png",
    "text/plain",
    "video/mp4",
    "video/webm",
  ].join(","),
  ALLOWED_TYPES_LABEL: "PDF, TXT, JPG, PNG, MP3, M4A, WebM, MP4",
} as const;
