"use client";

/* eslint-disable @next/next/no-img-element -- Authenticated blob URLs cannot use next/image. */

import { useEffect, useState } from "react";
import { FileQuestion, LoaderCircle, ShieldAlert } from "lucide-react";
import { isApiError } from "@/lib/api-error";
import {
  type CachedAuthenticatedFile,
  loadAuthenticatedFileUrl,
} from "@/lib/files/authenticatedFileUrlCache";
import type { SubjectResourceAssetKind } from "@/features/academic-content/model/subjectResourceDetail";
import { parseCsvPreview, type CsvPreview } from "./parseCsvPreview";

const TEXT_PREVIEW_MAX_BYTES = 2 * 1024 * 1024;
const CSV_LIMITS = { maxRows: 200, maxColumns: 30 };

export interface EmbeddedPreviewFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface EmbeddedFilePreviewLabels {
  loading: string;
  unavailable: string;
  unavailableDescription: string;
  accessDenied: string;
  accessDeniedDescription: string;
  tooLarge: string;
  truncated: string;
}

interface EmbeddedFilePreviewProps {
  file: EmbeddedPreviewFile | null;
  kind: SubjectResourceAssetKind;
  labels: EmbeddedFilePreviewLabels;
}

interface PreviewState {
  loaded: CachedAuthenticatedFile | null;
  text: string | null;
  csv: CsvPreview | null;
  status: "idle" | "loading" | "ready" | "denied" | "failed" | "too-large";
}

const INITIAL_STATE: PreviewState = {
  loaded: null,
  text: null,
  csv: null,
  status: "idle",
};

function PreviewMessage({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileQuestion;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon aria-hidden="true" className="size-10 text-gray-400" />
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}

function CsvTable({
  fileName,
  preview,
}: {
  fileName: string;
  preview: CsvPreview;
}) {
  return (
    <div className="max-h-[70vh] overflow-auto p-4">
      <table aria-label={fileName} className="w-full border-collapse text-sm">
        <tbody>
          {preview.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}:${row.join("\u0000")}`}>
              {row.map((cell, columnIndex) => (
                <td
                  key={`${columnIndex}:${cell}`}
                  className="border border-gray-200 px-3 py-2 text-start text-gray-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function loadedPreviewState(
  file: EmbeddedPreviewFile,
  kind: SubjectResourceAssetKind,
  loaded: CachedAuthenticatedFile,
): Promise<PreviewState> {
  if (kind !== "text" && kind !== "csv") {
    return { ...INITIAL_STATE, loaded, status: "ready" };
  }
  const text = await readBlobText(loaded.blob);
  return {
    loaded,
    text: kind === "text" ? text : null,
    csv: kind === "csv" ? parseCsvPreview(text, CSV_LIMITS) : null,
    status: "ready",
  };
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

function ReadyPreview({
  file,
  kind,
  state,
}: {
  file: EmbeddedPreviewFile;
  kind: SubjectResourceAssetKind;
  state: PreviewState;
}) {
  if (kind === "pdf") {
    return (
      <iframe
        src={state.loaded?.url}
        title={file.name}
        className="h-[70vh] w-full border-0"
      />
    );
  }
  if (kind === "image") {
    return (
      <img
        src={state.loaded?.url}
        alt={file.name}
        className="mx-auto max-h-[70vh] max-w-full object-contain p-4"
      />
    );
  }
  if (kind === "video")
    return (
      <video
        controls
        aria-label={file.name}
        src={state.loaded?.url}
        className="max-h-[70vh] w-full bg-black"
      />
    );
  if (kind === "audio")
    return (
      <div className="flex min-h-72 items-center justify-center p-8">
        <audio
          controls
          aria-label={file.name}
          src={state.loaded?.url}
          className="w-full max-w-xl"
        />
      </div>
    );
  if (kind === "text")
    return (
      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words p-5 text-sm text-gray-800">
        {state.text}
      </pre>
    );
  if (kind === "csv" && state.csv)
    return <CsvTable fileName={file.name} preview={state.csv} />;
  return null;
}

export default function EmbeddedFilePreview({
  file,
  kind,
  labels,
}: EmbeddedFilePreviewProps) {
  const [state, setState] = useState<PreviewState>(INITIAL_STATE);

  useEffect(() => {
    if (!file || kind === "download") return;
    if (
      (kind === "text" || kind === "csv") &&
      file.size > TEXT_PREVIEW_MAX_BYTES
    ) {
      queueMicrotask(() => setState({ ...INITIAL_STATE, status: "too-large" }));
      return;
    }
    let active = true;
    queueMicrotask(
      () => active && setState({ ...INITIAL_STATE, status: "loading" }),
    );
    const denyOrFail = (error: unknown) => {
      if (!active) return;
      setState({
        ...INITIAL_STATE,
        status: isApiError(error) && error.status === 403 ? "denied" : "failed",
      });
    };
    void loadAuthenticatedFileUrl(file.id).then(
      (loaded) => {
        void loadedPreviewState(file, kind, loaded)
          .then((nextState) => active && setState(nextState))
          .catch(denyOrFail);
      },
      (error: unknown) => {
        if (!active) return;
        denyOrFail(error);
      },
    );
    return () => {
      active = false;
    };
  }, [file, kind]);

  if (!file || kind === "download")
    return (
      <PreviewMessage
        icon={FileQuestion}
        title={labels.unavailable}
        description={labels.unavailableDescription}
      />
    );
  if (state.status === "loading" || state.status === "idle")
    return (
      <div
        role="status"
        className="flex min-h-72 items-center justify-center gap-2 text-sm text-gray-500"
      >
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        {labels.loading}
      </div>
    );
  if (state.status === "denied")
    return (
      <PreviewMessage
        icon={ShieldAlert}
        title={labels.accessDenied}
        description={labels.accessDeniedDescription}
      />
    );
  if (state.status === "too-large")
    return (
      <PreviewMessage
        icon={FileQuestion}
        title={labels.unavailable}
        description={labels.tooLarge}
      />
    );
  if (state.status === "failed")
    return (
      <PreviewMessage
        icon={FileQuestion}
        title={labels.unavailable}
        description={labels.unavailableDescription}
      />
    );
  return (
    <>
      <ReadyPreview file={file} kind={kind} state={state} />
      {state.csv?.truncated ? (
        <p
          role="status"
          className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          {labels.truncated}
        </p>
      ) : null}
    </>
  );
}
