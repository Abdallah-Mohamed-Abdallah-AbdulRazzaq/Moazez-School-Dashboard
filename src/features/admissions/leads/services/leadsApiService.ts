// Leads API Service
// Production API integration for the Swagger-backed admissions leads endpoints.

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CreateLeadPayload,
  Lead,
  UpdateLeadPayload,
} from "@/features/admissions/leads/types/lead";
import type { LeadChannel, LeadStatus } from "@/features/admissions/types/enums";

const LEADS_ENDPOINT = "/admissions/leads";

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readString = (record: ApiRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return undefined;
};

function normalizePhoneForApi(value: string): string {
  const westernDigits = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

  return westernDigits.trim().replace(/(?!^\+)[^\d]/g, "");
}

function normalizeTextForApi(value: string): string {
  return value.trim();
}

const unwrapMaybeEnvelope = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return response;
  }

  if (typeof response.data !== "undefined") return response.data;
  if (typeof response.result !== "undefined") return response.result;
  if (typeof response.payload !== "undefined") return response.payload;
  if (typeof response.lead !== "undefined") return response.lead;

  return response;
};

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;

  if (isRecord(response)) {
    if (Array.isArray(response.data)) return response.data;
    if (isRecord(response.data) && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    if (isRecord(response.data) && Array.isArray(response.data.leads)) {
      return response.data.leads;
    }
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.leads)) return response.leads;
    if (Array.isArray(response.result)) return response.result;
    if (isRecord(response.result) && Array.isArray(response.result.items)) {
      return response.result.items;
    }
    if (Array.isArray(response.payload)) return response.payload;
    if (isRecord(response.payload) && Array.isArray(response.payload.items)) {
      return response.payload.items;
    }
  }

  throw new Error("Invalid leads list response shape from API.");
}

function unwrapSingle(response: unknown): unknown {
  const unwrapped = unwrapMaybeEnvelope(response);

  if (Array.isArray(unwrapped)) {
    const [first] = unwrapped;
    if (first) return first;
  }

  if (isRecord(unwrapped) && Array.isArray(unwrapped.items)) {
    const [first] = unwrapped.items;
    if (first) return first;
  }

  if (isRecord(unwrapped)) {
    return unwrapped;
  }

  throw new Error("Invalid lead response shape from API.");
}

function toQueryString(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") {
      query.set(key, value);
    }
  });
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function normalizeChannel(value: unknown): LeadChannel {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (normalized === "in-app") return "In-app";
  if (normalized === "walk-in") return "Walk-in";
  if (normalized === "referral") return "Referral";
  if (normalized === "other") return "Other";

  return "Other";
}

function normalizeStatus(value: unknown): LeadStatus {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "new") return "New";
  if (normalized === "contacted") return "Contacted";
  if (normalized === "converted") return "Converted";
  if (normalized === "closed") return "Closed";

  return "New";
}

function normalizeLead(input: unknown): Lead {
  if (!isRecord(input)) {
    throw new Error("Invalid lead item response shape from API.");
  }

  const id = readString(input, ["id", "leadId", "lead_id"]);
  if (!id) {
    throw new Error("Lead response is missing an id.");
  }

  const studentName =
    readString(input, ["studentName", "student_name", "name"]) || "";
  const primaryContactName =
    readString(input, [
      "primaryContactName",
      "primary_contact_name",
      "guardianName",
      "guardian_name",
      "name",
    ]) || "";
  const phone =
    readString(input, ["phone", "phone_number", "mobile"]) || "";
  const email = readString(input, ["email"]);
  const createdAt =
    readString(input, ["createdAt", "created_at"]) || new Date().toISOString();
  const notes = readString(input, ["notes"]);
  const channel = normalizeChannel(
    input.channel ?? input.source ?? input.channel_name
  );
  const status = normalizeStatus(input.status);

  return {
    ...input,
    id,
    studentName,
    primaryContactName,
    phone,
    email,
    channel,
    source: channel,
    status,
    notes,
    createdAt,
    name: readString(input, ["name"]) || studentName || primaryContactName,
  };
}

function toLeadRequestPayload(
  payload: CreateLeadPayload | UpdateLeadPayload
): ApiRecord {
  const body: ApiRecord = {};

  if (typeof payload.studentName !== "undefined") {
    body.studentName = normalizeTextForApi(payload.studentName);
  }
  if (typeof payload.primaryContactName !== "undefined") {
    body.primaryContactName = normalizeTextForApi(payload.primaryContactName);
  }
  if (typeof payload.phone !== "undefined") {
    body.phone = normalizePhoneForApi(payload.phone);
  }
  if (typeof payload.email !== "undefined") {
    body.email = normalizeTextForApi(payload.email);
  }
  if (typeof payload.channel !== "undefined") {
    body.channel = normalizeChannel(payload.channel);
  }
  if ("status" in payload && typeof payload.status !== "undefined") {
    body.status = normalizeStatus(payload.status);
  }
  if (typeof payload.notes !== "undefined") {
    body.notes = normalizeTextForApi(payload.notes);
  }

  return body;
}

export interface FetchLeadsParams {
  status?: string;
  channel?: string;
  search?: string;
}

export async function fetchLeads(
  params: FetchLeadsParams = {}
): Promise<Lead[]> {
  const query = toQueryString({
    status: params.status,
    channel: params.channel,
    search: params.search,
  });
  const response = await apiGet<unknown>(`${LEADS_ENDPOINT}${query}`);
  return unwrapArray(response).map(normalizeLead);
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const response = await apiGet<unknown>(`${LEADS_ENDPOINT}/${id}`);
  return normalizeLead(unwrapSingle(response));
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const response = await apiPost<unknown>(
    LEADS_ENDPOINT,
    toLeadRequestPayload(payload)
  );
  return normalizeLead(unwrapSingle(response));
}

export async function updateLead(
  id: string,
  payload: UpdateLeadPayload
): Promise<Lead> {
  const response = await apiPatch<unknown>(
    `${LEADS_ENDPOINT}/${id}`,
    toLeadRequestPayload(payload)
  );
  return normalizeLead(unwrapSingle(response));
}

// Swagger exposes no dedicated convert/create-application endpoint for leads.
export async function convertLead(id: string): Promise<Lead> {
  return updateLead(id, { status: "Converted" });
}
