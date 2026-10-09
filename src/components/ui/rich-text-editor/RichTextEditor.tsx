"use client";

import dynamic from "next/dynamic";
import type { RichTextEditorCoreProps } from "./RichTextEditorCore";

const ClientRichTextEditor = dynamic(
  () =>
    import("./RichTextEditorCore").then((module) => module.RichTextEditorCore),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-40 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
      />
    ),
  },
);

export type RichTextEditorProps = RichTextEditorCoreProps;

export default function RichTextEditor(props: RichTextEditorProps) {
  return <ClientRichTextEditor {...props} />;
}
