"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { REQUIRED } from "@/constants/datatable.enum";
import { v4 as uuidv4 } from "uuid";
import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";
import CalendarControl from "@/components/controls/CalendarControl";

const ScheduleParameters = ({ nestIndex, control }: { nestIndex: number; control: any }) => {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `scheduleBosses.${nestIndex}.parameters`,
  });

  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <h6 className="text-sm font-semibold text-gray-700 mb-2 pb-1">Chi tiết lịch làm việc</h6>
      {fields.map((item: any, k: number) => (
        <div key={item.id} className="grid grid-cols-12 gap-3 items-start mb-2">
          <div className="col-span-12 md:col-span-2">
            <DropdownControl
              name={`scheduleBosses.${nestIndex}.parameters.${k}.codeTime`}
              options={[
                { value: "SANG", label: "Sáng" },
                { value: "CHIEU", label: "Chiều" },
                { value: "TOI", label: "Tối" }
              ]}
              placeholder="Buổi"
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <Textbox
              name={`scheduleBosses.${nestIndex}.parameters.${k}.content`}
              placeholder="Nội dung"
              textAreaRow={1}
              rules={REQUIRED}
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <Textbox
              name={`scheduleBosses.${nestIndex}.parameters.${k}.place`}
              placeholder="Địa điểm"
            />
          </div>
          <div className="col-span-12 md:col-span-2">
            <Textbox
              name={`scheduleBosses.${nestIndex}.parameters.${k}.participation`}
              placeholder="Thành phần"
            />
          </div>
          <div className="col-span-12 md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => remove(k)}
              className="text-red-500 hover:text-red-700 bg-red-100 w-8 h-8 rounded mt-1"
              title="Xóa buổi này"
            >
              <i className="fa-solid fa-trash text-sm"></i>
            </button>
          </div>
        </div>
      ))}
      <div className="mt-2 text-center md:text-left">
        <button
          type="button"
          onClick={() => append({ codeTime: "SANG", content: "", place: "", participation: "", id: uuidv4() })}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <i className="fa-solid fa-plus mr-1"></i> Thêm dòng nội dung
        </button>
      </div>
    </div>
  );
};

const ScheduleBosses = ({ control }: { control: any }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scheduleBosses",
  });

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-lg font-semibold text-blue-600">Danh sách lãnh đạo</h5>
        <button
          type="button"
          onClick={() => append({ username: "", position: "", parameters: [{ codeTime: "SANG", content: "", place: "", participation: "", id: uuidv4() }], id: uuidv4() })}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 transition-colors font-medium border-none"
        >
          <i className="fa-solid fa-user-plus mr-1"></i> Thêm lãnh đạo
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded text-gray-500">
          Chưa có lãnh đạo nào được phân công. Bấm "Thêm lãnh đạo" để bắt đầu.
        </div>
      ) : (
        fields.map((item: any, index: number) => (
          <div key={item.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 relative bg-white p-3 rounded-md shadow-sm border">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              title="Xóa lãnh đạo"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="grid grid-cols-12 gap-x-5 gap-y-2 pr-10">
              <div className="col-span-12 md:col-span-6">
                <Textbox
                  label="Họ và tên"
                  rules={REQUIRED}
                  name={`scheduleBosses.${index}.username`}
                  layout="horizontal"
                  labelWidth="w-1/4"
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Textbox
                  label="Chức vụ"
                  name={`scheduleBosses.${index}.position`}
                  layout="horizontal"
                  labelWidth="w-1/4"
                />
              </div>
            </div>

            <ScheduleParameters nestIndex={index} control={control} />
          </div>
        ))
      )}
    </div>
  );
};

const AddEditLichLamViec = ({ dataSource }: any) => {
  const methods = useFormContext();
  const { control } = methods;

  return (
    <div className="p-2 space-y-2">
      <h5 className="text-lg font-semibold text-blue-600 mb-3">Thông tin chung</h5>
      <div className="grid grid-cols-12 gap-x-5 gap-y-2">
        <div className="col-span-12">
          <Textbox
            label="Tiêu đề"
            name="title"
            rules={REQUIRED}
            layout="horizontal"
            labelWidth="w-[12%]"
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          <DropdownControl
            label="Đơn vị"
            name="agentId"
            options={dataSource?.dataOrganizationUnit}
            rules={REQUIRED}
            placeholder="- Chọn -"
            layout="horizontal"
            labelWidth="w-[24%]"
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          <CalendarControl
            label="Ngày"
            name="date"
            rules={REQUIRED}
            layout="horizontal"
            labelWidth="w-[24%]"
          />
        </div>
      </div>

      <ScheduleBosses control={control} />
    </div>
  );
};

export default AddEditLichLamViec;
