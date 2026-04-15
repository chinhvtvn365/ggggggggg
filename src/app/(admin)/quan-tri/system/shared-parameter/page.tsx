"use client";

import React, { useMemo } from "react";
// HeroUI Components
import { Chip } from "@heroui/react";
import moment from "moment";

import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { DELETE_TYPE_SINGLE } from "@/constants/datatable.enum";

// Lazy load Modal Thêm/Sửa
const AddEdit = React.lazy(() => import("@/components/shared-parameter/AddEditModal"));

const SharedParameterPage = () => {
  // Logic biến đổi dữ liệu nhận từ Server
  const transformDataBinding = (dataBinding: any[]) => {
    return dataBinding;
  };

  // Logic đóng gói dữ liệu gửi lên Server
  const createDataForm = (data: any) => {
    return {
      key: data.key,
      value: data.value,
      description: data.description,
    };
  };

  const handleResponseData = (data: any) => {
    return { ...data };
  };

  // Cấu hình bảng và các tác vụ
  const metadata = useMemo(() => ({
    serverSide: {
      api: "/api/app/shared-parameter",
      transformStrategy: transformDataBinding,
    },
    table: {
      pagination: true,
      permission: "SharedParameter.Default",
      columns: [
        {
          name: "Từ khóa",
          dataField: "key",
          filterBy: "key",
          // Hiển thị text in đậm cho từ khóa
          dataFormatEdit: (row: any) => (
            <span className="font-semibold text-primary">{row.key}</span>
          ),
        },
        { 
          name: "Mô tả", 
          dataField: "description",
          // Tự động rút gọn text nếu quá dài
          dataFormat: (row: any) => (
            <span className="text-default-600 line-clamp-2">{row.description}</span>
          )
        },
        {
          name: "Ngày cập nhật",
          style: { width: "200px" },
          dataFormat: (row: any) => (
            <div className="flex justify-center">
              {row.lastModificationTime ? (
                <Chip
                  variant="flat"
                  size="sm"
                  color="secondary"
                >
                  <i className="fa-regular fa-clock mx-1"></i>
                  {moment(row.lastModificationTime).format("HH:mm DD/MM/YYYY")}
                </Chip>
              ) : (
                <span className="text-default-400 italic text-tiny">Chưa cập nhật</span>
              )}
            </div>
          ),
        },
      ],
      tableStyles: {
        stripedRows: true, // Sử dụng sọc cho bảng cấu hình để dễ nhìn
        showGridlines: false,
      },
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm theo từ khóa hoặc mô tả...",
      components: [],
    },
    crudButtons: {
      create: {
        active: false, // Vô hiệu hóa thêm mới tham số hệ thống
      },
      update: {
        active: true,
        permission: "SharedParameter.Default.Update",
        style: { minWidth: "50%", maxWidth: "800px" },
        uiConfigs: {
          headerText: "Cấu hình tham số",
        },
        dataSource: {},
        component: AddEdit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleResponseData(data),
        api: "/api/app/shared-parameter",
      },
      delete: {
        active: false, // Vô hiệu hóa xóa tham số hệ thống để bảo vệ cấu hình core
        permission: "SharedParameter.Default.Delete",
        type: DELETE_TYPE_SINGLE,
        api: "/api/app/shared-parameter",
        params: "ids",
      },
    },
  }), []);

  return (
    <div className="p-4 bg-background">
      <DataTable metadata={metadata} />
    </div>
  );
};

export default SharedParameterPage;