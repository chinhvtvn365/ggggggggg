"use client";

import React, { useRef, useState, useEffect } from "react";
import { DatePicker, Dropdown, Switch, Input, Button } from "@heroui/react";
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
  onInteract,
  className,
  compact = true,
}) => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const { components, inputPlaceholder, inputWidth } = metadata.filterTools;
  const hasInitialized = useRef(false);

  const startEndProps = components.find(
    (x: any) => x?.type === "startEndDatePicker",
  );
  const startDateFieldName = startEndProps?.startFieldName ?? "FromDate";
  const endDateFieldName = startEndProps?.endFieldName ?? "ToDate";


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
  const rowClass = compact
    ? "admin-filtertools-row flex items-center justify-center gap-2 overflow-x-auto"
    : "admin-filtertools-row flex items-center justify-center gap-3 overflow-x-auto";

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
            <Dropdown>
              <Dropdown.Trigger>
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex min-h-9 items-center gap-2 rounded-medium bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700"
                >
                  {selectedItem?.label || comp.placeholder || "-- Chọn --"}
                  <i className="fas fa-chevron-down" />
                </span>
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
                  <Dropdown.Item key="" textValue="Tất cả">
                    -- Chọn --
                  </Dropdown.Item>
                  {(comp.data || []).map((item: any) => (
                    <Dropdown.Item
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
            <div>
              <DatePicker
                aria-label="Từ ngày"
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
            <span>-</span>
            <div>
              <DatePicker
                aria-label="Đến ngày"
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
              {comp.label}
            </Switch>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className={cn("admin-filtertools-wrap", className)} onClick={onInteract}>
      <div className={rowClass}>
        {renderComponentTemplate(false)}
        {inputPlaceholder && (
          <div className={cn("admin-filtertools-search flex items-center gap-2", inputWidth || "")}>
            <span className="admin-filtertools-search-icon inline-flex items-center justify-center text-slate-500">
              <i className="fas fa-search" />
            </span>
            <Input
              type="text"
              variant="secondary"
              placeholder={inputPlaceholder}
              value={inputSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setInputSearch(value);
                debouncedSearch(value);
              }}
              className="admin-filtertools-input-wrap h-9"
            />
          </div>
        )}
        <Button
          isIconOnly
          variant={isShowCustomizedFilter ? "primary" : "secondary"}
          size="md"
          className="admin-filtertools-icon-btn"
          onPress={() => setIsShowCustomizedFilter(!isShowCustomizedFilter)}
        >
          <i className="fas fa-filter" />
        </Button>
        <Button
          isIconOnly
          variant="primary"
          size="md"
          className="admin-filtertools-refresh-btn bg-slate-700 text-white hover:bg-slate-800"
          onPress={refresh}
        >
          <i className="fas fa-sync-alt" />
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isShowCustomizedFilter && (
        <div className="admin-filtertools-advanced flex flex-wrap gap-2 pt-2 justify-end">
          {renderComponentTemplate(true)}
        </div>
      )}
    </div>
  );
};

export default FilterTools;
