"use client";

import React, { useRef, useState, useEffect } from "react";
import { Dropdown, Switch, Input, Button, Label, DatePicker } from "@heroui/react";
import { parseDate, fromDate, getLocalTimeZone, toCalendarDate } from "@internationalized/date";
import { useAppDispatch } from "@/lib/hooks";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParams } from "next/navigation";

import {
  optionsSearchChange,
  textSearchChange,
} from "@/lib/features/datatable/datatableSlice";

// Utility function to merge classnames
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// --- INTERFACES ---
interface FilterComponent {
  name: string;
  type:
  | "yearnumber"
  | "weeknumber"
  | "date-picker"
  | "startEndDatePicker"
  | "dateRangeFilter"
  | "yearFilter"
  | "inputswitch"
  | "dropdown";
  placeholder?: string;
  width?: string;
  hidden?: boolean;
  showInFilter?: boolean;
  data?: any[];
  defaultValue?: any;
  startFieldName?: string;
  endFieldName?: string;
  startDefaultValue?: any;
  endDefaultValue?: any;
  allowNullEndDate?: boolean;
  label?: string;
  onChange?: (val: any) => void;
  comp?: any;
  custom?: boolean;
  childName?: string;
  showAllOptions?: { label: string; value: any };
  searchable?: boolean;
  customLabel?: boolean;
  change?: (val: any) => void;
  resetChild?: () => void;
}

interface FilterToolsProps {
  metadata: any;
  id?: string;
  params?: any;
  renderTableInfo?: () => React.ReactNode;
  className?: string;
  onInteract?: () => void;
  compact?: boolean;
}

const safeToHeroDate = (value: any) => {
  if (!value) return null;
  try {
    if (typeof value === "string") {
      const datePart = value.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return parseDate(datePart);
      }
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return toCalendarDate(fromDate(d, getLocalTimeZone()));
  } catch {
    return null;
  }
};

const FilterTools: React.FC<FilterToolsProps> = ({
  metadata,
  renderTableInfo,
  onInteract,
  className,
  compact = false,
}) => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const { components, inputPlaceholder, inputWidth } = metadata.filterTools;
  const softMode = Boolean(metadata?.filterTools?.softMode);
  const hasInitialized = useRef(false);

  const startEndProps = components.find(
    (x: any) => x?.type === "startEndDatePicker",
  );
  const startDateFieldName = startEndProps?.startFieldName ?? "FromDate";
  const endDateFieldName = startEndProps?.endFieldName ?? "ToDate";

  // Use any to bypass beta version type mismatches for DatePicker
  const CustomDatePicker = DatePicker as any;

  // --- STATE ---
  const [filterValues, setFilterValues] = useState<any>(() => {
    const controls: any = {};
    components.forEach((item: FilterComponent) => {
      if (item.type === "startEndDatePicker") {
        controls[startDateFieldName] = item.startDefaultValue || null;
        controls[endDateFieldName] = item.endDefaultValue || null;
      } else {
        controls[item.name] = item.defaultValue?.value ?? "";
      }
    });

    // Merge URL Params
    searchParams.forEach((value, key) => {
      if (controls.hasOwnProperty(key)) controls[key] = value;
    });

    return controls;
  });
  const [inputSearch, setInputSearch] = useState("");
  const [isShowCustomizedFilter, setIsShowCustomizedFilter] = useState(false);

  // --- LOGIC ---
  useEffect(() => {
    if (hasInitialized.current) return;

    let immediateApiCall = true;
    components.forEach((item: FilterComponent) => {
      if (item.resetChild) item.resetChild();
      if (item.type === "startEndDatePicker") {
        immediateApiCall = false;
      }
    });

    if (immediateApiCall) dispatch(optionsSearchChange(filterValues));
    hasInitialized.current = true;
  }, [components, filterValues, dispatch]);

  const debouncedSearch = useDebouncedCallback((val: string) => {
    dispatch(textSearchChange(val));
  }, 800);

  const onFilter = (value: any, fieldName: string, childName?: string) => {
    const updated = { ...filterValues, [fieldName]: value };
    if (childName) updated[childName] = "";

    setFilterValues(updated);
    dispatch(optionsSearchChange(updated));
  };

  const refresh = () => {
    setInputSearch("");
    dispatch(textSearchChange(""));
    hasInitialized.current = false;

    // Re-initialize filter values
    let immediateApiCall = true;
    const controls: any = {};

    components.forEach((item: FilterComponent) => {
      if (item.resetChild) item.resetChild();

      if (item.type === "startEndDatePicker") {
        immediateApiCall = false;
        controls[startDateFieldName] = item.startDefaultValue || null;
        controls[endDateFieldName] = item.endDefaultValue || null;
      } else {
        controls[item.name] = item.defaultValue?.value ?? "";
      }
    });

    // Merge URL Params
    searchParams.forEach((value, key) => {
      if (controls.hasOwnProperty(key)) controls[key] = value;
    });

    setFilterValues(controls);
    if (immediateApiCall) dispatch(optionsSearchChange(controls));
    setIsShowCustomizedFilter(false);
  };

  // --- TEMPLATES ---
  const renderComponentTemplate = (isCustomMode = false) => {
    const list = components.filter((comp: FilterComponent) =>
      isCustomMode ? comp.showInFilter === true : !comp.showInFilter,
    );

    return list.map((comp: FilterComponent, idx: number) => {
      if (comp.hidden) return null;

      // 1. Dropdown HeroUI
      if (comp.type === "dropdown" || (!comp.type && comp.data)) {
        const selectedItem = (comp.data || []).find(
          (item: any) => item.value === filterValues?.[comp.name],
        );

        return (
          <div key={comp.name + idx} className={cn("", comp.width || "")}>
            <Dropdown className="w-full">
              <Dropdown.Trigger>
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "w-full h-8 flex items-center justify-between text-sm font-medium transition-colors px-2.5 cursor-pointer select-none",
                    softMode
                      ? "rounded-xl bg-slate-50 border border-transparent hover:border-blue-200 focus:ring-2 focus:ring-blue-500/20"
                      : "rounded-xl bg-white border border-slate-200 hover:border-slate-300",
                  )}
                >
                  <span className="text-slate-700 truncate">
                    {selectedItem?.label || comp.placeholder || "-- Chọn --"}
                  </span>
                  <i className="fas fa-chevron-down text-xs ml-2 text-slate-500 flex-shrink-0" />
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom start">
                <Dropdown.Menu
                  onAction={(key) => onFilter(key, comp.name, comp.childName)}
                  selectedKeys={
                    filterValues?.[comp.name]
                      ? [String(filterValues[comp.name])]
                      : []
                  }
                >
                  <Dropdown.Item id="" textValue="Tất cả">
                    -- Chọn --
                  </Dropdown.Item>
                  {(comp.data || []).map((item: any) => (
                    <Dropdown.Item
                      id={String(item.value)}
                      key={String(item.value)}
                      textValue={item.label}
                    >
                      {item.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        );
      }

      // 2. DateRangePicker HeroUI
      if (comp.type === "startEndDatePicker") {
        return (
          <div key={comp.name + idx} className="flex gap-2 items-center">
            <div className="w-[140px]">
              <CustomDatePicker
                label="Từ ngày"
                labelPlacement="inside"
                variant="bordered"
                showMonthAndYearPickers
                className="w-full bg-white rounded-xl shadow-sm"
                value={safeToHeroDate(filterValues?.[startDateFieldName])}
                onChange={(val: any) => {
                  const updated = {
                    ...filterValues,
                    [startDateFieldName]: val ? val.toDate(getLocalTimeZone()).toISOString() : "",
                  };
                  setFilterValues(updated);
                  dispatch(optionsSearchChange(updated));
                }}
              />
            </div>
            <span className="text-gray-400 font-medium">-</span>
            <div className="w-[140px]">
              <CustomDatePicker
                label="Đến ngày"
                labelPlacement="inside"
                variant="bordered"
                showMonthAndYearPickers
                className="w-full bg-white rounded-xl shadow-sm"
                value={safeToHeroDate(filterValues?.[endDateFieldName])}
                onChange={(val: any) => {
                  const updated = {
                    ...filterValues,
                    [endDateFieldName]: val ? val.toDate(getLocalTimeZone()).toISOString() : "",
                  };
                  setFilterValues(updated);
                  dispatch(optionsSearchChange(updated));
                }}
              />
            </div>
          </div>
        );
      }

      // 3. Switch HeroUI
      if (comp.type === "inputswitch") {
        return (
          <div key={comp.name + idx} className="flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={filterValues?.[comp.name] || false}
              onChange={(isSelected: boolean) =>
                onFilter(isSelected, comp.name)
              }
            >
              <Label className="text-sm text-gray-700">{comp.label}</Label>
            </Switch>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", compact ? "py-0" : "py-2", className)} onClick={onInteract}>
      <div className="flex flex-col gap-2">
        {renderTableInfo && renderTableInfo()}

        <div className={cn("flex items-center gap-1.5 overflow-x-auto", compact ? "pb-0" : "pb-1")}>
          {/* Render components default */}
          {renderComponentTemplate(false)}
          {/* Search Box HeroUI */}
          {inputPlaceholder && (
            <div className={cn("relative", inputWidth || "w-64")}>
              <i className="fas fa-search text-slate-400 text-sm absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder={inputPlaceholder}
                value={inputSearch}
                onChange={(e) => {
                  setInputSearch(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className={cn(
                  "w-full h-8 text-sm font-medium pl-9 pr-8 transition-colors",
                  softMode
                    ? "rounded-xl bg-slate-50 border border-transparent hover:border-blue-200 focus:ring-2 focus:ring-blue-500/20 focus:border-transparent outline-none"
                    : "rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-300 outline-none",
                )}
              />
              {inputSearch && (
                <button
                  onClick={() => {
                    setInputSearch("");
                    debouncedSearch("");
                  }}
                  className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              )}
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={() => setIsShowCustomizedFilter(!isShowCustomizedFilter)}
              className={cn(
                "rounded-md h-8 w-8 border-0 bg-transparent text-slate-500 hover:bg-slate-100 transition-colors",
                isShowCustomizedFilter
                  ? "text-blue-600 bg-blue-50"
                  : "",
              )}
            >
              <i className="fas fa-filter text-sm" />
            </Button>

            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={refresh}
              className="rounded-md h-8 w-8 border-0 bg-transparent text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <i className="fas fa-sync-alt text-sm" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isShowCustomizedFilter && (
        <div className="animate-fade-in">
          <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 justify-end">
            {renderComponentTemplate(true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterTools;
