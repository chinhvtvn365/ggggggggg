"use client";

import React, { useMemo } from "react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";
import { Dropdown, Label } from "@heroui/react";

// --- INTERFACES ---
interface OptionItem {
  label: string;
  value: string | number;
  level?: number;
  order?: number;
  [key: string]: any;
}

interface DropdownControlProps {
  label?: string | React.ReactNode;
  rules?: RegisterOptions;
  name: string;
  defaultValue?: any;
  options: OptionItem[];
  change?: (value: any) => void;
  placeholder?: string;
  afterRender?: (value: any) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  customLabel?: boolean;
  optionValue?: string;
  filter?: boolean; // HeroUI Select mặc định hỗ trợ tìm kiếm tốt
  itemTemplate?: (option: OptionItem) => React.ReactNode;
  wrapperClassName?: string;
  showClear?: boolean;
  layout?: "vertical" | "horizontal";
  labelWidth?: string;
  inputWidth?: string;
  showAllOption?: { active: boolean; label: string; value: any };
  firstOptionsAsDefault?: boolean;
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  customStyle?: React.CSSProperties;
}

const DropdownControl: React.FC<DropdownControlProps> = (props) => {
  const {
    label,
    rules,
    name,
    defaultValue,
    options = [],
    change,
    placeholder,
    afterRender,
    className = "",
    inputClassName = "",
    disabled = false,
    customLabel = false,
    optionValue = "value",
    wrapperClassName = "w-full",
    showClear = false,
    layout = "vertical",
    labelWidth = "w-1/4",
    inputWidth = "w-full",
    showAllOption = { active: false, label: "Tất cả", value: "all" },
    firstOptionsAsDefault = false,
    tooltip = "",
    tooltipPosition = "top",
    customStyle = {},
  } = props;

  const methods = useFormContext();

  // Xử lý options: Thêm "Tất cả" và sắp xếp theo order
  const processedOptions = useMemo(() => {
    let list = [...options];
    if (showAllOption.active) {
      list = [{ label: showAllOption.label, value: showAllOption.value }, ...list];
    }
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [options, showAllOption]);

  // Logic lấy giá trị mặc định
  const initialValue = useMemo(() => {
    if (defaultValue !== undefined) return String(defaultValue);
    if (firstOptionsAsDefault && processedOptions.length > 0) return String(processedOptions[0].value);
    return "";
  }, [defaultValue, firstOptionsAsDefault, processedOptions]);

  const isHorizontal = layout === "horizontal";

  return (
    <div className={`w-full mb-1 ${className}`}>
      <Controller
        name={name}
        control={methods.control}
        defaultValue={initialValue}
        rules={rules}
        render={({ field, fieldState }) => {
          const hasError = !!fieldState.error;
          const errorMessage = fieldState.error?.message;

          const renderSelect = () => {
            const selectedItem = processedOptions.find(
              (item) => String(item.value) === String(field.value)
            );

            return (
              <div className="relative w-full">
                {!isHorizontal && label && (
                  <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {rules?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                <Dropdown className="w-full">
                  <Dropdown.Trigger className="w-full">
                    <div
                      className={`w-full h-9 rounded-md
 flex items-center justify-between text-sm font-medium border ${hasError ? 'border-red-500' : 'border-gray-300'
                        } rounded hover:border-gray-400 focus:border-[#0f6bbf] transition-colors bg-white px-2 py-1.5 cursor-pointer ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                        } ${inputClassName}`}
                      style={customStyle}
                    >
                      <span className="text-gray-700 truncate text-left flex-1">
                        {selectedItem?.label || placeholder || "-- Chọn --"}
                      </span>
                      <i className="fas fa-chevron-down text-xs ml-2 text-gray-500" />
                    </div>
                  </Dropdown.Trigger>
                  <Dropdown.Popover placement="bottom start">
                    <Dropdown.Menu
                      onAction={(key) => {
                        const val = String(key);
                        const finalVal = (showAllOption.active && val === String(showAllOption.value)) ? null : val;
                        field.onChange(finalVal);
                        if (change) change({ value: finalVal });
                      }}
                      selectedKeys={field.value ? [String(field.value)] : []}
                    >
                      {placeholder && !field.value && (
                        <Dropdown.Item id="" textValue={placeholder}>
                          <Label className="text-gray-400">{placeholder}</Label>
                        </Dropdown.Item>
                      )}
                      {processedOptions.map((opt) => {
                        let displayLabel = opt.label;
                        if (customLabel && opt.level) {
                          displayLabel = `${"|-- ".repeat(opt.level)}${opt.label}`;
                        }
                        return (
                          <Dropdown.Item
                            id={String(opt.value)}
                            key={String(opt.value)}
                            textValue={displayLabel}
                          >
                            <Label>{displayLabel}</Label>
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
                {tooltip && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none" title={tooltip}>
                    <i className="fas fa-question-circle text-blue-500 text-xs" />
                  </div>
                )}
                {hasError && errorMessage && (
                  <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
                )}
              </div>
            );
          };

          if (isHorizontal) {
            return (
              <div className={`flex flex-row items-center gap-2 py-1 ${wrapperClassName}`}>
                {label && (
                  <label htmlFor={name} className={`text-sm font-bold text-gray-700 ${labelWidth}`}>
                    {label}
                    {rules?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                <div className={`flex-1 ${inputWidth}`}>
                  {renderSelect()}
                </div>
              </div>
            );
          }

          return renderSelect();
        }}
      />
    </div>
  );
};

export default DropdownControl;