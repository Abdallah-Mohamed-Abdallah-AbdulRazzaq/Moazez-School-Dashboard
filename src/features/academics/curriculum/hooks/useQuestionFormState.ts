import { useCallback, useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  AssignmentQuestion,
  MatchingPair,
  QuestionOption,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  sanitizeAnswerList,
  sanitizeMatchingPairs,
} from "@/features/academics/curriculum/utils/validation";

interface UseQuestionFormStateOptions {
  question?: AssignmentQuestion | null;
  isOpen?: boolean;
  resetKey?: string | null;
  onChange?: (updates: Partial<AssignmentQuestion>) => void;
}

interface UseQuestionFormStateReturn {
  questionTextAr: string;
  questionTextEn: string;
  questionType: AssignmentQuestion["questionType"];
  points: number;
  options: QuestionOption[];
  correctAnswer: boolean;
  sampleAnswerAr: string;
  sampleAnswerEn: string;
  acceptedAnswersAr: string[];
  acceptedAnswersEn: string[];
  matchingPairs: MatchingPair[];
  mediaMode: "FILE" | "LINK";
  mediaTitle: string;
  mediaUrl: string;
  mediaFileName: string;
  mediaMimeType: string;
  mediaSize?: number;
  setQuestionText: (value: { ar: string; en: string }) => void;
  setPointsValue: (value: number) => void;
  handleTypeChange: (newType: AssignmentQuestion["questionType"]) => void;
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOptionText: (id: string, ar: string, en: string) => void;
  updateOptionCorrect: (id: string, checked: boolean) => void;
  moveOptionUp: (id: string) => void;
  moveOptionDown: (id: string) => void;
  reorderOptions: (activeId: string, overId: string) => void;
  setTrueFalseAnswer: (value: boolean) => void;
  setSampleAnswerArValue: (value: string) => void;
  setSampleAnswerEnValue: (value: string) => void;
  setAcceptedAnswersArValue: (value: string[]) => void;
  setAcceptedAnswersEnValue: (value: string[]) => void;
  addMatchingPair: () => void;
  updateMatchingPair: (id: string, updates: Partial<MatchingPair>) => void;
  removeMatchingPair: (id: string) => void;
  moveMatchingPairUp: (id: string) => void;
  moveMatchingPairDown: (id: string) => void;
  setMediaModeValue: (value: "FILE" | "LINK") => void;
  setMediaTitleValue: (value: string) => void;
  setMediaUrlValue: (value: string) => void;
  setMediaFileValue: (file: File | null) => void;
  clearMedia: () => void;
  buildPayload: () => Partial<AssignmentQuestion>;
  resetFromQuestion: () => void;
}

function createDefaultOptions(): QuestionOption[] {
  return [
    { id: `opt-${Date.now()}-1`, textAr: "", textEn: "", isCorrect: false, order: 1 },
    { id: `opt-${Date.now()}-2`, textAr: "", textEn: "", isCorrect: false, order: 2 },
  ];
}

function createMatchingPair(order: number): MatchingPair {
  return {
    id: `pair-${Date.now()}-${Math.random()}`,
    promptAr: "",
    promptEn: "",
    matchAr: "",
    matchEn: "",
    order,
  };
}

function createDefaultMatchingPairs(): MatchingPair[] {
  return [createMatchingPair(1), createMatchingPair(2)];
}

export function useQuestionFormState({
  question,
  isOpen = true,
  resetKey,
  onChange,
}: UseQuestionFormStateOptions): UseQuestionFormStateReturn {
  const [questionTextAr, setQuestionTextAr] = useState("");
  const [questionTextEn, setQuestionTextEn] = useState("");
  const [questionType, setQuestionType] =
    useState<AssignmentQuestion["questionType"]>("MCQ_SINGLE");
  const [points, setPoints] = useState<number>(1);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(true);
  const [sampleAnswerAr, setSampleAnswerAr] = useState("");
  const [sampleAnswerEn, setSampleAnswerEn] = useState("");
  const [acceptedAnswersAr, setAcceptedAnswersAr] = useState<string[]>([]);
  const [acceptedAnswersEn, setAcceptedAnswersEn] = useState<string[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([]);
  const [mediaMode, setMediaMode] = useState<"FILE" | "LINK">("LINK");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFileName, setMediaFileName] = useState("");
  const [mediaMimeType, setMediaMimeType] = useState("");
  const [mediaSize, setMediaSize] = useState<number | undefined>(undefined);

  const emitChange = useCallback(
    (overrides: Partial<AssignmentQuestion>) => {
      if (!onChange) {
        return;
      }

      const nextQuestionTextAr = overrides.questionTextAr ?? questionTextAr;
      const nextQuestionTextEn = overrides.questionTextEn ?? questionTextEn;
      const nextQuestionType = overrides.questionType ?? questionType;
      const nextPoints = overrides.points ?? points;
      const nextOptions = overrides.options ?? options;
      const nextCorrectAnswer = overrides.correctAnswer ?? correctAnswer;
      const hasSampleAnswerArOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "sampleAnswerAr"
      );
      const hasSampleAnswerEnOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "sampleAnswerEn"
      );
      const nextSampleAnswerAr =
        hasSampleAnswerArOverride ? overrides.sampleAnswerAr : sampleAnswerAr;
      const nextSampleAnswerEn =
        hasSampleAnswerEnOverride ? overrides.sampleAnswerEn : sampleAnswerEn;
      const hasAcceptedAnswersArOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "acceptedAnswersAr"
      );
      const hasAcceptedAnswersEnOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "acceptedAnswersEn"
      );
      const hasMatchingPairsOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "matchingPairs"
      );
      const hasMediaModeOverride = Object.prototype.hasOwnProperty.call(overrides, "mediaMode");
      const hasMediaTitleOverride = Object.prototype.hasOwnProperty.call(overrides, "mediaTitle");
      const hasMediaUrlOverride = Object.prototype.hasOwnProperty.call(overrides, "mediaUrl");
      const hasMediaFileNameOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "mediaFileName"
      );
      const hasMediaMimeTypeOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "mediaMimeType"
      );
      const hasMediaSizeOverride = Object.prototype.hasOwnProperty.call(overrides, "mediaSize");
      const nextAcceptedAnswersAr = hasAcceptedAnswersArOverride
        ? sanitizeAnswerList(overrides.acceptedAnswersAr)
        : acceptedAnswersAr;
      const nextAcceptedAnswersEn = hasAcceptedAnswersEnOverride
        ? sanitizeAnswerList(overrides.acceptedAnswersEn)
        : acceptedAnswersEn;
      const nextMatchingPairs = hasMatchingPairsOverride
        ? sanitizeMatchingPairs({ matchingPairs: overrides.matchingPairs })
        : matchingPairs;
      const nextMediaMode = hasMediaModeOverride ? overrides.mediaMode || "LINK" : mediaMode;
      const nextMediaTitle = hasMediaTitleOverride ? overrides.mediaTitle || "" : mediaTitle;
      const nextMediaUrl = hasMediaUrlOverride ? overrides.mediaUrl || "" : mediaUrl;
      const nextMediaFileName = hasMediaFileNameOverride
        ? overrides.mediaFileName || ""
        : mediaFileName;
      const nextMediaMimeType = hasMediaMimeTypeOverride
        ? overrides.mediaMimeType || ""
        : mediaMimeType;
      const nextMediaSize = hasMediaSizeOverride ? overrides.mediaSize : mediaSize;

      onChange({
        questionTextAr: nextQuestionTextAr,
        questionTextEn: nextQuestionTextEn,
        questionType: nextQuestionType,
        points: nextPoints,
        options:
          nextQuestionType === "MCQ_SINGLE" || nextQuestionType === "MCQ_MULTI"
            ? nextOptions
            : undefined,
        correctAnswer: nextQuestionType === "TRUE_FALSE" ? nextCorrectAnswer : undefined,
        sampleAnswerAr:
          nextQuestionType === "SHORT_ANSWER" && nextSampleAnswerAr?.trim()
            ? nextSampleAnswerAr.trim()
            : undefined,
        sampleAnswerEn:
          nextQuestionType === "SHORT_ANSWER" && nextSampleAnswerEn?.trim()
            ? nextSampleAnswerEn.trim()
            : undefined,
        acceptedAnswersAr:
          nextQuestionType === "FILL_IN_BLANK" && nextAcceptedAnswersAr.length > 0
            ? nextAcceptedAnswersAr
            : undefined,
        acceptedAnswersEn:
          nextQuestionType === "FILL_IN_BLANK" && nextAcceptedAnswersEn.length > 0
            ? nextAcceptedAnswersEn
            : undefined,
        matchingPairs:
          nextQuestionType === "MATCHING" && nextMatchingPairs.length > 0
            ? nextMatchingPairs
            : undefined,
        mediaMode: nextQuestionType === "MEDIA" ? nextMediaMode : undefined,
        mediaTitle:
          nextQuestionType === "MEDIA" && nextMediaTitle.trim() ? nextMediaTitle.trim() : undefined,
        mediaUrl:
          nextQuestionType === "MEDIA" && nextMediaUrl.trim() ? nextMediaUrl.trim() : undefined,
        mediaFileName:
          nextQuestionType === "MEDIA" && nextMediaFileName.trim()
            ? nextMediaFileName.trim()
            : undefined,
        mediaMimeType:
          nextQuestionType === "MEDIA" && nextMediaMimeType.trim()
            ? nextMediaMimeType.trim()
            : undefined,
        mediaSize: nextQuestionType === "MEDIA" ? nextMediaSize : undefined,
        ...overrides,
      });
    },
    [
      correctAnswer,
      onChange,
      options,
      points,
      questionTextAr,
      questionTextEn,
      questionType,
      sampleAnswerAr,
      sampleAnswerEn,
      acceptedAnswersAr,
      acceptedAnswersEn,
      matchingPairs,
      mediaMode,
      mediaTitle,
      mediaUrl,
      mediaFileName,
      mediaMimeType,
      mediaSize,
    ]
  );

  const resetFromQuestion = useCallback(() => {
    if (question) {
      setQuestionTextAr(question.questionTextAr);
      setQuestionTextEn(question.questionTextEn);
      setQuestionType(question.questionType);
      setPoints(question.points);
      setOptions(question.options || []);
      setCorrectAnswer(question.correctAnswer ?? true);
      setSampleAnswerAr(question.sampleAnswerAr || "");
      setSampleAnswerEn(question.sampleAnswerEn || "");
      setAcceptedAnswersAr(question.acceptedAnswersAr || []);
      setAcceptedAnswersEn(question.acceptedAnswersEn || []);
      setMatchingPairs(sanitizeMatchingPairs(question));
      setMediaMode(question.mediaMode || (question.mediaFileName ? "FILE" : "LINK"));
      setMediaTitle(question.mediaTitle || "");
      setMediaUrl(question.mediaUrl || "");
      setMediaFileName(question.mediaFileName || "");
      setMediaMimeType(question.mediaMimeType || "");
      setMediaSize(question.mediaSize);
      return;
    }

    setQuestionTextAr("");
    setQuestionTextEn("");
    setQuestionType("MCQ_SINGLE");
    setPoints(1);
    setOptions([]);
    setCorrectAnswer(true);
    setSampleAnswerAr("");
    setSampleAnswerEn("");
    setAcceptedAnswersAr([]);
    setAcceptedAnswersEn([]);
    setMatchingPairs([]);
    setMediaMode("LINK");
    setMediaTitle("");
    setMediaUrl("");
    setMediaFileName("");
    setMediaMimeType("");
    setMediaSize(undefined);
  }, [question]);

  // This hook owns a local editable form model, so it must resync when a different
  // question/drawer session is opened.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetFromQuestion();
  }, [isOpen, resetFromQuestion, resetKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setQuestionText = useCallback(
    (value: { ar: string; en: string }) => {
      setQuestionTextAr(value.ar);
      setQuestionTextEn(value.en);
      emitChange({
        questionTextAr: value.ar,
        questionTextEn: value.en,
      });
    },
    [emitChange]
  );

  const setPointsValue = useCallback(
    (value: number) => {
      setPoints(value);
      emitChange({ points: value });
    },
    [emitChange]
  );

  const handleTypeChange = useCallback(
    (newType: AssignmentQuestion["questionType"]) => {
      let nextOptions = options;
      let nextCorrectAnswer = correctAnswer;
      let nextSampleAnswerAr = sampleAnswerAr;
      let nextSampleAnswerEn = sampleAnswerEn;
      let nextAcceptedAnswersAr = acceptedAnswersAr;
      let nextAcceptedAnswersEn = acceptedAnswersEn;
      let nextMatchingPairs = matchingPairs;
      let nextMediaMode = mediaMode;
      let nextMediaTitle = mediaTitle;
      let nextMediaUrl = mediaUrl;
      let nextMediaFileName = mediaFileName;
      let nextMediaMimeType = mediaMimeType;
      let nextMediaSize = mediaSize;

      if (
        (newType === "MCQ_SINGLE" || newType === "MCQ_MULTI") &&
        questionType !== "MCQ_SINGLE" &&
        questionType !== "MCQ_MULTI" &&
        options.length === 0
      ) {
        nextOptions = createDefaultOptions();
        setOptions(nextOptions);
      } else if (newType !== "MCQ_SINGLE" && newType !== "MCQ_MULTI") {
        nextOptions = [];
        setOptions([]);
      } else if (questionType === "MCQ_MULTI" && newType === "MCQ_SINGLE") {
        const correctOptions = options
          .filter((option) => option.isCorrect)
          .sort((left, right) => left.order - right.order);

        if (correctOptions.length > 1) {
          const firstCorrectId = correctOptions[0].id;
          nextOptions = options.map((option) => ({
            ...option,
            isCorrect: option.id === firstCorrectId,
          }));
          setOptions(nextOptions);
        }
      }

      if (newType === "TRUE_FALSE") {
        nextCorrectAnswer = true;
        setCorrectAnswer(true);
      }

      if (questionType === "SHORT_ANSWER" && newType !== "SHORT_ANSWER") {
        nextSampleAnswerAr = "";
        nextSampleAnswerEn = "";
        setSampleAnswerAr("");
        setSampleAnswerEn("");
      }

      if (questionType === "FILL_IN_BLANK" && newType !== "FILL_IN_BLANK") {
        nextAcceptedAnswersAr = [];
        nextAcceptedAnswersEn = [];
        setAcceptedAnswersAr([]);
        setAcceptedAnswersEn([]);
      }

      if (newType === "MATCHING" && questionType !== "MATCHING" && matchingPairs.length === 0) {
        nextMatchingPairs = createDefaultMatchingPairs();
        setMatchingPairs(nextMatchingPairs);
      } else if (questionType === "MATCHING" && newType !== "MATCHING") {
        nextMatchingPairs = [];
        setMatchingPairs([]);
      }

      if (questionType === "MEDIA" && newType !== "MEDIA") {
        nextMediaMode = "LINK";
        nextMediaTitle = "";
        nextMediaUrl = "";
        nextMediaFileName = "";
        nextMediaMimeType = "";
        nextMediaSize = undefined;
        setMediaMode("LINK");
        setMediaTitle("");
        setMediaUrl("");
        setMediaFileName("");
        setMediaMimeType("");
        setMediaSize(undefined);
      }

      setQuestionType(newType);
      emitChange({
        questionType: newType,
        options:
          newType === "MCQ_SINGLE" || newType === "MCQ_MULTI" ? nextOptions : undefined,
        correctAnswer: newType === "TRUE_FALSE" ? nextCorrectAnswer : undefined,
        sampleAnswerAr:
          newType === "SHORT_ANSWER" && nextSampleAnswerAr.trim()
            ? nextSampleAnswerAr.trim()
            : undefined,
        sampleAnswerEn:
          newType === "SHORT_ANSWER" && nextSampleAnswerEn.trim()
            ? nextSampleAnswerEn.trim()
            : undefined,
        acceptedAnswersAr:
          newType === "FILL_IN_BLANK" && nextAcceptedAnswersAr.length > 0
            ? nextAcceptedAnswersAr
            : undefined,
        acceptedAnswersEn:
          newType === "FILL_IN_BLANK" && nextAcceptedAnswersEn.length > 0
            ? nextAcceptedAnswersEn
            : undefined,
        matchingPairs:
          newType === "MATCHING" && nextMatchingPairs.length > 0 ? nextMatchingPairs : undefined,
        mediaMode: newType === "MEDIA" ? nextMediaMode : undefined,
        mediaTitle: newType === "MEDIA" && nextMediaTitle.trim() ? nextMediaTitle.trim() : undefined,
        mediaUrl: newType === "MEDIA" && nextMediaUrl.trim() ? nextMediaUrl.trim() : undefined,
        mediaFileName:
          newType === "MEDIA" && nextMediaFileName.trim() ? nextMediaFileName.trim() : undefined,
        mediaMimeType:
          newType === "MEDIA" && nextMediaMimeType.trim() ? nextMediaMimeType.trim() : undefined,
        mediaSize: newType === "MEDIA" ? nextMediaSize : undefined,
      });
    },
    [
      acceptedAnswersAr,
      acceptedAnswersEn,
      correctAnswer,
      emitChange,
      matchingPairs,
      mediaFileName,
      mediaMimeType,
      mediaMode,
      mediaSize,
      mediaTitle,
      mediaUrl,
      options,
      questionType,
      sampleAnswerAr,
      sampleAnswerEn,
    ]
  );

  const addOption = useCallback(() => {
    const maxOrder = options.reduce((max, option) => Math.max(max, option.order), 0);
    const nextOptions = [
      ...options,
      {
        id: `opt-${Date.now()}-${Math.random()}`,
        textAr: "",
        textEn: "",
        isCorrect: false,
        order: maxOrder + 1,
      },
    ];
    setOptions(nextOptions);
    emitChange({ options: nextOptions });
  }, [emitChange, options]);

  const removeOption = useCallback(
    (id: string) => {
      const nextOptions = options.filter((option) => option.id !== id);
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const updateOptionText = useCallback(
    (id: string, ar: string, en: string) => {
      const nextOptions = options.map((option) =>
        option.id === id ? { ...option, textAr: ar, textEn: en } : option
      );
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const updateOptionCorrect = useCallback(
    (id: string, checked: boolean) => {
      const nextOptions =
        questionType === "MCQ_SINGLE"
          ? options.map((option) => ({
              ...option,
              isCorrect: option.id === id ? checked : false,
            }))
          : options.map((option) =>
              option.id === id ? { ...option, isCorrect: checked } : option
            );
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options, questionType]
  );

  const moveOptionUp = useCallback(
    (id: string) => {
      const index = options.findIndex((option) => option.id === id);
      if (index <= 0) {
        return;
      }

      const nextOptions = arrayMove(options, index, index - 1).map((option, optionIndex) => ({
        ...option,
        order: optionIndex + 1,
      }));
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const moveOptionDown = useCallback(
    (id: string) => {
      const index = options.findIndex((option) => option.id === id);
      if (index < 0 || index >= options.length - 1) {
        return;
      }

      const nextOptions = arrayMove(options, index, index + 1).map((option, optionIndex) => ({
        ...option,
        order: optionIndex + 1,
      }));
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const reorderOptions = useCallback(
    (activeId: string, overId: string) => {
      const oldIndex = options.findIndex((option) => option.id === activeId);
      const newIndex = options.findIndex((option) => option.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      const nextOptions = arrayMove(options, oldIndex, newIndex).map((option, optionIndex) => ({
        ...option,
        order: optionIndex + 1,
      }));
      setOptions(nextOptions);
      emitChange({ options: nextOptions });
    },
    [emitChange, options]
  );

  const setTrueFalseAnswer = useCallback(
    (value: boolean) => {
      setCorrectAnswer(value);
      emitChange({ correctAnswer: value });
    },
    [emitChange]
  );

  const setSampleAnswerArValue = useCallback(
    (value: string) => {
      setSampleAnswerAr(value);
      emitChange({ sampleAnswerAr: value.trim() || undefined });
    },
    [emitChange]
  );

  const setSampleAnswerEnValue = useCallback(
    (value: string) => {
      setSampleAnswerEn(value);
      emitChange({ sampleAnswerEn: value.trim() || undefined });
    },
    [emitChange]
  );

  const setAcceptedAnswersArValue = useCallback(
    (value: string[]) => {
      const nextValue = sanitizeAnswerList(value);
      setAcceptedAnswersAr(nextValue);
      emitChange({ acceptedAnswersAr: nextValue });
    },
    [emitChange]
  );

  const setAcceptedAnswersEnValue = useCallback(
    (value: string[]) => {
      const nextValue = sanitizeAnswerList(value);
      setAcceptedAnswersEn(nextValue);
      emitChange({ acceptedAnswersEn: nextValue });
    },
    [emitChange]
  );

  const addMatchingPair = useCallback(() => {
    const nextPairs = [...matchingPairs, createMatchingPair(matchingPairs.length + 1)];
    setMatchingPairs(nextPairs);
    emitChange({ matchingPairs: nextPairs });
  }, [emitChange, matchingPairs]);

  const updateMatchingPair = useCallback(
    (id: string, updates: Partial<MatchingPair>) => {
      const nextPairs = matchingPairs.map((pair) =>
        pair.id === id ? { ...pair, ...updates } : pair
      );
      setMatchingPairs(nextPairs);
      emitChange({ matchingPairs: nextPairs });
    },
    [emitChange, matchingPairs]
  );

  const removeMatchingPair = useCallback(
    (id: string) => {
      const nextPairs = matchingPairs
        .filter((pair) => pair.id !== id)
        .map((pair, index) => ({ ...pair, order: index + 1 }));
      setMatchingPairs(nextPairs);
      emitChange({ matchingPairs: nextPairs });
    },
    [emitChange, matchingPairs]
  );

  const moveMatchingPairUp = useCallback(
    (id: string) => {
      const index = matchingPairs.findIndex((pair) => pair.id === id);
      if (index <= 0) {
        return;
      }
      const nextPairs = arrayMove(matchingPairs, index, index - 1).map((pair, pairIndex) => ({
        ...pair,
        order: pairIndex + 1,
      }));
      setMatchingPairs(nextPairs);
      emitChange({ matchingPairs: nextPairs });
    },
    [emitChange, matchingPairs]
  );

  const moveMatchingPairDown = useCallback(
    (id: string) => {
      const index = matchingPairs.findIndex((pair) => pair.id === id);
      if (index < 0 || index >= matchingPairs.length - 1) {
        return;
      }
      const nextPairs = arrayMove(matchingPairs, index, index + 1).map((pair, pairIndex) => ({
        ...pair,
        order: pairIndex + 1,
      }));
      setMatchingPairs(nextPairs);
      emitChange({ matchingPairs: nextPairs });
    },
    [emitChange, matchingPairs]
  );

  const setMediaModeValue = useCallback(
    (value: "FILE" | "LINK") => {
      setMediaMode(value);
      emitChange({ mediaMode: value });
    },
    [emitChange]
  );

  const setMediaTitleValue = useCallback(
    (value: string) => {
      setMediaTitle(value);
      emitChange({ mediaTitle: value });
    },
    [emitChange]
  );

  const setMediaUrlValue = useCallback(
    (value: string) => {
      setMediaUrl(value);
      emitChange({ mediaUrl: value });
    },
    [emitChange]
  );

  const setMediaFileValue = useCallback(
    (file: File | null) => {
      if (!file) {
        setMediaFileName("");
        setMediaMimeType("");
        setMediaSize(undefined);
        emitChange({
          mediaFileName: undefined,
          mediaMimeType: undefined,
          mediaSize: undefined,
          mediaUrl: mediaMode === "FILE" ? undefined : mediaUrl,
        });
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setMediaMode("FILE");
      setMediaFileName(file.name);
      setMediaMimeType(file.type);
      setMediaSize(file.size);
      setMediaUrl(objectUrl);
      emitChange({
        mediaMode: "FILE",
        mediaFileName: file.name,
        mediaMimeType: file.type,
        mediaSize: file.size,
        mediaUrl: objectUrl,
      });
    },
    [emitChange, mediaMode, mediaUrl]
  );

  const clearMedia = useCallback(() => {
    setMediaTitle("");
    setMediaUrl("");
    setMediaFileName("");
    setMediaMimeType("");
    setMediaSize(undefined);
    emitChange({
      mediaTitle: undefined,
      mediaUrl: undefined,
      mediaFileName: undefined,
      mediaMimeType: undefined,
      mediaSize: undefined,
    });
  }, [emitChange]);

  const buildPayload = useCallback(
    () => ({
      questionTextAr: questionTextAr.trim(),
      questionTextEn: questionTextEn.trim(),
      questionType,
      points,
      options:
        questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI"
          ? options.map((option, index) => ({ ...option, order: index + 1 }))
          : undefined,
      correctAnswer: questionType === "TRUE_FALSE" ? correctAnswer : undefined,
      sampleAnswerAr:
        questionType === "SHORT_ANSWER" && sampleAnswerAr.trim()
          ? sampleAnswerAr.trim()
          : undefined,
      sampleAnswerEn:
        questionType === "SHORT_ANSWER" && sampleAnswerEn.trim()
          ? sampleAnswerEn.trim()
          : undefined,
      acceptedAnswersAr:
        questionType === "FILL_IN_BLANK" && sanitizeAnswerList(acceptedAnswersAr).length > 0
          ? sanitizeAnswerList(acceptedAnswersAr)
          : undefined,
      acceptedAnswersEn:
        questionType === "FILL_IN_BLANK" && sanitizeAnswerList(acceptedAnswersEn).length > 0
          ? sanitizeAnswerList(acceptedAnswersEn)
          : undefined,
      matchingPairs:
        questionType === "MATCHING" && sanitizeMatchingPairs({ matchingPairs }).length > 0
          ? sanitizeMatchingPairs({ matchingPairs })
          : undefined,
      mediaMode: questionType === "MEDIA" ? mediaMode : undefined,
      mediaTitle: questionType === "MEDIA" && mediaTitle.trim() ? mediaTitle.trim() : undefined,
      mediaUrl: questionType === "MEDIA" && mediaUrl.trim() ? mediaUrl.trim() : undefined,
      mediaFileName:
        questionType === "MEDIA" && mediaFileName.trim() ? mediaFileName.trim() : undefined,
      mediaMimeType:
        questionType === "MEDIA" && mediaMimeType.trim() ? mediaMimeType.trim() : undefined,
      mediaSize: questionType === "MEDIA" ? mediaSize : undefined,
    }),
    [
      acceptedAnswersAr,
      acceptedAnswersEn,
      correctAnswer,
      matchingPairs,
      mediaFileName,
      mediaMimeType,
      mediaMode,
      mediaSize,
      mediaTitle,
      mediaUrl,
      options,
      points,
      questionTextAr,
      questionTextEn,
      questionType,
      sampleAnswerAr,
      sampleAnswerEn,
    ]
  );

  return {
    questionTextAr,
    questionTextEn,
    questionType,
    points,
    options,
    correctAnswer,
    sampleAnswerAr,
    sampleAnswerEn,
    acceptedAnswersAr,
    acceptedAnswersEn,
    matchingPairs,
    mediaMode,
    mediaTitle,
    mediaUrl,
    mediaFileName,
    mediaMimeType,
    mediaSize,
    setQuestionText,
    setPointsValue,
    handleTypeChange,
    addOption,
    removeOption,
    updateOptionText,
    updateOptionCorrect,
    moveOptionUp,
    moveOptionDown,
    reorderOptions,
    setTrueFalseAnswer,
    setSampleAnswerArValue,
    setSampleAnswerEnValue,
    setAcceptedAnswersArValue,
    setAcceptedAnswersEnValue,
    addMatchingPair,
    updateMatchingPair,
    removeMatchingPair,
    moveMatchingPairUp,
    moveMatchingPairDown,
    setMediaModeValue,
    setMediaTitleValue,
    setMediaUrlValue,
    setMediaFileValue,
    clearMedia,
    buildPayload,
    resetFromQuestion,
  };
}
