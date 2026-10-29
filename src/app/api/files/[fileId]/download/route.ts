import { NextRequest } from "next/server";
import { downloadFileResponse } from "@/lib/files/server-download";

interface DownloadRouteContext {
  params: Promise<{ fileId: string }>;
}

export async function GET(
  request: NextRequest,
  context: DownloadRouteContext,
): Promise<Response> {
  const { fileId } = await context.params;
  return downloadFileResponse(request, fileId);
}
