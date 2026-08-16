import type { SetupStepDefinition } from "../types";

export const setupSteps: SetupStepDefinition[] = [
  { id: "organization", translationKey: "organization", prerequisites: [] },
  { id: "academicContext", translationKey: "academic_context", prerequisites: ["organization"] },
  { id: "structure", translationKey: "structure", prerequisites: ["academicContext"] },
  { id: "subjects", translationKey: "subjects", prerequisites: ["structure"] },
  { id: "rooms", translationKey: "rooms", prerequisites: ["subjects"] },
];
