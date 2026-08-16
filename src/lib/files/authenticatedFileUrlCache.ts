import { downloadFileBlob } from "@/services/filesService";

export interface CachedAuthenticatedFile {
  blob: Blob;
  mimeType: string;
  url: string;
}

const fileUrlCache = new Map<string, CachedAuthenticatedFile>();
const pendingFileRequests = new Map<string, Promise<CachedAuthenticatedFile>>();
const MAX_CACHED_FILES = 100;
let cacheGeneration = 0;

export function getCachedAuthenticatedFile(
  fileId: string,
): CachedAuthenticatedFile | undefined {
  return fileUrlCache.get(fileId);
}

function cacheFile(fileId: string, cachedFile: CachedAuthenticatedFile) {
  fileUrlCache.set(fileId, cachedFile);
  if (fileUrlCache.size <= MAX_CACHED_FILES) return;

  const oldestFileId = fileUrlCache.keys().next().value;
  if (!oldestFileId) return;
  const oldestFile = fileUrlCache.get(oldestFileId);
  if (oldestFile) URL.revokeObjectURL(oldestFile.url);
  fileUrlCache.delete(oldestFileId);
}

async function downloadAndCacheFile(
  fileId: string,
  requestGeneration: number,
): Promise<CachedAuthenticatedFile> {
  const blob = await downloadFileBlob(fileId);
  const cachedFile = {
    blob,
    mimeType: blob.type,
    url: URL.createObjectURL(blob),
  };

  if (requestGeneration !== cacheGeneration) {
    URL.revokeObjectURL(cachedFile.url);
    throw new Error("Authenticated file request was invalidated.");
  }

  cacheFile(fileId, cachedFile);
  return cachedFile;
}

export function loadAuthenticatedFileUrl(
  fileId: string,
): Promise<CachedAuthenticatedFile> {
  const cachedFile = getCachedAuthenticatedFile(fileId);
  if (cachedFile) {
    fileUrlCache.delete(fileId);
    fileUrlCache.set(fileId, cachedFile);
    return Promise.resolve(cachedFile);
  }

  const pendingRequest = pendingFileRequests.get(fileId);
  if (pendingRequest) return pendingRequest;

  const requestGeneration = cacheGeneration;
  const fileRequest = downloadAndCacheFile(fileId, requestGeneration).finally(
    () => {
      if (pendingFileRequests.get(fileId) === fileRequest) {
        pendingFileRequests.delete(fileId);
      }
    },
  );

  pendingFileRequests.set(fileId, fileRequest);
  return fileRequest;
}

export function clearAuthenticatedFileUrlCache() {
  cacheGeneration += 1;
  fileUrlCache.forEach(({ url }) => URL.revokeObjectURL(url));
  fileUrlCache.clear();
  pendingFileRequests.clear();
}
