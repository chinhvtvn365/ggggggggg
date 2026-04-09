"use client";

import React, { useMemo, useCallback } from "react";
import { DatePicker, DateRangePicker, Tooltip, cn } from "@heroui/react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";
import { 
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  toCalendarDateTime,
  CalendarDate,
  DateValue
} from "@internationalized/date";

// --- INTERFACES ---
interface CalendarControlProps {
  label?: string | React.ReactNode;
  rules?: RegisterOptions;
  name: string;
  defaultValue?: any;
  wrapperClassName?: string;
  options?: any[];
  change?: (value: any) => void;
  placeholder?: string;
  afterRender?: (value: any) => void;
  className?: string;
  disabled?: boolean;
  layout?: "vertical" | "horizontal";
  labelWidth?: string;
  inputWidth?: string;
  showTime?: boolean;
  showSeconds?: boolean;
  timeOnly?: boolean;
  inputClassName?: string;
  customStyle?: React.CSSProperties;
  maxDate?: Date | null;
  labelClassName?: string;
  noFuture?: boolean;
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  view?: "date" | "month" | "year";
  dateFormat?: string;
  showIcon?: boolean;
  dateRange?: boolean;
}

const CalendarControl: React.FC<CalendarControlProps> = (props) => {
  const {
    label,
    rules,
    name,
    defaultValue,
    wrapperClassName = "",
    change,
    placeholder,
    className = "",
    disabled,
    layout = "vertical",
    labelWidth = "w-1/4",
    inputWidth = "w-full",
    showTime = false,
    showSeconds = false,
    timeOnly = false,
    inputClassName,
    maxDate = null,
    labelClassName = "",
    noFuture = false,
    tooltip = "",
    tooltipPosition = "top",
    dateRange = false,
  } = props;

  const methods = useFormContext();
  const { control } = methods;

  const isHorizontal = layout === "horizontal";

  // Chuyển đổi Date (JS) sang CalendarDate/CalendarDateTime (HeroUI)
  const toHeroDate = useCallback((date: any): DateValue | null => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      
      const localDate = fromDate(d, getLocalTimeZone());
      if (timeOnly || showTime) {
        return toCalendarDateTime(localDate);
      }
      return toCalendarDate(localDate);
    } catch {
      return null;
    }
  }, [timeOnly, showTime]);

  // Chuyển đổi HeroDate ngược lại sang JS Date
  const fromHeroDate = useCallback((heroDate: DateValue | null): Date | null => {
    if (!heroDate) return null;
    return heroDate.toDate(getLocalTimeZone());
  }, []);

  const computedMaxDate = useMemo(() => {
    if (!noFuture && !maxDate) return undefined;
    const now = new Date();
    const target = noFuture ? now : maxDate;
    return target ? toHeroDate(target) as CalendarDate : undefined;
  }, [noFuture, maxDate, toHeroDate]);

  // Use any to bypass beta version type mismatches for now
  const CustomDatePicker = DatePicker as any;
  const CustomDateRangePicker = DateRangePicker as any;
  const CustomTooltip = Tooltip as any;

  return (
    <div className={cn("w-full mb-1", className)}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={({ field, fieldState }) => {
          const hasError = !!fieldState.error;
          const errorMessage = fieldState.error?.message;

          const renderPicker = () => {
            if (dateRange) {
              return (
                <div className="w-full">
                  {!isHorizontal && label && (
                    <label className={cn("block text-sm font-bold text-gray-700 mb-2", labelClassName)}>
                      {label}
                      {rules?.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  <CustomDateRangePicker
                    isDisabled={disabled}
                    placeholderValue={placeholder as any}
                    value={field.value ? {
                      start: toHeroDate(field.value[0]),
                      end: toHeroDate(field.value[1])
                    } : null}
                    onChange={(val: any) => {
                      const jsDates = val ? [fromHeroDate(val.start), fromHeroDate(val.end)] : null;
                      field.onChange(jsDates);
                      if (change) change(jsDates);
                    }}
                    className={cn(
                      "w-full rounded-md border text-sm transition-colors cursor-pointer",
                      hasError ? "border-red-500" : "border-gray-300 hover:border-gray-400",
                      inputClassName
                    )}
                    maxValue={computedMaxDate as any}
                  />
                  {hasError && errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                  )}
                </div>
              );
            }

            return (
              <div className="relative w-full">
                {!isHorizontal && label && (
                  <label className={cn("block text-sm font-bold text-gray-700 mb-2", labelClassName)}>
                    {label}
                    {rules?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                <CustomDatePicker
                  isDisabled={disabled}
                  hideTimeZone
                  showMonthAndYearPickers
                  value={toHeroDate(field.value)}
                  onChange={(val: any) => {
                    const jsDate = fromHeroDate(val);
                    field.onChange(jsDate);
                    if (change) change(jsDate);
                  }}
                  granularity={timeOnly ? "second" : (showTime ? (showSeconds ? "second" : "minute") : "day")}
                  className={cn(
                    "w-full rounded-md border text-sm transition-colors cursor-pointer",
                    hasError ? "border-red-500" : "border-gray-300 hover:border-gray-400",
                    inputClassName
                  )}
                  maxValue={computedMaxDate as any}
                />
                {tooltip && (
                  <CustomTooltip content={tooltip as any} placement={tooltipPosition as any}>
                    <div className="absolute right-10 top-2 cursor-help text-gray-400 hover:text-blue-500">
                      <i className="fas fa-question-circle" />
                    </div>
                  </CustomTooltip>
                )}
                {hasError && errorMessage && (
                  <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                )}
              </div>
            );
          };

          if (isHorizontal) {
            return (
              <div className={cn("flex flex-row items-center gap-2 py-1", wrapperClassName)}>
                {label && (
                  <label 
                    className={cn("text-sm font-bold text-gray-700", labelWidth, labelClassName)}
                  >
                    {label}
                  </label>
                )}
                <div className={cn("flex-1", inputWidth)}>{renderPicker()}</div>
              </div>
            );
          }

          return renderPicker();
        }}
      />
    </div>
  );
};

export default CalendarControl;


