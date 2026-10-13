export function trueFalseOptionValue(text: string): boolean | null {
  const label = text.trim().toLowerCase();
  if (["true", "صحيح", "صح"].includes(label)) return true;
  if (["false", "خطأ", "خاطئ"].includes(label)) return false;
  return null;
}
