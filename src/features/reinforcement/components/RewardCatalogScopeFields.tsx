"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import {
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface RewardCatalogScopeValue {
  isGlobal: boolean;
  academicYearId: string | null;
  termId: string | null;
}

interface RewardCatalogScopeFieldsProps {
  academicYears: AcademicYear[];
  defaultAcademicYearId: string;
  defaultTermId: string;
  value: RewardCatalogScopeValue;
  onChange: (value: RewardCatalogScopeValue) => void;
  disabled?: boolean;
  hideAcademicContextSelectors?: boolean;
}

function localizedName(
  item: { name: string; nameAr?: string; nameEn?: string },
  locale: string,
) {
  return (locale === "ar" ? item.nameAr : item.nameEn) || item.name;
}

export default function RewardCatalogScopeFields({
  academicYears,
  defaultAcademicYearId,
  defaultTermId,
  value,
  onChange,
  disabled = false,
  hideAcademicContextSelectors = false,
}: RewardCatalogScopeFieldsProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [terms, setTerms] = useState<Term[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const scopeRef = useRef(value);

  useEffect(() => {
    scopeRef.current = value;
  }, [value]);

  useEffect(() => {
    if (hideAcademicContextSelectors || value.isGlobal || !value.academicYearId) {
      return;
    }

    let active = true;
    void Promise.resolve().then(() => setLoadingTerms(true));
    void Promise.resolve().then(() => setTermsError(false));
    void fetchTermsByYear(value.academicYearId)
      .then((nextTerms) => {
        if (!active) return;
        setTerms(nextTerms);
        const currentScope = scopeRef.current;
        if (
          currentScope.termId &&
          !nextTerms.some((term) => term.id === currentScope.termId)
        ) {
          onChange({ ...currentScope, termId: null });
        }
      })
      .catch(() => {
        if (!active) return;
        setTerms([]);
        setTermsError(true);
      })
      .finally(() => {
        if (active) setLoadingTerms(false);
      });

    return () => {
      active = false;
    };
  }, [hideAcademicContextSelectors, onChange, value.academicYearId, value.isGlobal]);

  const yearOptions = useMemo(
    () =>
      academicYears.map((year) => ({
        value: year.id,
        label: localizedName(year, locale),
      })),
    [academicYears, locale],
  );
  const termOptions = useMemo(
    () =>
      terms.map((term) => ({
        value: term.id,
        label: localizedName(term, locale),
      })),
    [locale, terms],
  );

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {t("rewardsModule.catalog.form.academicScope")}
        </p>
        <label className="mt-3 flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={value.isGlobal}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? { isGlobal: true, academicYearId: null, termId: null }
                  : {
                      isGlobal: false,
                      academicYearId:
                        defaultAcademicYearId || academicYears[0]?.id || null,
                      termId: defaultTermId || null,
                    },
              )
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span>
            <span className="block font-medium text-gray-900">
              {t("rewardsModule.catalog.form.globalReward")}
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              {t("rewardsModule.catalog.form.globalRewardHelp")}
            </span>
          </span>
        </label>
      </div>

      {!hideAcademicContextSelectors ? <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={t("rewardsModule.catalog.form.academicYear")}
          value={value.academicYearId || ""}
          options={yearOptions}
          disabled={disabled || value.isGlobal}
          searchable
          onChange={(academicYearId) =>
            onChange({ isGlobal: false, academicYearId, termId: null })
          }
        />
        <Select
          label={t("rewardsModule.catalog.form.term")}
          value={value.termId || ""}
          options={termOptions}
          disabled={
            disabled || value.isGlobal || !value.academicYearId || loadingTerms
          }
          searchable
          onChange={(termId) => onChange({ ...value, termId })}
        />
      </div> : null}

      {!value.isGlobal && termsError ? (
        <p className="text-sm text-rose-600" role="alert">
          {t("rewardsModule.catalog.form.termsLoadFailed")}
        </p>
      ) : null}
    </section>
  );
}
