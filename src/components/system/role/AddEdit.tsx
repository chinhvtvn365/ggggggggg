"use client";

import React, { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";

import Textbox from "@/components/controls/Textbox";
import { REQUIRED } from "@/constants/datatable.enum";

const RoleAddEditContent = ({ data }: { data: any }) => {
  const methods = useFormContext();
  const { control } = methods;

  useEffect(() => {
    // Thực hiện logic khởi tạo nếu cần khi data thay đổi
  }, [data]);

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Ô nhập tên vai trò */}
      <div className="w-full">
        <Textbox 
          label="Tên vai trò" 
          name="name" 
          rules={REQUIRED} 
          layout="horizontal" 
          labelWidth="col-span-3" 
        />
      </div>

      {/* Nhóm Checkbox tùy chọn */}
      <div className="flex flex-col gap-3 pl-2">
        <Controller
          name="isDefault"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Đặt làm mặc định (Default)</span>
            </label>
          )}
        />
        
        <Controller
          name="isPublic"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Công khai vai trò (Public)</span>
            </label>
          )}
        />
      </div>

      <p className="text-xs text-gray-500 italic pl-2">
        * Vai trò mặc định sẽ tự động được gán cho người dùng mới khi đăng ký.
      </p>
    </div>
  );
};

export default RoleAddEditContent;