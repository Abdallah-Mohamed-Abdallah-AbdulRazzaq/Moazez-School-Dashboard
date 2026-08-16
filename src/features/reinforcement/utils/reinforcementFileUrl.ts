export function getReinforcementProofDownloadUrl(fileId: string): string {
  return `/api/files/${encodeURIComponent(fileId)}/download`;
}
