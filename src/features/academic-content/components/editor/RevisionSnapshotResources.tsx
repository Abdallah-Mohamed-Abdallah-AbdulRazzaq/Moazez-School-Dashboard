"use client";

import { Link2, Paperclip, Tags } from "lucide-react";
import { formatByteCount } from "../../model/academicContentPolicy";
import type { AcademicContentRevisionDetail } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

function FilesList({ revision }: { revision: AcademicContentRevisionDetail }) {
  const t = useAcademicContentTranslations("revisions");
  if (revision.assets.length === 0) {
    return <p className="text-sm text-gray-500">{t("no_files")}</p>;
  }
  return (
    <ul className="space-y-2">
      {revision.assets.map((asset) => (
        <li
          key={`${asset.fileId}:${asset.sortOrder}`}
          className="text-sm text-gray-700"
        >
          <p className="font-medium text-gray-900">{asset.originalName}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {asset.mimeType} · {formatByteCount(asset.sizeBytes)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function LinksList({ revision }: { revision: AcademicContentRevisionDetail }) {
  const t = useAcademicContentTranslations("revisions");
  if (revision.links.length === 0) {
    return <p className="text-sm text-gray-500">{t("no_links")}</p>;
  }
  return (
    <ul className="space-y-2">
      {revision.links.map((link) => (
        <li key={link.id} className="text-sm">
          <a
            className="font-medium text-primary underline"
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function TagsList({ revision }: { revision: AcademicContentRevisionDetail }) {
  const t = useAcademicContentTranslations("revisions");
  if (revision.tags.length === 0) {
    return <p className="text-sm text-gray-500">{t("no_tags")}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {revision.tags.map((tag) => (
        <li
          key={tag.id}
          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
        >
          {tag.value}
        </li>
      ))}
    </ul>
  );
}

export default function RevisionSnapshotResources({
  revision,
}: {
  revision: AcademicContentRevisionDetail;
}) {
  const t = useAcademicContentTranslations("revisions");
  const sections = [
    {
      key: "files",
      title: t("files"),
      icon: <Paperclip aria-hidden="true" className="size-4" />,
      content: <FilesList revision={revision} />,
    },
    {
      key: "links",
      title: t("links"),
      icon: <Link2 aria-hidden="true" className="size-4" />,
      content: <LinksList revision={revision} />,
    },
    {
      key: "tags",
      title: t("tags"),
      icon: <Tags aria-hidden="true" className="size-4" />,
      content: <TagsList revision={revision} />,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {sections.map((section) => (
        <section
          key={section.key}
          className="rounded-xl border border-gray-200 p-4"
        >
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className="text-primary">{section.icon}</span>
            {section.title}
          </h3>
          <div className="mt-3">{section.content}</div>
        </section>
      ))}
    </div>
  );
}
