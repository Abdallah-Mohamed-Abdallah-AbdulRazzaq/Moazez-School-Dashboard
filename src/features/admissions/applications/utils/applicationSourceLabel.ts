export function applicationSourceLabel(
  source: unknown,
  knownLabels: Readonly<Record<string, string>>,
): string {
  if (typeof source !== "string" || source.trim() === "") {
    return "—";
  }

  const normalizedSource = source.trim();
  const knownLabel = knownLabels[normalizedSource];
  if (knownLabel) {
    return knownLabel;
  }

  const readableSource = normalizedSource.replaceAll("_", " ").toLowerCase();
  return readableSource.charAt(0).toUpperCase() + readableSource.slice(1);
}
