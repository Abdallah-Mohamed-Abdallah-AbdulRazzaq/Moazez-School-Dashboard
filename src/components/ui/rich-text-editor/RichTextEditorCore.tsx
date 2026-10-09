"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  Separator,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import styles from "./RichTextEditor.module.css";
import RichTextLinkControl from "./RichTextLinkControl";

export interface RichTextEditorCoreProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  disabled: boolean;
}

const EditorMethodsContext = createContext<RefObject<MDXEditorMethods | null> | null>(
  null,
);

function RichTextToolbar() {
  const editorRef = useContext(EditorMethodsContext);
  const insertMarkdown = useCallback(
    (markdown: string) => {
      editorRef?.current?.focus(() => {
        editorRef.current?.insertMarkdown(markdown);
      });
    },
    [editorRef],
  );

  return (
    <>
      <BlockTypeSelect />
      <Separator />
      <BoldItalicUnderlineToggles />
      <Separator />
      <ListsToggle options={["bullet", "number"]} />
      <Separator />
      <RichTextLinkControl onInsertLink={insertMarkdown} />
    </>
  );
}

function createEditorPlugins() {
  return [
    listsPlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    headingsPlugin({ allowedHeadingLevels: [2, 3] }),
    markdownShortcutPlugin(),
    toolbarPlugin({
      toolbarContents: () => <RichTextToolbar />,
    }),
  ];
}

function labelContentEditable(
  container: HTMLDivElement,
  labelId: string,
  descriptionId: string,
) {
  const editable = container.querySelector<HTMLElement>(
    '[contenteditable="true"], [role="textbox"]',
  );
  if (!editable) return false;
  editable.setAttribute("aria-labelledby", labelId);
  editable.setAttribute("aria-describedby", descriptionId);
  editable.setAttribute("aria-multiline", "true");
  return true;
}

function useAccessibleEditor(
  containerRef: RefObject<HTMLDivElement | null>,
  labelId: string,
  descriptionId: string,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (labelContentEditable(container, labelId, descriptionId)) return;
    const editorObserver = new MutationObserver(() => {
      if (labelContentEditable(container, labelId, descriptionId)) {
        editorObserver.disconnect();
      }
    });
    editorObserver.observe(container, { childList: true, subtree: true });
    return () => editorObserver.disconnect();
  }, [containerRef, descriptionId, labelId]);
}

export function RichTextEditorCore({
  label,
  value,
  onChange,
  maxLength,
  disabled,
}: RichTextEditorCoreProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const labelId = `${generatedId}-label`;
  const descriptionId = `${generatedId}-description`;
  const editorPlugins = useMemo(() => createEditorPlugins(), []);

  useEffect(() => {
    const currentMarkdown = editorRef.current?.getMarkdown();
    if (currentMarkdown !== undefined && currentMarkdown !== value) {
      editorRef.current?.setMarkdown(value);
    }
  }, [value]);

  useAccessibleEditor(containerRef, labelId, descriptionId);

  const acceptMarkdownChange = (nextValue: string, initialMarkdownNormalize: boolean) => {
    if (initialMarkdownNormalize) return;
    if (nextValue.length > maxLength) {
      editorRef.current?.setMarkdown(value);
      return;
    }
    onChange(nextValue);
  };

  return (
    <div className="w-full">
      <div
        id={labelId}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </div>
      <div
        ref={containerRef}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className={`${styles.editorFrame} ${disabled ? styles.disabled : ""}`}
      >
        <EditorMethodsContext.Provider value={editorRef}>
          <MDXEditor
            ref={editorRef}
            className={styles.editorRoot}
            markdown={value}
            onChange={acceptMarkdownChange}
            readOnly={disabled}
            contentEditableClassName={styles.contentEditable}
            plugins={editorPlugins}
          />
        </EditorMethodsContext.Provider>
      </div>
      <div id={descriptionId} className="mt-1 text-end text-xs text-gray-500">
        <span className="tabular-nums">{value.length}/{maxLength}</span>
      </div>
    </div>
  );
}
