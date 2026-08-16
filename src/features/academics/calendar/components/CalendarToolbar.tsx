"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, Filter, X, LayoutGrid, List, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/input/DatePicker";
import { AcademicEvent } from "@/features/academics/calendar/services/calendarService";
import type { CalendarScopeTargetOption } from "@/features/academics/calendar/types";

import {
  Drawer,
  Popover,
  IconButton,
  useMediaQuery,
  useTheme,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Divider,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

interface CalendarToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  typeFilters: AcademicEvent["type"][];
  onTypeFiltersChange: (types: AcademicEvent["type"][]) => void;
  scopeFilter: "ALL" | AcademicEvent["scopeType"];
  onScopeFilterChange: (scope: "ALL" | AcademicEvent["scopeType"]) => void;
  onAddEvent: () => void;
  onRefresh?: () => void;
  isReadOnly: boolean;
  view: "month" | "week" | "agenda";
  onViewChange: (view: "month" | "week" | "agenda") => void;
  displayMode: "compact" | "comfortable" | "minimal";
  onDisplayModeChange: (mode: "compact" | "comfortable" | "minimal") => void;
  academicYearId?: string;
  termId?: string;
  scopeIdFilter?: string | null;
  onScopeIdFilterChange?: (id: string | null) => void;
  stages: CalendarScopeTargetOption[];
  grades: CalendarScopeTargetOption[];
  sections: CalendarScopeTargetOption[];
}

// Filters content component (reused in both Popover and Drawer)
function FiltersContent({
  typeFilters,
  onTypeToggle,
  scopeFilter,
  onScopeChange,
  scopeIdFilter,
  onScopeIdChange,
  stages,
  grades,
  sections,
  onClear,
  onClose,
  t,
  locale,
}: {
  typeFilters: AcademicEvent["type"][];
  onTypeToggle: (type: AcademicEvent["type"]) => void;
  scopeFilter: "ALL" | AcademicEvent["scopeType"];
  onScopeChange: (scope: "ALL" | AcademicEvent["scopeType"]) => void;
  scopeIdFilter?: string | null;
  onScopeIdChange?: (id: string | null) => void;
  stages: CalendarScopeTargetOption[];
  grades: CalendarScopeTargetOption[];
  sections: CalendarScopeTargetOption[];
  onClear: () => void;
  onClose: () => void;
  t: (key: string) => string;
  locale: string;
}) {
  const eventTypes: AcademicEvent["type"][] = ["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"];
  const scopeTypes: ("ALL" | AcademicEvent["scopeType"])[] = ["ALL", "SCHOOL", "STAGE", "GRADE", "SECTION"];

  let targetOptions: CalendarScopeTargetOption[] = [];
  if (scopeFilter === "STAGE") targetOptions = stages;
  if (scopeFilter === "GRADE") targetOptions = grades;
  if (scopeFilter === "SECTION") targetOptions = sections;

  const getLocalizedScopeTargetName = (option: CalendarScopeTargetOption) => {
    if (locale === "ar") {
      return option.nameAr || option.name;
    }

    return option.nameEn || option.name;
  };

  return (
    <div className="space-y-4">
      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type Filters */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t("filters.type")}
          </h3>
          <FormGroup>
            {eventTypes.map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={typeFilters.includes(type)}
                    onChange={() => onTypeToggle(type)}
                    size="small"
                    sx={{
                      color: "var(--color-neutral-400, #9ca3af)",
                      "&.Mui-checked": {
                        color: "var(--color-primary, #006D82)",
                      },
                    }}
                  />
                }
                label={
                  <span className="text-sm text-gray-700">
                    {t(`event_types.${type.toLowerCase()}`)}
                  </span>
                }
              />
            ))}
          </FormGroup>
        </div>

        {/* Scope Filter */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t("filters.scope")}
          </h3>
          <RadioGroup
            value={scopeFilter}
            onChange={(e) => onScopeChange(e.target.value as typeof scopeFilter)}
          >
            {scopeTypes.map((scope) => (
              <FormControlLabel
                key={scope}
                value={scope}
                control={
                  <Radio
                    size="small"
                    sx={{
                      color: "var(--color-neutral-400, #9ca3af)",
                      "&.Mui-checked": {
                        color: "var(--color-primary, #006D82)",
                      },
                    }}
                  />
                }
                label={
                  <span className="text-sm text-gray-700">
                    {t(`scopes.${scope.toLowerCase()}`)}
                  </span>
                }
              />
            ))}
          </RadioGroup>

          {/* Scope Target Select */}
          {["STAGE", "GRADE", "SECTION"].includes(scopeFilter) && onScopeIdChange && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t("scope_target")}
              </h3>
              <FormControl size="small" fullWidth>
                <Select
                  value={scopeIdFilter || ""}
                  onChange={(e) => onScopeIdChange(e.target.value)}
                  displayEmpty
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-border, #e5e7eb)",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>{t("scopes.all")}</em>
                  </MenuItem>
                  {targetOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {getLocalizedScopeTargetName(opt)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClear}>
          {t("clear_filters")}
        </Button>
        <Button variant="primary" size="sm" onClick={onClose}>
          {t("apply")}
        </Button>
      </div>
    </div>
  );
}

export default function CalendarToolbar({
  currentDate,
  onDateChange,
  typeFilters,
  onTypeFiltersChange,
  scopeFilter,
  onScopeFilterChange,
  onAddEvent,
  onRefresh,
  isReadOnly,
  view,
  onViewChange,
  displayMode,
  onDisplayModeChange,
  scopeIdFilter,
  onScopeIdFilterChange,
  stages,
  grades,
  sections,
}: CalendarToolbarProps) {
  const t = useTranslations("academics.calendar");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const [filtersAnchorEl, setFiltersAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDatePickerDialog, setShowDatePickerDialog] = useState(false);

  const showFiltersPopover = Boolean(filtersAnchorEl);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleJumpToDate = (date: Date | null) => {
    if (!date) return;

    // Navigate to the month containing this date
    onDateChange(date);
    
    // Close mobile dialog if open
    if (isMobile) {
      setShowDatePickerDialog(false);
    }
  };

  const handleTypeToggle = (type: AcademicEvent["type"]) => {
    if (typeFilters.includes(type)) {
      onTypeFiltersChange(typeFilters.filter((t) => t !== type));
    } else {
      onTypeFiltersChange([...typeFilters, type]);
    }
  };

  const handleClearFilters = () => {
    onTypeFiltersChange(["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"]);
    onScopeFilterChange("ALL");
    if (onScopeIdFilterChange) onScopeIdFilterChange(null);
  };

  const handleOpenFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      setShowFiltersDrawer(true);
    } else {
      setFiltersAnchorEl(event.currentTarget);
    }
  };

  const handleCloseFilters = () => {
    setFiltersAnchorEl(null);
    setShowFiltersDrawer(false);
  };

  const monthName = currentDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const weekRange = useMemo(() => {
    if (view !== "week") return "";
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }, [currentDate, view, locale]);

  const displayLabel = view === "week" ? weekRange : monthName;

  // RTL-aware icons
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* Toolbar Container */}
      <div
        className="bg-white border-b px-4 md:px-6 py-3"
        style={{
          borderColor: "var(--color-border, #e5e7eb)",
        }}
      >
        {/* First Row: Navigation + View/Mode Switchers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          {/* Left Section: Navigation + Date Label */}
          <div className="flex items-center gap-4">
            {/* Navigation Buttons */}
            {view !== "agenda" && (
              <div
                className="inline-flex items-center rounded-lg border overflow-hidden"
                style={{
                  borderColor: "var(--color-border, #e5e7eb)",
                  backgroundColor: "var(--color-surface-50, #f9fafb)",
                }}
              >
                <button
                  onClick={handlePrevMonth}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors"
                  aria-label={t("prev")}
                >
                  <PrevIcon className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border-r border-l"
                  style={{ borderColor: "var(--color-border, #e5e7eb)" }}
                >
                  {t("today")}
                </button>
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors "
                  aria-label={t("next")}
                >
                  <NextIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}

            {/* Date Label */}
            <h2
              className="text-lg font-semibold"
              style={{
                color: "var(--color-text-primary, #111827)",
                direction: isRTL ? "rtl" : "ltr",
              }}
            >
              {displayLabel}
            </h2>

            {/* Jump to Date Picker */}
            {view !== "agenda" && (
              <>
                {/* Desktop: Inline DatePicker */}
                {!isMobile && (
                  <div className="w-48">
                    <DatePicker
                      value={currentDate}
                      onChange={handleJumpToDate}
                      inputSize="sm"
                      placeholder={t("goToDate")}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Mobile: Icon Button */}
                {isMobile && (
                  <IconButton
                    size="small"
                    onClick={() => setShowDatePickerDialog(true)}
                    sx={{
                      color: "var(--color-primary, #006D82)",
                      backgroundColor: "var(--color-primary-50, #e0f2f5)",
                      "&:hover": {
                        backgroundColor: "var(--color-primary-100, #b3e0e8)",
                      },
                    }}
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </IconButton>
                )}
              </>
            )}
          </div>

          {/* Right Section: View & Display Mode Switchers */}
          <div className="flex items-center gap-2">
            {/* View Switcher - Desktop: Tabs, Mobile: Select */}
            {isMobile ? (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={view}
                  onChange={(e) => onViewChange(e.target.value as typeof view)}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-border, #e5e7eb)",
                    },
                  }}
                >
                  <MenuItem value="month">{t("views.month")}</MenuItem>
                  <MenuItem value="week">{t("views.week")}</MenuItem>
                  <MenuItem value="agenda">{t("views.agenda")}</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Tabs
                value={view}
                onChange={(_, newValue) => onViewChange(newValue)}
                sx={{
                  minHeight: 40,
                  "& .MuiTab-root": {
                    minHeight: 40,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary, #6b7280)",
                    "&.Mui-selected": {
                      color: "var(--color-primary, #006D82)",
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "var(--color-primary, #006D82)",
                  },
                }}
              >
                <Tab icon={<LayoutGrid className="w-4 h-4" />} className="gap-2" iconPosition="start" label={t("views.month")} value="month" />
                <Tab icon={<CalendarIcon className="w-4 h-4" />} className="gap-2" iconPosition="start" label={t("views.week")} value="week" />
                <Tab icon={<List className="w-4 h-4" />} iconPosition="start" className="gap-2" label={t("views.agenda")} value="agenda" />
              </Tabs>
            )}

            {/* Display Mode Switcher */}
            {view !== "agenda" && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={displayMode}
                  onChange={(e) => onDisplayModeChange(e.target.value as typeof displayMode)}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-border, #e5e7eb)",
                    },
                  }}
                >
                  <MenuItem value="compact">{t("modes.compact")}</MenuItem>
                  <MenuItem value="comfortable">{t("modes.comfortable")}</MenuItem>
                  <MenuItem value="minimal">{t("modes.minimal")}</MenuItem>
                </Select>
              </FormControl>
            )}
          </div>
        </div>

        {/* Second Row: Filters + Actions */}
        <div className="flex items-center justify-end gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <IconButton
              size="small"
              onClick={onRefresh}
              sx={{ color: "var(--color-text-secondary, #6b7280)", mr: 1 }}
              title={t("refresh")}
            >
              <RefreshCw className="w-4 h-4" />
            </IconButton>
          )}

          {/* Filters Button */}
          <Button
            onClick={handleOpenFilters}
            size="md"
            aria-controls={showFiltersPopover ? "filters-popover" : undefined}
            aria-expanded={showFiltersPopover}
            aria-haspopup="true"
             leftIcon={ <Filter className="w-4 h-4" />}
             variant="secondary"
          >
           
            {t("filters.title")}
          </Button>

          {/* Add Event Button */}
          <Button
            variant="primary"
            size="md"
            onClick={onAddEvent}
            disabled={isReadOnly}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("add_event")}
          </Button>
        </div>
      </div>

      {/* Desktop Filters Popover */}
      <Popover
        id="filters-popover"
        open={showFiltersPopover}
        anchorEl={filtersAnchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isRTL ? "left" : "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isRTL ? "left" : "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              borderRadius: 3,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid var(--color-border, #e5e7eb)",
            },
          },
        }}
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {t("filters.title")}
            </h3>
            <IconButton
              size="small"
              onClick={handleCloseFilters}
              sx={{ color: "var(--color-text-secondary, #6b7280)" }}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          <FiltersContent
            typeFilters={typeFilters}
            onTypeToggle={handleTypeToggle}
            scopeFilter={scopeFilter}
            onScopeChange={onScopeFilterChange}
            scopeIdFilter={scopeIdFilter}
            onScopeIdChange={onScopeIdFilterChange}
            stages={stages}
            grades={grades}
            sections={sections}
            onClear={handleClearFilters}
            onClose={handleCloseFilters}
            t={t}
            locale={locale}
          />
        </div>
      </Popover>

      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="bottom"
        open={showFiltersDrawer}
        onClose={handleCloseFilters}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "80vh",
            },
          },
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("filters.title")}
            </h2>
            <IconButton
              size="small"
              onClick={handleCloseFilters}
              sx={{ color: "var(--color-text-secondary, #6b7280)" }}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <FiltersContent
            typeFilters={typeFilters}
            onTypeToggle={handleTypeToggle}
            scopeFilter={scopeFilter}
            onScopeChange={onScopeFilterChange}
            scopeIdFilter={scopeIdFilter}
            onScopeIdChange={onScopeIdFilterChange}
            stages={stages}
            grades={grades}
            sections={sections}
            onClear={handleClearFilters}
            onClose={handleCloseFilters}
            t={t}
            locale={locale}
          />
        </div>
      </Drawer>

      {/* Mobile Date Picker Dialog */}
      <Drawer
        anchor="bottom"
        open={showDatePickerDialog}
        onClose={() => setShowDatePickerDialog(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "80vh",
            },
          },
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("goToDate")}
            </h2>
            <IconButton
              size="small"
              onClick={() => setShowDatePickerDialog(false)}
              sx={{ color: "var(--color-text-secondary, #6b7280)" }}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <DatePicker
            value={currentDate}
            onChange={handleJumpToDate}
            label={t("goToDate")}
            fullWidth
          />
        </div>
      </Drawer>
    </>
  );
}
