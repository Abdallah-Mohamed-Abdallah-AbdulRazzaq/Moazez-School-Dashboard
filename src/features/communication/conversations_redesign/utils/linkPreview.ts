export interface LinkPreviewMetadata {
  title: string;
  description?: string;
  image?: string;
  domain: string;
  url: string;
}

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>()]+/;
const META_PATTERN =
  /<meta\s+[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']([^"']+)["'][^>]*>/gi;

export function firstUrlInText(text: string) {
  return URL_PATTERN.exec(text)?.[0] ?? null;
}

export function normalizePreviewUrl(rawUrl: string) {
  return rawUrl.startsWith("www.") ? `https://${rawUrl}` : rawUrl;
}

export function isPreviewableUrl(rawUrl: string) {
  try {
    const url = new URL(normalizePreviewUrl(rawUrl));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function titleFromHtml(html: string) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match?.[1] ? decodeHtmlEntities(match[1]) : "";
}

function metadataMapFromHtml(html: string) {
  const metadata = new Map<string, string>();
  for (const match of html.matchAll(META_PATTERN)) {
    const key = (match[1] ?? match[4] ?? "").toLowerCase();
    const content = match[2] ?? match[3] ?? "";
    if (key && content && !metadata.has(key)) {
      metadata.set(key, decodeHtmlEntities(content));
    }
  }
  return metadata;
}

function absoluteImageUrl(image: string | undefined, pageUrl: URL) {
  if (!image) return undefined;
  try {
    return new URL(image, pageUrl).toString();
  } catch {
    return undefined;
  }
}

export function extractLinkPreviewMetadata(
  html: string,
  pageUrl: string,
): LinkPreviewMetadata | null {
  const url = new URL(pageUrl);
  const metadata = metadataMapFromHtml(html);
  const title =
    metadata.get("og:title") ||
    metadata.get("twitter:title") ||
    titleFromHtml(html);
  const description =
    metadata.get("og:description") ||
    metadata.get("twitter:description") ||
    metadata.get("description") ||
    undefined;
  const image = absoluteImageUrl(
    metadata.get("og:image") || metadata.get("twitter:image"),
    url,
  );

  if (!title && !description && !image) return null;

  return {
    title: title || url.hostname,
    description,
    image,
    domain: url.hostname.replace(/^www\./, ""),
    url: url.toString(),
  };
}
