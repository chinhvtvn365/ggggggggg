"use client";

import React from "react";
import { Checkbox, Switch, cn } from "@heroui/react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";

// --- INTERFACES ---
interface CheckboxControlProps {
  label?: string | React.ReactNode;
  name: string;
  defaultValue?: boolean;
  type?: "checkbox" | "switch";
  change?: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  rules?: RegisterOptions;
}

const CheckboxControl: React.FC<CheckboxControlProps> = (props) => {
  const {
    label,
    name = "",
    defaultValue = false,
    type = "checkbox",
    change,
    disabled = false,
    className = "",
    labelClassName = "",
    labelStyle = {},
    rules = {},
  } = props;

  const methods = useFormContext();
  const { control } = methods;

  const invokeActions = (option: boolean) => {
    if (typeof change === "function") {
      change(option);
    }
  };

  const CustomCheckbox = Checkbox as any;
  const CustomSwitch = Switch as any;

  return (
    <div className={cn("w-full mb-1", className)}>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValue}
        rules={rules}
        render={({ field, fieldState }) => {
          const isSelected = !!field.value;
          const hasError = !!fieldState.error;

          return (
            <div className="w-full">
              <div className={cn("flex flex-row items-center gap-2 py-1", !label && "justify-center")}>
                {type === "checkbox" ? (
                  <CustomCheckbox
                    isSelected={isSelected}
                    onChange={(val: any) => {
                      const nextValue = val?.target?.checked ?? val;
                      field.onChange(nextValue);
                      invokeActions(!!nextValue);
                    }}
                    isDisabled={disabled}
                    className={cn(labelClassName)}
                  >
                    <span className="text-sm" style={labelStyle}>{label}</span>
                  </CustomCheckbox>
                ) : (
                  <div className="flex items-center gap-3">
                    <CustomSwitch
                      isSelected={isSelected}
                      onChange={(val: any) => {
                        const nextValue = val?.target?.checked ?? val;
                        field.onChange(nextValue);
                        invokeActions(!!nextValue);
                      }}
                      isDisabled={disabled}
                      color="primary"
                      size="sm"
                    />
                    {label && (
                      <label 
                        className={cn("text-sm cursor-pointer font-medium text-gray-700", labelClassName)} 
                        style={labelStyle}
                        onClick={() => {
                          if (!disabled) {
                            const newValue = !isSelected;
                            field.onChange(newValue);
                            invokeActions(newValue);
                          }
                        }}
                      >
                        {label}
                      </label>
                    )}
                  </div>
                )}
              </div>
              {hasError && (
                <p className="text-xs text-red-500 mt-1">{fieldState.error?.message}</p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default CheckboxControl;


