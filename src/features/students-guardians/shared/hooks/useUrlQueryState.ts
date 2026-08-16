"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export type UrlUpdateMode = "push" | "replace";
export type Normalizer<T extends Record<string, string>> = (
  values: T,
) => Partial<Record<keyof T, string | null>> | null;

export interface UrlQueryStateConfig<T extends Record<string, string>> {
  defaults: T;
  debouncedKeys?: Array<keyof T>;
  modeByKey?: Partial<Record<keyof T, UrlUpdateMode>>;
  shouldOmit?: Partial<
    Record<keyof T, (value: string, defaultValue: string) => boolean>
  >;
  normalize?: Normalizer<T>;
  debounceMs?: number;
}

export interface UrlQueryStateResult<T extends Record<string, string>> {
  values: T;
  setValue: <K extends keyof T>(
    key: K,
    value: T[K] | null,
    modeOverride?: UrlUpdateMode,
  ) => void;
  setValues: (
    updates: Partial<Record<keyof T, string | null>>,
    modeOverride?: UrlUpdateMode,
  ) => void;
  replaceValues: (updates: Partial<Record<keyof T, string | null>>) => void;
  reset: (keys?: Array<keyof T>, modeOverride?: UrlUpdateMode) => void;
}

const buildValuesFromSearchParams = <T extends Record<string, string>>(
  searchParams: URLSearchParams,
  defaults: T,
): T => {
  return Object.keys(defaults).reduce((acc, key) => {
    const typedKey = key as keyof T;
    acc[typedKey] = (searchParams.get(key) ?? defaults[typedKey]) as T[keyof T];
    return acc;
  }, { ...defaults });
};

export function useUrlQueryState<T extends Record<string, string>>(
  config: UrlQueryStateConfig<T>,
): UrlQueryStateResult<T> {
  const {
    defaults,
    debouncedKeys = [],
    modeByKey = {} as Partial<Record<keyof T, UrlUpdateMode>>,
    shouldOmit = {} as Partial<
      Record<keyof T, (value: string, defaultValue: string) => boolean>
    >,
    normalize,
    debounceMs = 300,
  } = config;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const defaultsSignature = JSON.stringify(defaults);
  const defaultValues = useMemo(
    () => JSON.parse(defaultsSignature) as T,
    [defaultsSignature],
  );

  const readValues = useCallback(
    () =>
      buildValuesFromSearchParams(
        new URLSearchParams(searchParamsString),
        defaultValues,
      ),
    [defaultValues, searchParamsString],
  );

  const [values, setValuesState] = useState<T>(readValues);

  const applyUrlUpdate = useCallback(
    (
      updates: Partial<Record<keyof T, string | null>>,
      modeOverride?: UrlUpdateMode,
    ) => {
      const nextParams = new URLSearchParams(searchParamsString);
      let resolvedMode: UrlUpdateMode | undefined = modeOverride;

      Object.entries(updates).forEach(([key, rawValue]) => {
        const typedKey = key as keyof T;
        const defaultValue = defaultValues[typedKey];
        const value = rawValue ?? defaultValue;
        const omit =
          shouldOmit[typedKey]?.(value, defaultValue) ??
          (!value || value === defaultValue);

        if (!resolvedMode) {
          resolvedMode = modeByKey[typedKey];
        }

        if (omit) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });

      const nextQuery = nextParams.toString();
      if (nextQuery === searchParamsString) {
        return;
      }

      const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const mode = resolvedMode ?? "push";
      if (mode === "replace") {
        router.replace(href, { scroll: false });
        return;
      }

      router.push(href, { scroll: false });
    },
    [
      defaultValues,
      modeByKey,
      pathname,
      router,
      searchParamsString,
      shouldOmit,
    ],
  );

  const scheduleDebouncedUpdate = useDebouncedCallback(
    (
      updates: Partial<Record<keyof T, string | null>>,
      modeOverride?: UrlUpdateMode,
    ) => {
      applyUrlUpdate(updates, modeOverride);
    },
    debounceMs,
  );

  const setValues = useCallback(
    (
      updates: Partial<Record<keyof T, string | null>>,
      modeOverride?: UrlUpdateMode,
    ) => {
      setValuesState((current) => {
        const nextValues = { ...current };
        Object.entries(updates).forEach(([key, rawValue]) => {
          const typedKey = key as keyof T;
          nextValues[typedKey] = (rawValue ?? defaultValues[typedKey]) as T[keyof T];
        });
        return nextValues;
      });

      const hasDebouncedKey = Object.keys(updates).some((key) =>
        debouncedKeys.includes(key as keyof T),
      );

      if (hasDebouncedKey) {
        scheduleDebouncedUpdate(updates, modeOverride);
        return;
      }

      applyUrlUpdate(updates, modeOverride);
    },
    [applyUrlUpdate, debouncedKeys, defaultValues, scheduleDebouncedUpdate],
  );

  const setValue = useCallback(
    <K extends keyof T>(
      key: K,
      value: T[K] | null,
      modeOverride?: UrlUpdateMode,
    ) => {
      setValues({ [key]: value } as Partial<Record<keyof T, string | null>>, modeOverride);
    },
    [setValues],
  );

  const replaceValues = useCallback(
    (updates: Partial<Record<keyof T, string | null>>) => {
      setValues(updates, "replace");
    },
    [setValues],
  );

  const reset = useCallback(
    (keys?: Array<keyof T>, modeOverride: UrlUpdateMode = "replace") => {
      const targetKeys = keys ?? (Object.keys(defaultValues) as Array<keyof T>);
      const resetUpdates = targetKeys.reduce(
        (acc, key) => {
          acc[key] = null;
          return acc;
        },
        {} as Partial<Record<keyof T, string | null>>,
      );
      setValues(resetUpdates, modeOverride);
    },
    [defaultValues, setValues],
  );

  useEffect(() => {
    const nextValues = readValues();

    queueMicrotask(() => {
      setValuesState((current) => {
        const hasChanged = (Object.keys(defaultValues) as Array<keyof T>).some(
          (key) => current[key] !== nextValues[key],
        );
        return hasChanged ? nextValues : current;
      });
    });
  }, [defaultValues, readValues]);

  useEffect(() => {
    if (!normalize) {
      return;
    }

    const normalizedUpdates = normalize(values);
    if (!normalizedUpdates) {
      return;
    }

    const hasUpdates = Object.keys(normalizedUpdates).length > 0;
    if (!hasUpdates) {
      return;
    }

    queueMicrotask(() => {
      replaceValues(normalizedUpdates);
    });
  }, [normalize, replaceValues, values]);

  return {
    values,
    setValue,
    setValues,
    replaceValues,
    reset,
  };
}
