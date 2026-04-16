"use client";

import React, { Fragment, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";
import { REQUIRED } from "@/constants/datatable.enum";

const AddUnitModalContent = ({ data, dataSource }: { data: any; dataSource: any }) => {
  const methods = useFormContext();
  const { control, setValue, watch } = methods;
  
  const parentIdWatch = watch("parentId");
  const [dsDonViTrucThuoc, setDsDonViTrucThuoc] = useState<any[]>([]);
  const [type, setType] = useState(data?.type || "");

  // Logic xử lý danh sách đơn vị trực thuộc (vô hiệu hóa chính nó và con của nó)
  useEffect(() => {
    if (!dataSource.dsDonViTrucThuoc) return;

    const filteredData = JSON.parse(JSON.stringify(dataSource.dsDonViTrucThuoc));
    
    if (data?.id) {
      // Vô hiệu hóa chính nó
      const self = filteredData.find((x: any) => x.value === data.id);
      if (self) self.isDisabled = true;

      // Đệ quy vô hiệu hóa các con
      const disableChildren = (id: string, list: any[]) => {
        list.forEach((item) => {
          if (item.parentId === id) {
            item.isDisabled = true;
            disableChildren(item.value, list);
          }
        });
      };
      disableChildren(data.id, filteredData);
    }
    setDsDonViTrucThuoc(filteredData);
  }, [dataSource.dsDonViTrucThuoc, data]);

  // Tự động tính toán Level khi chọn đơn vị cha
  useEffect(() => {
    if (parentIdWatch) {
      const parent = dataSource.dsDonViTrucThuoc?.find((x: any) => x.value === parentIdWatch);
      if (parent) {
        setValue("level", (parent.level || 0) + 1);
      }
    } else {
      setValue("level", 0);
    }
  }, [parentIdWatch, dataSource.dsDonViTrucThuoc, setValue]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-6">
        
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT (8 CỘT) */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <i className="fa-solid fa-circle-info"></i>
            <h5>Thông tin đơn vị</h5>
          </div>

          <div className="grid grid-cols-12 gap-x-5">
            <div className="col-span-12 md:col-span-6">
              <Textbox
                label="Tên đơn vị"
                name="displayName"
                rules={REQUIRED}
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Textbox
                label="Mã định danh"
                name="code"
                rules={REQUIRED}
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Textbox
                label="Tên viết tắt"
                name="shortName"
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Textbox
                label="Email liên hệ"
                name="email"
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <DropdownControl
                label="Phân loại"
                name="phanLoai"
                options={[
                  { label: "--- Không chọn ---", value: null },
                  ...(dataSource.dsPhanLoaiDonVi || [])
                ]}
                placeholder="Chọn phân loại"
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <DropdownControl
                label="Trực thuộc"
                name="parentId"
                options={[
                  { label: "--- Là đơn vị gốc ---", value: null },
                  ...dsDonViTrucThuoc
                ]}
                placeholder="Chọn đơn vị cha"
                layout="horizontal"
                labelWidth="col-span-4"
              />
            </div>

            <div className="col-span-12">
              <Textbox
                label="Địa chỉ"
                name="address"
                layout="horizontal"
                labelWidth="col-span-2"
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CHỨC NĂNG (4 CỘT) */}
        <div className="col-span-12 md:col-span-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-lg mb-4">
            <i className="fa-solid fa-layer-group"></i>
            <h5>Chức năng được phép</h5>
          </div>

          <div className="flex flex-col gap-3">
            {dataSource.dsDonViChucNang && dataSource.dsDonViChucNang.length > 0 ? (
              dataSource.dsDonViChucNang.map((chucNang: any) => (
                <Controller
                  key={chucNang.value}
                  name="danhSachChucNang"
                  control={control}
                  render={({ field }) => {
                    const currentValues = Array.isArray(field.value) ? field.value : [];
                    const isChecked = currentValues.includes(chucNang.value);

                    return (
                      <label className="flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const nextValue = e.target.checked
                              ? [...currentValues, chucNang.value]
                              : currentValues.filter((v: any) => v !== chucNang.value);
                            field.onChange(nextValue);
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium">{chucNang.label}</span>
                      </label>
                    );
                  }}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm italic">
                Chưa cấu hình danh mục chức năng
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logic cho Adapter - Nếu bạn cần dùng, hãy bỏ comment phần này */}
      {/* type === "adapter" && <AdapterConfigSection details={details} ... /> */}
    </div>
  );
};

export default AddUnitModalContent;