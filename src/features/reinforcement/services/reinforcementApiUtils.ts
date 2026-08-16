export type ReinforcementQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type ReinforcementQueryParams = Record<string, ReinforcementQueryValue>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function buildReinforcementQueryString(
  params?: ReinforcementQueryParams,
): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  const academicYearId = params.academicYearId ?? params.yearId;

  if (
    academicYearId !== undefined &&
    academicYearId !== null &&
    academicYearId !== "" &&
    academicYearId !== "all"
  ) {
    searchParams.set("academicYearId", String(academicYearId));
  }

  Object.entries(params).forEach(([key, value]) => {
    if (key === "academicYearId" || key === "yearId") {
      return;
    }

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function unwrapReinforcementItemResponse<T>(response: unknown): T {
  if (!isRecord(response)) return response as T;

  if ("data" in response && !Array.isArray(response.data)) {
    return response.data as T;
  }

  if ("item" in response) {
    return response.item as T;
  }

  if ("result" in response && !Array.isArray(response.result)) {
    return response.result as T;
  }

  if ("payload" in response && !Array.isArray(response.payload)) {
    return response.payload as T;
  }

  return response as T;
}

export function unwrapReinforcementListResponse<T>(response: unknown): {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
} {
  if (Array.isArray(response)) {
    return { items: response as T[] };
  }

  if (!isRecord(response)) {
    return { items: [] };
  }

  const listSource = [
    response,
    response.data,
    response.result,
    response.payload,
  ]
    .filter(isRecord)
    .find((source) => Array.isArray(source.items));

  if (listSource) {
    return {
      ...(listSource as Record<string, unknown>),
      items: listSource.items as T[],
      total:
        typeof listSource.total === "number" ? listSource.total : undefined,
      page: typeof listSource.page === "number" ? listSource.page : undefined,
      limit:
        typeof listSource.limit === "number" ? listSource.limit : undefined,
    };
  }

  if (Array.isArray(response.data)) {
    return { ...response, items: response.data as T[] };
  }

  if (Array.isArray(response.result)) {
    return { ...response, items: response.result as T[] };
  }

  if (Array.isArray(response.payload)) {
    return { ...response, items: response.payload as T[] };
  }

  return { ...response, items: [] };
}
