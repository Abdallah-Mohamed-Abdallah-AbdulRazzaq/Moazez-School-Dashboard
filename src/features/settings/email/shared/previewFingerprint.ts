export function normalizeStringSet(values: string[] | undefined): string[] {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
}

export function fingerprintCanonicalPayload(payload: unknown): string {
  return JSON.stringify(payload);
}
