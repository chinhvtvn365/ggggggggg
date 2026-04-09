"use client";

import React, { Fragment, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";
import { proxyService } from "@/services";

// Lazy load component
const AddEdit = React.lazy(() => import("@/components/system/menu/AddEdit"));

const Page = () => {
  const methods = useForm();
  const dirtyRefs = useRef<any>(null);
  const { control } = methods;

  const dataTableRef = useRef<any>(null);
  
  // Các hằng số menu
  const postisionMenu = [
    { label: "Trái", value: "left" },
    { label: "Phải", value: "right" },
    { label: "Trên", value: "top" },
    { label: "Dưới", value: "bottom" },
    { label: "Giữa", value: "center" },
  ];
  
  const groupMenu = [
    { label: "Quản trị", value: "administration" },
    { label: "Website", value: "website" },
    { label: "Mobile", value: "mobile" },
    { label: "Zalo app", value: "zaloapp" },
  ];

  const [roles, setRoles] = useState<any[]>([]);
  const [rolesDropdown, setRolesDropDown] = useState<any[]>([]);
  const [functionMenu, setFunctionMenu] = useState([]);

  useEffect(() => {
    getAssignableRoles();
    getMenuParam();
  }, []);

  const getAssignableRoles = async () => {
    try {
      const res = await proxyService.get("/api/identity/users/assignable-roles");
      if (res.status === 200 && res.data) {
        setRoles(res.data?.items);
        setRolesDropDown(
          res.data?.items.map((item: any) => ({
            value: item.id,
            label: item.name,
          }))
        );
      }
    } catch (error) {
      console.error("Lỗi lấy quyền:", error);
    }
  };

  const getMenuParam = async () => {
    try {
      const res = await proxyService.get("/api/app/shared-parameter/by-key?key=DisplayTypeMenu");
      if (res.status === 200 && res.data?.value) {
        setFunctionMenu(JSON.parse(res.data.value));
      }
    } catch (error) {
      console.error("Lỗi lấy tham số menu:", error);
    }
  };

  const sortByGroupAndOrder = (dataBinding: any[]) => {
    const result: any[] = [];
    const rootItems = dataBinding.filter(item => !item.parentId);
    rootItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    const addItemWithChildren = (item: any) => {
      result.push(item);
      const children = dataBinding.filter(child => child.parentId === item.id);
      children.sort((a, b) => (a.order || 0) - (b.order || 0));
      children.forEach(child => addItemWithChildren(child));
    };

    rootItems.forEach(rootItem => addItemWithChildren(rootItem));
    return result;
  };

  const createDataForm = (data: any) => {
 const form = new FormData()
    form.append("name", data.name || "")
    form.append("code", data.code || "")
    form.append("menuGroup", data.menuGroup || "")
    form.append("displayType", data.displayType || "")
    form.append("menuLocation", data.menuLocation || "")
    form.append("level", data.level || 0)
    form.append("path", data.path || "")
    form.append("parentId", data.parentId || "")
    form.append("order", data.order || 0)
    form.append("isActive", data.isActive || false)
    form.append("moTabMoi", data.moTabMoi || false)
    form.append("iconClass", data.iconClass || "")
    form.append("description", data.description || "")
    if (data.image) {
      if (data.image instanceof File) {
        form.append("HinhAnh", data.image)
      } else if (typeof data.image === "string") {
        form.append("Image", data.image)
      }
    }
    const selectedRoles = data.roleIdsModal
      ? Object.entries(data.roleIdsModal)
          .filter(([key, value]) => value === true)
          .map(([key]) => key)
      : []

    selectedRoles.forEach((role, index) => {
      form.append(`roleIds[${index}]`, role)
    })

    return form
  };

  const onSubmit = async (data: any) => {
    const updateRequest: any[] = [];
    if (dirtyRefs.current) {
      for (let key in dirtyRefs.current) {
        if (data[key] !== null) {
          updateRequest.push({ id: key, order: data[key] });
        }
      }
      if (updateRequest.length > 0) {
        const res = await proxyService.put("/api/app/menu-management", updateRequest);
        if (res.status === 200 && res.data) {
          return res.data.filter((item: any) => item.isSuccess).map((item: any) => item.id);
        }
      }
    }
    return [];
  };

  const metadata = {
    serverSide: {
      api: "/api/app/menu-management",
      transformStrategy: (data: any[]) => sortByGroupAndOrder(data),
    },
    displayStratetry: sortByGroupAndOrder,
    table: {
      pagination: false,
      permission: "MenuManagement.Default",
      key: "id",
      columns: [
        {
          name: "Tên",
          dataField: "name",
          style: { width: "340px", minWidth: "340px" },
          dataFormatEdit: (row: any) => {
            const level = Number(row.level || 0);
            const levelIndent = level === 0 ? 0 : level === 1 ? 24 : 48;
            return (
              <div className="relative flex items-center gap-2" style={{ marginLeft: levelIndent }}>
                {level > 0 && (
                  <>
                    <span className="absolute -left-3 top-1/2 h-px w-3 bg-slate-300" />
                    <span className="absolute -left-3 top-0 h-1/2 w-px bg-slate-300" />
                  </>
                )}

                {level === 0 ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 shadow-sm">
                    <i className="fa-regular fa-folder-open text-base" />
                  </span>
                ) : (
                  <i className="fa-solid fa-chevron-right text-slate-400 text-[10px] w-4 text-center" />
                )}

                <span
                  className={`text-[#2563EB] font-semibold ${
                    level === 0 ? "uppercase tracking-wide font-admin-heading" : ""
                  }`}
                >
                  {row.name}
                </span>
              </div>
            );
          },
        },
        {
          name: "Phân quyền",
          dataFormat: (row: any) => (
            <div className="flex flex-wrap gap-1.5">
              {row.roleIds?.map((id: string, index: number) => {
                const roleName = roles.find((x) => x.id === id)?.name;
                return roleName ? (
                  <span key={index} className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500 text-white">
                    {roleName}
                  </span>
                ) : null;
              })}
            </div>
          ),
        },
        {
          name: "Đường dẫn",
          dataField: "path",
          style: { minWidth: "100px" },
          dataFormat: (row: any) => row.path && (
            <a href={row.path} title={row.path} className="text-blue-500 hover:text-blue-700">
              <i className="fa-solid fa-link"></i>
            </a>
          ),
        },
        {
          name: "Thứ tự",
          dataField: "order",
                    style: { minWidth: "100px" },
          dataFormat: (row: any) => (
            <input
              type="number"
              defaultValue={row.order}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onBlur={(e) => {
                if (dirtyRefs.current) {
                  dirtyRefs.current[row.id] = e.target.value;
                }
              }}
            />
          ),
        },
        {
          name: "Kích hoạt",
          style: { minWidth: "100px" },
          dataField: "isActive",
          dataFormat: (row: any) => (
            <div className="text-center">
              {row.isActive ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm">
                  <i className="fa-solid fa-check text-emerald-500 text-sm" />
                </span>
              ) : null}
            </div>
          ),
        },
      ],
      stickyLeftColumns: 2,
      tableStyles: {
        stripedRows: true,
        showGridlines: true,
      },
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm theo tên/mã",
      components: [
        {
          name: "MenuGroup",
          data: groupMenu,
          filterByDataField: "menuGroup",
          placeholder: "Quản trị",
          defaultValue: { value: "administration" },
        },
        {
          name: "MenuLocation",
          data: postisionMenu,
          filterByDataField: "menuLocation",
          placeholder: "Vị trí",
        },
        {
          name: "roleId",
          data: rolesDropdown,
          filterByDataField: "roleId",
          placeholder: "Phân quyền",
        },
      ],
    },
    crudButtons: {
      active: {
        api: "/api/app/menu-management/active",
      },
      create: {
        active: true,
        permission: "MenuManagement.Default.Create",
        uiConfigs: { 
          headerText: "Thêm menu",
          modalWidth: "max-w-6xl"
        },
        dataSource: { roles, postisionMenu, groupMenu, functionMenu },
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        api: "/api/app/menu-management",
      },
      update: {
        active: true,
        permission: "MenuManagement.Default.Update",
        uiConfigs: { 
          headerText: "Cập nhật menu",
          modalWidth: "max-w-6xl"
        },
        dataSource: { roles, postisionMenu, groupMenu, functionMenu },
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        api: "/api/app/menu-management",
      },
      delete: {
        active: true,
        permission: "MenuManagement.Default.Delete",
        type: DELETE_TYPE_MULTI,
        api: "/api/app/menu-management",
        params: "ids",
      },
      customList: [
        {
          label: "Bỏ kích hoạt",
          color: "warning",
          icon: "fa-solid fa-xmark",
          permission: "MenuManagement.Default.Update",
          requiresSelection: true,
          onClick: (_e: any, selected: any[], helpers: any) => {
            helpers.openActiveModal(false);
          },
        },
        {
          label: "Kích hoạt",
          color: "primary",
          icon: "fa-solid fa-check",
          permission: "MenuManagement.Default.Update",
          requiresSelection: true,
          onClick: (_e: any, selected: any[], helpers: any) => {
            helpers.openActiveModal(true);
          },
        },
        {
          label: "Cập nhật thứ tự",
          color: "primary",
          icon: "fa-solid fa-floppy-disk",
          permission: "MenuManagement.Default.Update",
          requiresSelection: false,
          onClick: (_e: any) => {
            return onSubmit(methods.getValues());
          },
          callback: async (res: any, data: any[], setBack: Function) => {
            if (dirtyRefs.current) {
              const successIds = await res;
              const newData = data.map((item) => {
                if (successIds.includes(item.id)) {
                  return { ...item, order: methods.getValues(item.id) };
                }
                return item;
              });
              setBack(newData);
              dirtyRefs.current = null;
            }
          },
        },
      ],
    },
  };

  return (
    <Fragment>
      {roles.length > 0 && (
        <FormProvider {...methods}>
          <DataTable
            metadata={metadata}
            rowClassNameCustom={(rowData: any) =>
              Number(rowData?.level || 0) === 0 ? "bg-blue-50/50" : ""
            }
          />
        </FormProvider>
      )}
    </Fragment>
  );
};

export default Page;