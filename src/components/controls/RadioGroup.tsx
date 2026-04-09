"use client";

import React from "react";
import { RadioGroup as HeroRadioGroup, Radio, cn } from "@heroui/react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";

// --- INTERFACES ---
interface RadioOption {
  label: string;
  value: string | number;
  severity?: string;
  labelClass?: string;
  [key: string]: any;
}

interface RadioGroupProps {
  name: string;
  label?: string | React.ReactNode;
  labelClass?: string;
  options: RadioOption[];
  rules?: RegisterOptions;
  defaultValue?: any;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  change?: (value: any) => void;
  wrapperClassName?: string;
  radioClassName?: string;
  layout?: "vertical" | "horizontal";
  labelWidth?: string;
  radioLabelClassName?: string;
  labelStyle?: React.CSSProperties;
  radioWidth?: string;
  firstOptionAsDefault?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = (props) => {
  const {
    name,
    label,
    labelClass = "",
    options = [],
    rules,
    defaultValue,
    className = "",
    inputClassName = "",
    disabled = false,
    change,
    wrapperClassName = "w-full",
    radioClassName = "",
    layout = "vertical",
    labelWidth = "w-1/4",
    radioLabelClassName = "",
    labelStyle = {},
    radioWidth = "",
    firstOptionAsDefault = false,
  } = props;

  const methods = useFormContext();
  const { control } = methods;

  const initialValue = React.useMemo(() => {
    if (defaultValue !== undefined) return String(defaultValue);
    if (firstOptionAsDefault && options?.length > 0) return String(options[0].value);
    return undefined;
  }, [defaultValue, firstOptionAsDefault, options]);

  const isHorizontal = layout === "horizontal";

  // Use any to bypass beta version type mismatches for now
  const CustomRadioGroup = HeroRadioGroup as any;
  const CustomRadio = Radio as any;

  return (
    <div className={cn("w-full mb-1", className)}>
      <Controller
        name={name}
        control={control}
        defaultValue={initialValue}
        rules={rules}
        render={({ field, fieldState }) => {
          const hasError = !!fieldState.error;
          const errorMessage = fieldState.error?.message;

          const renderRadioGroup = () => (
            <div className="w-full">
              {!isHorizontal && label && (
                <label className={cn("block text-sm font-bold text-gray-700 mb-2", labelClass)} style={labelStyle}>
                  {label}
                  {rules?.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              <CustomRadioGroup
                value={field.value !== undefined ? String(field.value) : undefined}
                onValueChange={(val: any) => {
                  field.onChange(val);
                  if (change) change(val);
                }}
                isDisabled={disabled}
                orientation={isHorizontal ? "horizontal" : "vertical"}
                className={cn("w-full", radioClassName)}
              >
                <div className={cn(
                  "flex flex-wrap gap-4",
                  isHorizontal ? "flex-row" : "flex-col"
                )}>
                  {options.map((option) => (
                    <CustomRadio 
                      key={String(option.value)} 
                      value={String(option.value)}
                      className={cn(radioWidth, inputClassName)}
                      // Standard props only
                    >
                      <span className={cn("text-sm cursor-pointer", radioLabelClassName, option.labelClass, labelClass)}>
                        {option.label}
                      </span>
                    </CustomRadio>
                  ))}
                </div>
              </CustomRadioGroup>
              {hasError && errorMessage && (
                <p className="text-xs text-red-500 mt-2">{errorMessage}</p>
              )}
            </div>
          );

          if (isHorizontal) {
            return (
              <div className={cn("flex flex-row items-center gap-2 py-1", wrapperClassName)}>
                {label && (
                  <label 
                    className={cn("text-sm font-bold text-gray-700", labelWidth, labelClass)} 
                    style={labelStyle}
                  >
                    {label}
                    {rules?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                <div className="flex-1">{renderRadioGroup()}</div>
              </div>
            );
          }

          return renderRadioGroup();
        }}
      />
    </div>
  );
};

export default RadioGroup;

