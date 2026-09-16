import { apiGet } from "@/lib/api";
import {
  fetchAcademicStructureTree,
  fetchAcademicYears,
  fetchTerms,
} from "@/features/academics/services/academicStructureApiService";
import {
  getAnnouncements,
  getConversations,
  getMessages,
} from "./communication.service";

export interface CommunicationSelectorOption {
  id: string;
  label: string;
  description?: string;
}

type RecordLike = Record<string, unknown>;

const messageFallbackLabels = {
  en: {
    hidden: "Hidden message",
    deleted: "Deleted message",
    text: "Message without text",
    image: "Image message",
    file: "File message",
    audio: "Audio message",
    voice: "Voice message",
    video: "Video message",
    system: "System message",
    unknown: "Message",
  },
  ar: {
    hidden: "رسالة مخفية",
    deleted: "رسالة محذوفة",
    text: "رسالة بدون نص",
    image: "رسالة صورة",
    file: "رسالة ملف",
    audio: "رسالة صوتية",
    voice: "رسالة صوتية",
    video: "رسالة فيديو",
    system: "رسالة نظام",
    unknown: "رسالة",
  },
} as const;

const isRecord = (value: unknown): value is RecordLike =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function unwrapItems(response: unknown): RecordLike[] {
  if (Array.isArray(response)) return response.filter(isRecord);
  if (!isRecord(response)) return [];

  const sources = [response, response.data, response.result, response.payload].filter(isRecord);
  const list = sources
    .map((source) => source.items ?? source.data ?? source.results)
    .find(Array.isArray);

  return Array.isArray(list) ? list.filter(isRecord) : [];
}

function optionFromRecord(record: RecordLike): CommunicationSelectorOption | null {
  const id = stringValue(record.id);
  if (!id) return null;
  const label =
    stringValue(record.name) ??
    stringValue(record.nameEn) ??
    stringValue(record.nameAr) ??
    stringValue(record.title) ??
    stringValue(record.fullName) ??
    stringValue(record.username) ??
    stringValue(record.email) ??
    stringValue(record.fileName) ??
    stringValue(record.originalName) ??
    id;

  return {
    id,
    label,
    description:
      stringValue(record.description) ??
      stringValue(record.email) ??
      stringValue(record.username),
  };
}

function isOption(
  option: CommunicationSelectorOption | null,
): option is CommunicationSelectorOption {
  return Boolean(option);
}

function filterOptions(
  options: CommunicationSelectorOption[],
  query?: string,
): CommunicationSelectorOption[] {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return options.slice(0, 30);
  return options
    .filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLowerCase().includes(normalized),
    )
    .slice(0, 30);
}

function messageOptionLabel(record: RecordLike, locale: string): string {
  const labels = locale.startsWith("ar")
    ? messageFallbackLabels.ar
    : messageFallbackLabels.en;
  const status = stringValue(record.status)?.toLowerCase();
  if (status === "hidden" || status === "deleted") return labels[status];

  const body =
    stringValue(record.body) ??
    stringValue(record.content) ??
    stringValue(record.text);
  if (body) return body.slice(0, 80);

  const type = stringValue(record.type)?.toLowerCase();
  return type && type in labels
    ? labels[type as keyof typeof labels]
    : labels.unknown;
}

function conversationOption(
  record: RecordLike,
  locale: string,
): CommunicationSelectorOption | null {
  const id = stringValue(record.id);
  if (!id) return null;

  const label = locale.startsWith("ar")
    ? (stringValue(record.titleAr) ??
      stringValue(record.title) ??
      stringValue(record.titleEn))
    : (stringValue(record.titleEn) ??
      stringValue(record.title) ??
      stringValue(record.titleAr));

  return label ? { id, label } : null;
}

function formatMessageTimestamp(record: RecordLike, locale: string) {
  const timestamp = stringValue(record.sentAt) ?? stringValue(record.createdAt);
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return undefined;
  const dateLocale = locale.startsWith("ar") ? "ar-EG" : locale;
  return new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function searchAcademicYears(
  query = "",
): Promise<CommunicationSelectorOption[]> {
  const years = await fetchAcademicYears();
  return filterOptions(years.filter(isRecord).map(optionFromRecord).filter(isOption), query);
}

export async function searchTerms(
  query = "",
  academicYearId?: string,
): Promise<CommunicationSelectorOption[]> {
  if (!academicYearId) return [];
  const terms = await fetchTerms(academicYearId);
  return filterOptions(terms.filter(isRecord).map(optionFromRecord).filter(isOption), query);
}

async function searchStructure(
  query: string,
  academicYearId: string | undefined,
  termId: string | undefined,
  key: "stages" | "grades" | "sections" | "classrooms",
  parentKey?: "stageId" | "gradeId" | "sectionId",
  parentId?: string,
) {
  let yearId = academicYearId;
  let selectedTermId = termId;

  if (!yearId) {
    const years = await fetchAcademicYears();
    yearId = stringValue(years.find(isRecord)?.id);
  }

  if (yearId && !selectedTermId) {
    const terms = await fetchTerms(yearId);
    selectedTermId = stringValue(terms.find(isRecord)?.id);
  }

  if (!yearId || !selectedTermId) return [];
  const tree = await fetchAcademicStructureTree({
    yearId,
    termId: selectedTermId,
  });
  const records = tree[key].filter((record) =>
    parentKey && parentId
      ? stringValue((record as unknown as RecordLike)[parentKey]) === parentId
      : true,
  );
  return filterOptions(
    records.map((record) => optionFromRecord(record as unknown as RecordLike)).filter(isOption),
    query,
  );
}

export const searchStages = (query = "", academicYearId?: string, termId?: string) =>
  searchStructure(query, academicYearId, termId, "stages");

export const searchGrades = (
  query = "",
  academicYearId?: string,
  termId?: string,
  stageId?: string,
) => searchStructure(query, academicYearId, termId, "grades", "stageId", stageId);

export const searchSections = (
  query = "",
  academicYearId?: string,
  termId?: string,
  gradeId?: string,
) => searchStructure(query, academicYearId, termId, "sections", "gradeId", gradeId);

export const searchClassrooms = (
  query = "",
  academicYearId?: string,
  termId?: string,
  sectionId?: string,
) =>
  searchStructure(
    query,
    academicYearId,
    termId,
    "classrooms",
    "sectionId",
    sectionId,
  );

export async function searchSubjects(
  query = "",
): Promise<CommunicationSelectorOption[]> {
  const response = await apiGet<unknown>("/academics/subjects");
  return filterOptions(unwrapItems(response).map(optionFromRecord).filter(isOption), query);
}

export async function searchAnnouncements(
  query = "",
): Promise<CommunicationSelectorOption[]> {
  const response = await getAnnouncements({ search: query, limit: 20 });
  return unwrapItems(response).map(optionFromRecord).filter(isOption);
}

export async function searchConversations(
  query = "",
  locale = "en",
): Promise<CommunicationSelectorOption[]> {
  const response = await getConversations({ search: query, limit: 20 });
  return unwrapItems(response).map((record) => conversationOption(record, locale)).filter(isOption);
}

export async function searchMessages(
  conversationId: string,
  query = "",
  locale = "en",
): Promise<CommunicationSelectorOption[]> {
  if (!conversationId) return [];

  const response = await getMessages(conversationId, { limit: 30 });
  const options = unwrapItems(response).reduce<CommunicationSelectorOption[]>(
    (items, record) => {
      const id = stringValue(record.id);
      if (!id) return items;

      const description = formatMessageTimestamp(record, locale);

      items.push({
        id,
        label: messageOptionLabel(record, locale),
        ...(description ? { description } : {}),
      });
      return items;
    },
    [],
  );

  return filterOptions(options, query);
}

export async function searchFiles(query = ""): Promise<CommunicationSelectorOption[]> {
  const response = await apiGet<unknown>("/files");
  return filterOptions(unwrapItems(response).map(optionFromRecord).filter(isOption), query);
}
