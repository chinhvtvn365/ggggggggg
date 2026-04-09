"use client";

import React from "react";
import { Input, TextArea, Tooltip, cn } from "@heroui/react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";

// --- INTERFACES ---
interface TextboxProps {
  label?: string | React.ReactNode;
  rules?: RegisterOptions;
  name: string;
  defaultValue?: any;
  hidden?: boolean;
  className?: string;
  inputClassName?: string;
  textAreaRow?: number;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "tel" | "url";
  change?: (value: any) => void;
  value?: any;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  maxLength?: number;
  minLength?: number;
  layout?: "vertical" | "horizontal";
  labelWidth?: string;
  inputWidth?: string;
  labelStyle?: React.CSSProperties;
  minValue?: number;
  maxValue?: number;
  readOnly?: boolean;
  helperText?: string;
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  prefix?: string | React.ReactNode;
  suffix?: string | React.ReactNode;
}

const Textbox: React.FC<TextboxProps> = (props) => {
  const {
    label,
    rules,
    name,
    defaultValue,
    hidden,
    className = "",
    inputClassName = "",
    textAreaRow,
    placeholder,
    type = "text",
    change,
    value,
    disabled,
    onFocus,
    onBlur,
    maxLength = 500,
    minLength = 0,
    layout = "vertical",
    labelWidth = "w-1/4",
    inputWidth = "w-full",
    labelStyle = {},
    minValue,
    maxValue,
    readOnly = false,
    helperText = "",
    tooltip = "",
    tooltipPosition = "top",
    prefix,
    suffix,
  } = props;

  const methods = useFormContext();

  const isHorizontal = layout === "horizontal";

  // Xử lý logic validation đặc thù cho Email
  const finalRules = { ...rules };
  if (type === "email") {
    finalRules.pattern = {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Định dạng email không hợp lệ",
    };
  }

  return (
    <div className={cn("w-full mb-1", hidden && "hidden", className)}>
      <Controller
        name={name}
        control={methods.control}
        defaultValue={defaultValue ?? value ?? ""}
        rules={finalRules}
        render={({ field, fieldState }) => {
          const hasError = !!fieldState.error;
          const errorMessage = fieldState.error?.message;

          // Component Input chung cho hầu hết các loại
          const InputComponent = textAreaRow ? TextArea : Input;

          // Destructure only needed props from field
          const { ref, ...fieldProps } = field;

          const renderInput = () => (
            <div className="w-full">
              <InputComponent
                ref={ref}
                name={fieldProps.name}
                value={fieldProps.value ?? ""}
                onBlur={fieldProps.onBlur}
                id={name}
                type={type === "number" ? "text" : type}
                label={!isHorizontal ? label : null}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                min={minValue}
                max={maxValue}
                minLength={minLength}
                maxLength={maxLength}
                rows={textAreaRow}
                onFocus={onFocus}
                className={cn(
                  "w-full rounded-md px-2 text-sm shadow-none border border-gray-300 hover:border-gray-400 focus:border-[#0f6bbf] focus:outline-none transition-colors",
                  !textAreaRow && "h-9",
                  hasError && "border-red-500",
                  disabled && "bg-gray-100 cursor-not-allowed",
                  isHorizontal ? inputWidth : "w-full",
                  inputClassName,
                )}
                onChange={(e) => {
                  const val =
                    type === "number"
                      ? e.target.value.replace(/[^0-9.-]/g, "")
                      : e.target.value;
                  field.onChange(val);
                  if (change) change(e);
                }}
              />
              {hasError && errorMessage && (
                <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
              )}
              {!hasError && helperText && (
                <p className="text-xs text-gray-500 mt-1">{helperText}</p>
              )}
            </div>
          );

          if (isHorizontal) {
            return (
              <div className="flex flex-row items-start gap-2 py-1">
                {label && (
                  <label
                    className={cn(
                      "text-sm font-bold text-gray-700 pt-1.5",
                      labelWidth,
                    )}
                    style={labelStyle}
                  >
                    {label}
                  </label>
                )}
                <div className="flex-1">{renderInput()}</div>
              </div>
            );
          }

          return renderInput();
        }}
      />
    </div>
  );
};

export default Textbox;
