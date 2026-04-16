"use client";

import React, { useMemo, useCallback } from "react";
import { DateRangePicker, Tooltip, cn } from "@heroui/react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";
import {
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  toCalendarDateTime,
  CalendarDate,
  DateValue,
} from "@internationalized/date";

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
    labelWidth = "",
    inputWidth = "",
    showTime = false,
    showSeconds = false,
    timeOnly = false,
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
  const resolvedLabelWidth = isHorizontal
    ? (labelWidth || "col-span-4")
    : labelWidth;
  const resolvedInputWidth = isHorizontal
    ? (() => {
        if (inputWidth) return inputWidth;
        const match = resolvedLabelWidth.match(/col-span-(\d+)/);
        if (!match) return "col-span-8";
        const labelCols = Number(match[1]);
        const inputCols = Math.min(Math.max(12 - labelCols, 1), 11);
        return `col-span-${inputCols}`;
      })()
    : inputWidth;

  const toHeroDate = useCallback(
    (date: unknown): DateValue | null => {
      if (!date) return null;
      try {
        const d = new Date(date as string | number | Date);
        if (Number.isNaN(d.getTime())) return null;

        const localDate = fromDate(d, getLocalTimeZone());
        if (timeOnly || showTime) return toCalendarDateTime(localDate);
        return toCalendarDate(localDate);
      } catch {
        return null;
      }
    },
    [showTime, timeOnly],
  );

  const fromHeroDate = useCallback((heroDate: DateValue | null): Date | null => {
    if (!heroDate) return null;
    return heroDate.toDate(getLocalTimeZone());
  }, []);

  const computedMaxDate = useMemo(() => {
    if (!noFuture && !maxDate) return undefined;
    const target = noFuture ? new Date() : maxDate;
    return target ? (toHeroDate(target) as CalendarDate) : undefined;
  }, [maxDate, noFuture, toHeroDate]);

  const requiredMessage =
    typeof rules?.required === "string"
      ? rules.required
      : "Trường này không được để trống";

  const normalizedRules: RegisterOptions = {
    ...rules,
    validate: (value: unknown, formValues: Record<string, unknown>) => {
      if (rules?.required) {
        if (dateRange) {
          const arr = Array.isArray(value) ? value : [];
          if (!arr[0] || !arr[1]) return requiredMessage;
        } else if (!value) {
          return requiredMessage;
        }
      }

      if (typeof rules?.validate === "function") {
        return rules.validate(value as never, formValues as never);
      }

      return true;
    },
  };

  const CustomDateRangePicker = DateRangePicker as any;
  const CustomTooltip = Tooltip as any;

  const toInputValue = (value: unknown) => {
    if (!value) return "";
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) return "";

    if (timeOnly) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
      ).padStart(2, "0")}`;
    }

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return showTime ? local.toISOString().slice(0, 16) : local.toISOString().slice(0, 10);
  };

  const fromInputValue = (value: string) => {
    if (!value) return null;

    if (timeOnly) {
      const [hours = "0", minutes = "0"] = value.split(":");
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);
      return date;
    }

    return new Date(showTime ? value : `${value}T00:00:00`);
  };

  return (
    <div className={cn("w-full mb-1", className)}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue ?? null}
        rules={normalizedRules}
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
                    className="w-full"
                    isDisabled={disabled}
                    placeholderValue={placeholder as any}
                    onBlur={field.onBlur}
                    value={
                      field.value
                        ? {
                            start: toHeroDate(field.value[0]),
                            end: toHeroDate(field.value[1]),
                          }
                        : null
                    }
                    onChange={(val: any) => {
                      const jsDates = val
                        ? [fromHeroDate(val.start), fromHeroDate(val.end)]
                        : null;
                      field.onChange(jsDates);
                      if (change) change(jsDates);
                    }}
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
                <input
                  type={timeOnly ? "time" : showTime ? "datetime-local" : "date"}
                  value={toInputValue(field.value)}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const jsDate = fromInputValue(e.target.value);
                    field.onChange(jsDate);
                    if (change) change(jsDate);
                  }}
                  disabled={disabled}
                  className={cn(
                    "w-full rounded-md px-2 text-sm shadow-none border border-gray-300 hover:border-gray-400 focus:border-[#0f6bbf] focus:outline-none transition-colors h-9",
                    hasError && "border-red-500",
                    disabled && "bg-gray-100 cursor-not-allowed",
                  )}
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
              <div className={cn("admin-form-row", wrapperClassName)}>
                {label && (
                  <label className={cn("admin-form-label", resolvedLabelWidth, labelClassName)}>
                    {label}
                    {rules?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                <div className={cn("admin-form-control", resolvedInputWidth)}>{renderPicker()}</div>
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


