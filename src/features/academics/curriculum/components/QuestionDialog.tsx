"use client";

import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import QuestionDrawer from "./QuestionDrawer";

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<AssignmentQuestion>) => Promise<void>;
  question?: AssignmentQuestion | null;
  isReadOnly: boolean;
}

export default function QuestionDialog(props: QuestionDialogProps) {
  return <QuestionDrawer {...props} />;
}
