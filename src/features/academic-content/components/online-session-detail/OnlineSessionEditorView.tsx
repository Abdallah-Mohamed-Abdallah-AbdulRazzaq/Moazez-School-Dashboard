"use client";

import { useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import GenericAcademicContentEditorView from "../editor/GenericAcademicContentEditorView";
import LifecycleActions from "../editor/LifecycleActions";
import ReadinessPanel from "../editor/ReadinessPanel";
import RevisionHistoryPanel from "../editor/RevisionHistoryPanel";
import { academicContentOverviewHref } from "../overview/overviewRoutes";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentDetailOptions } from "../../hooks/useAcademicContentDetailOptions";
import { useAcademicContentTargetDisplay } from "../../hooks/useAcademicContentTargetDisplay";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import { EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS } from "../../services/academicContentDetailOptions";
import { academicContentUiError } from "../../services/academicContentErrors";
import { downloadAcademicContentAsset } from "../../services/downloadAcademicContentAsset";
import type {
  AcademicContentAsset,
  AcademicContentBase,
  AcademicContentDetail,
} from "../../types/contracts";
import OnlineSessionContextRail from "./OnlineSessionContextRail";
import OnlineSessionHeader from "./OnlineSessionHeader";
import OnlineSessionInformation from "./OnlineSessionInformation";
import OnlineSessionLobbyHero from "./OnlineSessionLobbyHero";
import OnlineSessionManagementHistory from "./OnlineSessionManagementHistory";
import OnlineSessionResources from "./OnlineSessionResources";

type EditorState = ReturnType<typeof useAcademicContentEditor>;
type OnlineSessionEditor = EditorState & {
  content: Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>;
};

interface OnlineSessionEditorViewProps {
  editor: OnlineSessionEditor;
  canManage: boolean;
  canPublish?: boolean;
  academicYearName: string;
  termName: string;
  termBounds?: { startDate: string; endDate: string };
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

function queryWithMode(
  pathname: string,
  searchParams: URLSearchParams,
  mode: "edit" | null,
) {
  const query = new URLSearchParams(searchParams);
  if (mode) query.set("mode", mode);
  else query.delete("mode");
  const serialized = query.toString();
  return `${pathname}${serialized ? `?${serialized}` : ""}`;
}

export default function OnlineSessionEditorView({
  editor,
  canManage,
  canPublish = false,
  academicYearName,
  termName,
  termBounds,
  onLifecycleChanged,
  onDeleted,
}: OnlineSessionEditorViewProps) {
  const { content } = editor;
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useAcademicContentTranslations("online_session_detail");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const optionState = useAcademicContentDetailOptions(content);
  const targetDisplay = useAcademicContentTargetDisplay(
    content,
    locale,
    t("options_unavailable"),
  );
  const inEditMode = searchParams.get("mode") === "edit";
  const canEdit = canManage && !editor.isReadOnly;
  const publicationAvailable = isPublicationSurfaceAvailable(
    content.type,
    content.audience,
  );
  const options = optionState.options ?? EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS;
  const timetableEntry = options.timetableEntries.find(
    ({ id }) => id === content.details?.timetableEntryId,
  );
  const timetableLabel = timetableEntry
    ? `${locale === "ar" ? timetableEntry.classroom.nameAr : timetableEntry.classroom.nameEn} · ${
        timetableEntry.subject
          ? locale === "ar"
            ? timetableEntry.subject.nameAr
            : timetableEntry.subject.nameEn
          : t("reference_unavailable")
      } · ${timetableEntry.period.label}`
    : null;
  const backHref = academicContentOverviewHref({
    locale,
    routeSuffix: "/online-sessions",
    yearId: content.academicYearId,
    termId: content.termId,
  });
  const refreshContent = async () => {
    await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
  };
  const openMode = (mode: "edit" | null) => {
    router.push(
      queryWithMode(pathname, new URLSearchParams(searchParams), mode),
    );
  };
  const requestDownload = (asset: AcademicContentAsset) => {
    setDownloadError(null);
    void downloadAcademicContentAsset(asset).catch((error: unknown) => {
      setDownloadError(academicContentUiError(error).message);
    });
  };

  if (inEditMode && canEdit) {
    return (
      <div className="space-y-3">
        <div className="mx-auto max-w-screen-2xl px-4 pt-4 sm:px-6 sm:pt-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={
              <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            }
            onClick={() => openMode(null)}
          >
            {t("back_to_lobby")}
          </Button>
        </div>
        <GenericAcademicContentEditorView
          editor={editor}
          canManage={canManage}
          canPublish={canPublish}
          academicYearName={academicYearName}
          termName={termName}
          termBounds={termBounds}
          onLifecycleChanged={onLifecycleChanged}
          onDeleted={onDeleted}
        />
      </div>
    );
  }

  return (
    <main
      aria-label={t("workspace_label")}
      className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6"
    >
      {editor.isReadOnly ? (
        <div
          role="status"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
        >
          <LockKeyhole aria-hidden="true" className="size-4" />
          {t("read_only")}
        </div>
      ) : null}
      <OnlineSessionHeader
        title={content.title}
        backHref={backHref}
        canEdit={canEdit}
        onEdit={() => openMode("edit")}
        lifecycleActions={
          <LifecycleActions
            content={content}
            canManage={canManage}
            onChanged={onLifecycleChanged}
            onDeleted={onDeleted}
          />
        }
      />
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
          {optionState.error ? (
            <section
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p>{optionState.error}</p>
              <Button
                className="mt-3"
                type="button"
                size="sm"
                variant="secondary"
                onClick={optionState.retry}
              >
                {t("retry_references")}
              </Button>
            </section>
          ) : null}
          <OnlineSessionInformation
            content={content}
            targets={targetDisplay.targets}
            targetError={targetDisplay.error}
            timetableLabel={timetableLabel}
          />
          <OnlineSessionResources
            content={content}
            downloadError={downloadError}
            onDownload={requestDownload}
          />
          <OnlineSessionManagementHistory
            showPublication={publicationAvailable}
            readinessPanel={
              <ReadinessPanel
                readiness={editor.readiness}
                onRefresh={editor.refreshReadiness}
              />
            }
            publicationPanel={
              <AcademicContentPublicationPanel
                content={content}
                canMutate={canPublish}
                canStartRevision={canManage && canPublish}
                onContentChanged={refreshContent}
              />
            }
            revisionPanel={
              <RevisionHistoryPanel
                key={`${content.id}:${content.updatedAt}`}
                contentId={content.id}
              />
            }
          />
        </div>
        <aside className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-[var(--header-height)]">
          <OnlineSessionLobbyHero
            content={content}
            onEdit={canEdit ? () => openMode("edit") : undefined}
          />
          <OnlineSessionContextRail
            content={content}
            readiness={editor.readiness}
          />
        </aside>
      </div>
    </main>
  );
}
