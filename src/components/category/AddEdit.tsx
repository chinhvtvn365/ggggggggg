"use client";

import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

// Custom Controls
import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";

// Utilities
import { REQUIRED } from "@/constants/datatable.enum";
import { convertSignedVietnameseToFunctionCode } from "@/services/proxy.service";

const AddEditCategory = ({ data, dataSource }: { data: any; dataSource: any }) => {
  const methods = useFormContext();
  const { control, setValue, watch } = methods;
  const [imagePreviews, setImagePreviews] = useState<any>(null);

  // Khởi tạo ảnh khi có dữ liệu cũ (Edit mode)
  useEffect(() => {
    if (data?.id) {
      setImagePreviews(data?.icon);
    }
  }, [data]);

  // Đồng bộ ảnh vào form state
  useEffect(() => {
    setValue("image", imagePreviews);
  }, [imagePreviews, setValue]);

  return (
    <div className="grid grid-cols-12 gap-y-4 gap-x-6 py-2">
      {/* Tên danh mục */}
      <div className="col-span-12 md:col-span-6">
        <Textbox
          label="Tên danh mục"
          name="ten"
          rules={REQUIRED}
          layout="horizontal"
          labelWidth="col-span-4"
          change={(e: any) => {
            // Chỉ tự động tạo mã nếu là chế độ Thêm mới
            if (!data?.id) {
              setValue("ma", convertSignedVietnameseToFunctionCode(e.target.value));
            }
          }}
        />
      </div>

      {/* Tên viết tắt */}
      <div className="col-span-12 md:col-span-6">
        <Textbox
          label="Tên viết tắt"
          name="tenVietTat"
          layout="horizontal"
          labelWidth="col-span-4"
        />
      </div>

      {/* Thuộc nhóm (Dropdown phân cấp) */}
      <div className="col-span-12 md:col-span-6">
        <DropdownControl
          label="Thuộc nhóm"
          name="maChucNang"
          options={dataSource?.getDanhSachChucNangMoi()}
          // Logic hiển thị phân cấp |--
          optionLabel={(option: any) => {
            const prefix = "|-- ".repeat(option.level || 0);
            return `${prefix}${option.label}`;
          }}
          placeholder="Chọn nhóm danh mục"
          showFilter={true}
          rules={REQUIRED}
          layout="horizontal"
          labelWidth="col-span-4"
        />
      </div>

      {/* Đơn vị phụ trách - Component không khả dụng */}
      <div className="col-span-12 md:col-span-6">
        <Textbox
          label="Đơn vị phụ trách"
          name="donVi"
          placeholder="Nhập đơn vị"
          layout="horizontal"
          labelWidth="col-span-4"
        />
      </div>

      {/* Mã/Tham số */}
      <div className="col-span-12 md:col-span-6">
        <Textbox
          label="Mã/Tham số"
          name="ma"
          placeholder="Tự động tạo hoặc nhập thủ công"
          layout="horizontal"
          labelWidth="col-span-4"
        />
      </div>

      {/* Thứ tự */}
      <div className="col-span-12 md:col-span-6">
        <Textbox
          label="Thứ tự hiển thị"
          name="order"
          type="number"
          layout="horizontal"
          labelWidth="col-span-4"
        />
      </div>

      {/* Thuộc tính mở rộng (JSON/Text) */}
      <div className="col-span-12">
        <Textbox
          label="Mô tả mở rộng"
          name="moRong"
          textAreaRow={3}
          placeholder="Nhập các thuộc tính mở rộng (nếu có)..."
          layout="horizontal"
          labelWidth="col-span-2"
        />
      </div>

      {/* Icon/Ảnh đại diện - Component không khả dụng */}
      <div className="col-span-12 border-t pt-4 mt-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">
            Icon / Ảnh đại diện danh mục
          </label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreviews(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />
          {imagePreviews && (
            <img src={imagePreviews} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded" />
          )}
        </div>
      </div>

      {/* Trạng thái hoạt động */}
      <div className="col-span-12 pl-2">
        <Controller
          name="isActive"
          control={control}
          defaultValue={data?.isActive ?? true}
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Kích hoạt danh mục này</span>
            </label>
          )}
        />
      </div>
    </div>
  );
};

export default AddEditCategory;