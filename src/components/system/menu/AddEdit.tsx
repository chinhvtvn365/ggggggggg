"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import Image from "next/image";

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

let hierarchyCache: any[] | null = null;
let hierarchyRequest: Promise<any[] | null> | null = null;

const getHierarchyCached = async (): Promise<any[] | null> => {
  if (hierarchyCache) return hierarchyCache;
  if (hierarchyRequest) return hierarchyRequest;

  hierarchyRequest = proxyService
    .get("/api/app/menu-management/hierarchy")
    .then((res) => {
      if (res.status === 200 && Array.isArray(res.data)) {
        hierarchyCache = res.data;
        return hierarchyCache;
      }
      return null;
    })
    .catch((error) => {
      console.error("Lỗi lấy menu cha:", error);
      return null;
    })
    .finally(() => {
      hierarchyRequest = null;
    });

  return hierarchyRequest;
};

const ROLE_ITEM_HEIGHT = 36;
const ROLE_LIST_VIEWPORT_HEIGHT = 320;
const ROLE_LIST_OVERSCAN = 6;

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
  const [roleScrollTop, setRoleScrollTop] = useState(0);

  const getParentMenu = useCallback(async () => {
    const convertToModel = (resdata: any[], currentLevel = 0): any[] => {
      const menus = resdata
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
        menus.unshift({
          key: "",
          label: "--- Chọn ---",
          menuGroup: "",
          level: -1,
          children: [],
        });
      }
      return menus;
    };

    const cachedHierarchy = await getHierarchyCached();
    if (cachedHierarchy) {
      setNodes(convertToModel(cachedHierarchy));
    }
  }, [data]);

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
    const timer = setTimeout(() => {
      void getParentMenu();
      if (data && data.id) {
        data.roleIds?.forEach((roleId: string) => {
          setValue(`roleIdsModal.${roleId}`, true);
        });
        setImagePreviews(data?.image);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [data, getParentMenu, setValue]);

  useEffect(() => {
    setValue("image", imagePreviews);
  }, [imagePreviews, setValue]);

  const menuGroupControl = watch("menuGroup");
  const filteredNodes = menuGroupControl
    ? nodes.filter((x) => x.menuGroup === menuGroupControl || x.key === "")
    : nodes;

  const deferredRoles = useDeferredValue(dataSource.roles || []);
  const selectedRoleIds = useMemo(
    () => new Set((data?.roleIds || []) as string[]),
    [data?.roleIds],
  );

  const roleListWindow = useMemo(() => {
    const total = deferredRoles.length;
    const start = Math.max(
      0,
      Math.floor(roleScrollTop / ROLE_ITEM_HEIGHT) - ROLE_LIST_OVERSCAN,
    );
    const end = Math.min(
      total,
      Math.ceil((roleScrollTop + ROLE_LIST_VIEWPORT_HEIGHT) / ROLE_ITEM_HEIGHT) +
        ROLE_LIST_OVERSCAN,
    );

    return {
      total,
      start,
      end,
      items: deferredRoles.slice(start, end),
    };
  }, [deferredRoles, roleScrollTop]);

  return (
    <div className="admin-modal-form-grid grid grid-cols-12 gap-6 p-1">
      {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
      <div className="col-span-12 md:col-span-8 space-y-3">
        <h5 className="text-lg font-semibold text-blue-700 mb-3">Thông tin</h5>

        <div className="grid grid-cols-12 gap-x-5 gap-y-0">
          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Tên menu"
              name="name"
              rules={REQUIRED}
              layout="horizontal"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Mã"
              name="code"
              layout="horizontal"
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
            />
          </div>

          <div className="col-span-12 md:col-span-6 admin-form-row">
            <label className="admin-form-label">
              Menu cha
            </label>
            <div className="admin-form-control">
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
                    className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-[#0f6bbf] transition-colors"
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
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <DropdownControl
              label="Kiểu hiển thị"
              name="displayType"
              options={dataSource?.functionMenu}
              placeholder="Chọn"
              layout="horizontal"
            />
          </div>

          <div className="col-span-12">
            <Textbox
              label="Đường dẫn"
              name="path"
              layout="horizontal"
              labelWidth="col-span-2"
              inputWidth="col-span-10"
            />
          </div>

          <div className="col-span-12 md:col-span-6 admin-form-row">
            <label className="admin-form-label">
              Icon Class
            </label>
            <div className="admin-form-control flex gap-1 relative">
              <Controller
                name="iconClass"
                control={control}
                render={({ field }) => (
                  <>
                    <Input
                      name={field.name}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="fa-solid fa-home"
                      className="w-full h-9 rounded-md px-2 text-sm shadow-none border border-gray-300 hover:border-gray-400 focus:border-[#0f6bbf] focus:outline-none transition-colors"
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
            />
          </div>

          <div className="col-span-12">
            <Textbox
              label="Mô tả"
              name="description"
              textAreaRow={2}
              layout="horizontal"
              labelWidth="col-span-2"
              inputWidth="col-span-10"
            />
          </div>
        </div>

          <div className="space-y-3 pt-3 mt-1 border-t border-gray-200">
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
                  reader.onloadend = () => {
                    const preview =
                      typeof reader.result === "string" ? reader.result : null;
                    setImagePreviews(preview);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {imagePreviews && (
              <Image
                src={imagePreviews as string}
                alt="Preview"
                width={80}
                height={80}
                unoptimized
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
      <div className="col-span-12 md:col-span-4 bg-white p-3 rounded-lg border border-gray-200">
        <h5 className="text-lg font-semibold text-blue-700 mb-3">Phân quyền</h5>
        <div
          className="overflow-y-auto"
          style={{ maxHeight: `${ROLE_LIST_VIEWPORT_HEIGHT}px` }}
          onScroll={(e) => setRoleScrollTop(e.currentTarget.scrollTop)}
        >
          <div
            className="relative"
            style={{ height: `${roleListWindow.total * ROLE_ITEM_HEIGHT}px` }}
          >
            {roleListWindow.items.map((item: any, index: number) => {
              const roleIndex = roleListWindow.start + index;
              return (
                <div
                  key={item.id}
                  className="absolute left-0 right-0 flex items-center hover:bg-gray-100 p-1 rounded-lg transition-colors"
                  style={{
                    top: `${roleIndex * ROLE_ITEM_HEIGHT}px`,
                    height: `${ROLE_ITEM_HEIGHT}px`,
                  }}
                >
                  <Controller
                    control={control}
                    name={`roleIdsModal.${item.id}`}
                    defaultValue={
                      data ? selectedRoleIds.has(item.id) : item.isDefault
                    }
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm">{item.name}</span>
                      </label>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditModalContent;
