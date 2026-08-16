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
): Promise<CommunicationSelectorOption[]> {
  const response = await getConversations({ search: query, limit: 20 });
  return unwrapItems(response).map(optionFromRecord).filter(isOption);
}

export async function searchMessages(
  conversationId: string,
  query = "",
): Promise<CommunicationSelectorOption[]> {
  if (!conversationId) return [];

  const response = await getMessages(conversationId, { limit: 30 });
  const options = unwrapItems(response).reduce<CommunicationSelectorOption[]>(
    (items, record) => {
      const id = stringValue(record.id);
      if (!id) return items;

      const body =
        stringValue(record.body) ??
        stringValue(record.content) ??
        stringValue(record.text);
      const description =
        stringValue(record.createdAt) ??
        stringValue(record.senderId) ??
        stringValue(record.type);

      items.push({
        id,
        label: body ? body.slice(0, 80) : id,
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
