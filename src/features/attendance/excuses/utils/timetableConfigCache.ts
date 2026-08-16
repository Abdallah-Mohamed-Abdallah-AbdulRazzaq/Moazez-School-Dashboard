import type {
  FetchTimetableConfigParams,
  TimetableConfig,
} from "@/features/academics/timetable/services/timetableConfigService";

type TimetableConfigFetcher = (
  params: FetchTimetableConfigParams,
) => Promise<TimetableConfig | null>;

export function createTimetableConfigCache(fetchConfig: TimetableConfigFetcher) {
  const requests = new Map<string, Promise<TimetableConfig | null>>();

  return {
    get(key: string, params: FetchTimetableConfigParams) {
      const existingRequest = requests.get(key);
      if (existingRequest) return existingRequest;

      const request = fetchConfig(params);
      requests.set(key, request);
      return request;
    },
  };
}
