"use client";

import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";

import { REQUIRED } from "@/constants/datatable.enum";
import { proxyService } from "@/services";
import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";

// Icon list for demo - replace with actual icon selection component
const icons = [
  { value: "fa-home", label: "Home" },
  { value: "fa-user", label: "User" },
  { value: "fa-cog", label: "Settings" },
];

const AddEditModalContent = ({
  data,
  dataSource,
}: {
  data: any;
  dataSource: any;
}) => {
  const methods = useFormContext();
  const { control, setValue, watch } = methods;

  const [nodes, setNodes] = useState<any[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Chuyển đổi dữ liệu cho TreeSelect (hoặc Select phân cấp)
  const convertToModel = (resdata: any[], currentLevel = 0): any[] => {
    let menus = resdata
      .map((item) => {
        if (data !== null && item.id === data?.id) return null;
        return {
          key: item.id,
          label: item.name,
          menuGroup: item.menuGroup,
          level: currentLevel,
          children: item.children?.length
            ? convertToModel(item.children, currentLevel + 1)
            : [],
        };
      })
      .filter(Boolean);

    if (currentLevel === 0) {
      menus.unshift({ key: "", label: "--- Chọn ---", level: -1 });
    }
    return menus;
  };

  const getParentMenu = async () => {
    try {
      const res = await proxyService.get("/api/app/menu-management/hierarchy");
      if (res.status === 200 && res.data) {
        setNodes(convertToModel(res.data));
      }
    } catch (error) {
      console.error("Lỗi lấy menu cha:", error);
    }
  };

  const findNodeByKey = (nodes: any[], key: string): any => {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children?.length) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    getParentMenu();
    if (data && data.id) {
      data.roleIds?.forEach((roleId: string) => {
        setValue(`roleIdsModal.${roleId}`, true);
      });
      setImagePreviews(data?.image);
    }
  }, [data, setValue]);

  useEffect(() => {
    setValue("image", imagePreviews);
  }, [imagePreviews, setValue]);

  const menuGroupControl = watch("menuGroup");
  const filteredNodes = menuGroupControl
    ? nodes.filter((x) => x.menuGroup === menuGroupControl || x.key === "")
    : nodes;

  return (
    <div className="grid grid-cols-12 gap-6 p-1">
      {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
      <div className="col-span-12 md:col-span-8 space-y-3">
        <h5 className="text-lg font-semibold text-blue-600 mb-3">Thông tin</h5>

        <div className="grid grid-cols-12 gap-x-5 gap-y-0">
          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Tên menu"
              name="name"
              rules={REQUIRED}
              layout="horizontal"
              labelWidth="w-1/3"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Mã"
              name="code"
              layout="horizontal"
              labelWidth="w-1/3"
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <DropdownControl
              label="Nhóm menu"
              name="menuGroup"
              options={dataSource?.groupMenu}
              rules={REQUIRED}
              placeholder="Chọn"
              layout="horizontal"
              labelWidth="w-1/3"
            />
          </div>

          <div className="col-span-12 md:col-span-6 flex items-center gap-2 py-1">
            <label className="text-sm font-bold text-gray-700 w-1/3">
              Menu cha
            </label>
            <div className="flex-1">
              {/* Lưu ý: Nếu dự án của bạn có component TreeSelect riêng, hãy thay thế tại đây */}
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <select
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-[#0f6bbf] transition-colors"
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                      const selectedNode = findNodeByKey(nodes, val);
                      setValue(
                        "level",
                        selectedNode ? selectedNode.level + 1 : 0,
                      );
                    }}
                  >
                    {filteredNodes.map((node) => (
                      <option key={node.key} value={node.key}>
                        {"--".repeat(node.level > 0 ? node.level : 0)}{" "}
                        {node.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <DropdownControl
              label="Vị trí"
              name="menuLocation"
              options={dataSource?.postisionMenu}
              placeholder="Chọn"
              layout="horizontal"
              labelWidth="w-1/3"
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <DropdownControl
              label="Kiểu hiển thị"
              name="displayType"
              options={dataSource?.functionMenu}
              placeholder="Chọn"
              layout="horizontal"
              labelWidth="w-1/3"
            />
          </div>

          <div className="col-span-12">
            <Textbox
              label="Đường dẫn"
              name="path"
              layout="horizontal"
              labelWidth="w-1/6"
            />
          </div>

          <div className="col-span-12 md:col-span-6 flex items-center gap-2 py-1">
            <label className="text-sm font-bold text-gray-700 w-1/3">
              Icon Class
            </label>
            <div className="flex-1 flex gap-1 relative">
              <Controller
                name="iconClass"
                control={control}
                render={({ field }) => (
                  <>
                    <Input
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="fa-solid fa-home"
                      className="w-full h-9 rounded-md shadow-none text-sm border border-gray-300 rounded hover:border-gray-400 focus:border-[#0f6bbf] transition-colors bg-white px-2"
                    />
                    {showIconPicker && (
                      <div className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <div className="h-9 overflow-y-auto p-2">
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon: any) => (
                              <button
                                key={icon.value}
                                type="button"
                                onClick={() => {
                                  setValue("iconClass", icon.value);
                                  setShowIconPicker(false);
                                }}
                                title={icon.label}
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                              >
                                <i className={`${icon.value} text-lg`}></i>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Thứ tự"
              name="order"
              type="number"
              layout="horizontal"
              labelWidth="w-1/3"
            />
          </div>

          <div className="col-span-12">
            <Textbox
              label="Mô tả"
              name="description"
              textAreaRow={2}
              layout="horizontal"
              labelWidth="w-1/6"
            />
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t">
          <div className="flex flex-col gap-2 mb-4">
            <label className="text-sm font-medium">Icon cho menu</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
              <img
                src={imagePreviews as string}
                alt="Preview"
                className="mt-2 w-20 h-20 object-cover rounded"
              />
            )}
          </div>

          <div className="flex gap-4">
            <Controller
              name="isActive"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Kích hoạt</span>
                </label>
              )}
            />
            <Controller
              name="moTabMoi"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Mở tab mới</span>
                </label>
              )}
            />
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: PHÂN QUYỀN */}
      <div className="col-span-12 md:col-span-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <h5 className="text-lg font-semibold text-blue-600 mb-3">Phân quyền</h5>
        <div className="flex flex-col">
          {dataSource.roles?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center hover:bg-gray-100 p-1 rounded-lg transition-colors"
            >
              <Controller
                control={control}
                name={`roleIdsModal.${item.id}`}
                defaultValue={
                  data
                    ? data.roleIds?.some((role: any) => role === item.id)
                    : item.isDefault
                }
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">{item.name}</span>
                  </label>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddEditModalContent;
