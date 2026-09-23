const MAX_CONCURRENT_MESSAGE_REQUESTS = 4;
let activeRequests = 0;
const waitingRequests: Array<() => void> = [];

async function withRequestSlot(request: () => Promise<void>) {
  if (activeRequests < MAX_CONCURRENT_MESSAGE_REQUESTS) {
    activeRequests += 1;
  } else {
    await new Promise<void>((resolve) => waitingRequests.push(resolve));
  }

  try {
    await request();
  } finally {
    const next = waitingRequests.shift();
    if (next) next();
    else activeRequests -= 1;
  }
}

export async function runBoundedRequests(
  messageIds: string[],
  request: (messageId: string) => Promise<void>,
): Promise<string[]> {
  let nextIndex = 0;
  const failedMessageIds: string[] = [];
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_MESSAGE_REQUESTS, messageIds.length) }, async () => {
      while (nextIndex < messageIds.length) {
        const messageId = messageIds[nextIndex++];
        try {
          await withRequestSlot(() => request(messageId));
        } catch {
          failedMessageIds.push(messageId);
        }
      }
    }),
  );
  return failedMessageIds;
}
