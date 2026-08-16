import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import {
  extractLinkPreviewMetadata,
  isPreviewableUrl,
  normalizePreviewUrl,
} from "@/features/communication/conversations_redesign/utils/linkPreview";

export const runtime = "nodejs";

const MAX_PREVIEW_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 5000;

function noPreviewResponse() {
  return new NextResponse(null, { status: 204 });
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    first === 0
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isBlockedAddress(address: string) {
  const ipVersion = isIP(address);
  if (ipVersion === 4) return isPrivateIpv4(address);
  if (ipVersion === 6) return isPrivateIpv6(address);
  return false;
}

async function assertPublicPreviewTarget(url: URL) {
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    throw new Error("Blocked local link preview target.");
  }

  if (isBlockedAddress(url.hostname)) {
    throw new Error("Blocked private link preview target.");
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error("Blocked private link preview target.");
  }
}

async function responseTextWithinLimit(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (totalBytes < MAX_PREVIEW_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;

    const nextChunk = value.slice(
      0,
      Math.max(0, MAX_PREVIEW_BYTES - totalBytes),
    );
    chunks.push(nextChunk);
    totalBytes += nextChunk.byteLength;
  }

  await reader.cancel();
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "";
  if (!rawUrl || !isPreviewableUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const normalizedUrl = normalizePreviewUrl(rawUrl);
  const previewUrl = new URL(normalizedUrl);

  try {
    await assertPublicPreviewTarget(previewUrl);

    const response = await fetch(previewUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "MoazezLinkPreview/1.0",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return noPreviewResponse();
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return noPreviewResponse();
    }

    const html = await responseTextWithinLimit(response);
    const metadata = extractLinkPreviewMetadata(html, previewUrl.toString());

    return metadata
      ? NextResponse.json(metadata, {
          headers: { "Cache-Control": "public, max-age=3600" },
        })
      : noPreviewResponse();
  } catch {
    return noPreviewResponse();
  }
}
