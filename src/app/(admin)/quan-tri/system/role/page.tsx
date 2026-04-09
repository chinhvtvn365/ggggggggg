"use client";

import React, { Fragment, useEffect, useState } from "react";

import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { DELETE_TYPE_SINGLE } from "@/constants/datatable.enum";

// Lazy load component Modal Thêm/Sửa
const AddEdit = React.lazy(() => import("@/components/system/role/AddEdit"));

const RolePage = () => {
  const [modal, setModal] = useState(false);
  const [modalData, setModalData] = useState<any>({});

  const postisionMenu = [
    { label: "--Chọn--", value: "" },
    { label: "Trái", value: "1" },
    { label: "Phải", value: "2" },
    { label: "Trên", value: "3" },
    { label: "Dưới", value: "4" },
    { label: "Giữa", value: "5" },
  ];

  const typeMenu = [
    { label: "--Chọn--", value: "" },
    { label: "Quản trị", value: "1" },
    { label: "Mobile", value: "2" },
  ];

  useEffect(() => {
    // Logic khởi tạo nếu cần
  }, []);

  const handleContentData = (data: any) => {
    return data;
  };

  const transformDataBinding = (dataBinding: any[]) => {
    return dataBinding.map((x) => handleContentData(x));
  };

  const createDataForm = (data: any) => {
    return data;
  };

  const metadata = {
    serverSide: {
      api: "/api/identity/roles",
      transformStrategy: transformDataBinding,
    },
    table: {
      permission: "Identity.Roles",
      pagination: true,
      key: "id",
      columns: [
        {
          name: "Quyền",
          dataField: "id",
          style: { width: "70px" },
          dataFormat: (row: any) => (
            <button
              type="button"
              title="Cấu hình quyền chi tiết"
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              onClick={() => {
                setModalData(row);
                setModal(true);
              }}
            >
              <i className="fa-solid fa-list-check text-lg"></i>
            </button>
          ),
        },
        {
          name: "Tên vai trò",
          dataField: "name",
          dataFormatEdit: (row: any) => (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{row.name}</span>
              {row.isDefault && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                  Mặc định
                </span>
              )}
              {row.isPublic && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                  Công khai
                </span>
              )}
            </div>
          ),
        },
      ],
      tableStyles: {
        stripedRows: false,
        showGridlines: false,
      },
      customList: [],
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm theo tên vai trò...",
      components: [],
    },
    crudButtons: {
      create: {
        active: true,
        permission: "AbpIdentity.Roles.Create",
        style: { minWidth: "400px" },
        uiConfigs: {
          headerText: "Thêm vai trò mới",
        },
        dataSource: { postisionMenu, typeMenu },
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleContentData(data),
        api: "/api/identity/roles",
      },
      update: {
        active: true,
        permission: "AbpIdentity.Roles.Update",
        style: { minWidth: "400px" },
        uiConfigs: {
          headerText: "Cập nhật vai trò",
        },
        dataSource: { postisionMenu, typeMenu },
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleContentData(data),
        api: "/api/identity/roles",
      },
      delete: {
        active: true,
        permission: "AbpIdentity.Roles.Delete",
        type: DELETE_TYPE_SINGLE,
        api: "/api/identity/roles",
        params: "ids",
      },
      customList: [],
    },
  };

  return (
    <Fragment>
      <DataTable metadata={metadata} />
      
      {/* Modal phân quyền chi tiết - Component không khả dụng */}
      {/* {modal && (
        <PermissionModal 
          modal={modal} 
          setModal={setModal} 
          data={modalData} 
        />
      )} */}
    </Fragment>
  );
};

export default RolePage;