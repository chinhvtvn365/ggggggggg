"use client";

import React, { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";

import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";
import { REQUIRED } from "@/constants/datatable.enum";
import { proxyService } from "@/services";

const UserAddEditContent = ({ data, dataSource }: { data: any, dataSource: any }) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("info");
  const methods = useFormContext();
  const { setValue, control } = methods;

  useEffect(() => {
    if (data && data.id) {
      getRoles(data.id);
      setSelectedKeys(
        data.extraProperties?.geoUnitCodeString ? JSON.parse(data.extraProperties.geoUnitCodeString) : null
      );
    } else {
      // Thiết lập vai trò mặc định khi thêm mới
      const defaultRoles = dataSource.roles.filter((x: any) => x.isDefault);
      setRoles(defaultRoles);
      dataSource.roles.forEach((role: any) => {
        if (role.isDefault) {
          setValue(`roleName.${role.name}`, true);
        }
      });
    }
  }, [data, dataSource.roles, setValue]);

  useEffect(() => {
    setValue("geoUnitCode", JSON.stringify(selectedKeys));
  }, [selectedKeys, setValue]);

  const getRoles = async (id: string) => {
    try {
      const res = await proxyService.get(`/api/identity/users/${id}/roles`);
      if (res.status === 200 && res.data) {
        setRoles(res.data?.items);
        res.data?.items.forEach((role: any) => {
          setValue(`roleName.${role.name}`, true);
        });
      }
    } catch (error) {
      console.error("Lỗi lấy vai trò user:", error);
    }
  };

  return (
    <div className="w-full">
      {/* Custom Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-0 pb-3 h-12 font-semibold transition-colors border-b-2 ${
              activeTab === "info" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Thông tin người dùng
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-0 pb-3 h-12 font-semibold transition-colors border-b-2 ${
              activeTab === "roles" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Phân quyền ({roles.length})
          </button>
        </div>
      </div>

      {/* TAB 1: THÔNG TIN NGƯỜI DÙNG */}
      {activeTab === "info" && (
        <div className="py-4 space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <Textbox 
                    label="Tài khoản" 
                    name="userName" 
                    rules={REQUIRED} 
                    layout="horizontal" 
                    labelWidth="col-span-4" 
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <Textbox
                    label="Mật khẩu"
                    name="password"
                    password={true}
                    layout="horizontal"
                    labelWidth="col-span-4"
                    rules={data ? {} : REQUIRED}
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <Textbox 
                    label="Họ tên" 
                    name="name" 
                    rules={REQUIRED} 
                    layout="horizontal" 
                    labelWidth="col-span-4" 
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <Textbox 
                    label="Email" 
                    name="email" 
                    rules={REQUIRED} 
                    layout="horizontal" 
                    labelWidth="col-span-4" 
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <Textbox
                    label="Điện thoại"
                    name="phoneNumber"
                    layout="horizontal"
                    labelWidth="col-span-4"
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <DropdownControl
                    label="Đơn vị"
                    name="organizationUnitId"
                    options={dataSource.oUnit}
                    showFilter={true}
                    placeholder="Chọn cơ quan"
                    customLabel={true}
                    layout="horizontal"
                    labelWidth="col-span-4"
                  />
                </div>
              </div>

              {/* CÁC TÙY CHỌN TRẠNG THÁI */}
              <div className="flex flex-col gap-3 pt-2 pl-2">
                <Controller
                  name="isActive"
                  defaultValue={data ? data.isActive : true}
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Kích hoạt tài khoản</span>
                    </label>
                  )}
                />
                <Controller
                  name="yeuCauDoiMatKhau"
                  defaultValue={false}
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Yêu cầu đổi mật khẩu lần đầu</span>
                    </label>
                  )}
                />
                <Controller
                  name="lockoutEnabled"
                  defaultValue={data ? data.lockoutEnabled : true}
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Tự động khóa nếu đăng nhập sai nhiều lần</span>
                    </label>
                  )}
                />
              </div>
            </div>
          )}

        {/* TAB 2: PHÂN QUYỀN VAI TRÒ */}
        {activeTab === "roles" && (
          <div className="py-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h5 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-user-shield"></i>
                    Vai trò hệ thống
                  </h5>
                  <div className="flex flex-col gap-3">
                    {dataSource.roles.map((item: any) => (
                      <div key={item.id} className="flex items-center hover:bg-gray-100 p-1 rounded-lg transition-colors">
                        <Controller
                          control={control}
                          name={`roleName.${item.label}`}
                          defaultValue={data ? roles.some((role) => role.label === item.label) : item.isDefault}
                          render={({ field }) => (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm">{item.label}</span>
                            </label>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default UserAddEditContent;