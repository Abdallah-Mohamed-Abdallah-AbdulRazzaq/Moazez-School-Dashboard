export function messageBodyForDisplay(body?: string): string {
  if (!body) return "";

  try {
    const parsedBody = JSON.parse(body) as unknown;
    if (
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "kind" in parsedBody &&
      parsedBody.kind === "voice_metadata"
    ) {
      return "";
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  return body;
}
