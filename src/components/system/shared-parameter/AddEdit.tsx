"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Textbox } from "@/components/commons/controls/index";
import { REQUIRED } from "@/constants/datatable.enum";

interface AddEditProps {
  data?: any;
  dataSource?: any;
}

const AddEditSharedParameter = ({ data, dataSource }: AddEditProps) => {
  const methods = useFormContext();
  const { control } = methods;

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Từ khóa: Mã định danh của tham số, thường không chứa dấu */}
      <div className="w-full">
        <Textbox
          label="Từ khóa"
          name="key"
          rules={REQUIRED}
          defaultValue=""
          placeholder="Nhập mã tham số (vd: App.UI.Theme)"
          layout="horizontal"
          labelWidth="col-span-2"
          // Nếu là chế độ cập nhật, bạn có thể cân nhắc disabled trường này 
          // để tránh làm hỏng logic hệ thống gọi theo Key
          disabled={!!data?.id}
        />
      </div>

      {/* Mô tả: Giải thích ý nghĩa của tham số cho người vận hành */}
      <div className="w-full">
        <Textbox
          label="Mô tả"
          name="description"
          placeholder="Mô tả mục đích của tham số này..."
          textAreaRow={2}
          defaultValue=""
          layout="horizontal"
          labelWidth="col-span-2"
        />
      </div>

      {/* Giá trị: Nội dung cấu hình thực tế (Text, JSON, Number...) */}
      <div className="w-full">
        <Textbox
          label="Giá trị"
          name="value"
          rules={REQUIRED}
          placeholder="Nhập giá trị cấu hình..."
          textAreaRow={6} // Tăng nhẹ số dòng để dễ quan sát cấu hình dài
          defaultValue=""
          layout="horizontal"
          labelWidth="col-span-2"
        />
      </div>

      {/* Lưu ý nhỏ cho người dùng */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2 rounded-r-md">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-blue-500 text-sm"></i>
          <p className="text-xs text-blue-700 font-medium">
            Lưu ý: Thay đổi tham số hệ thống có thể ảnh hưởng đến toàn bộ ứng dụng ngay lập tức.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddEditSharedParameter;