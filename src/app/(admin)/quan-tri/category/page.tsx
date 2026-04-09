"use client";

import React, { useEffect, useState, useMemo, useRef, Fragment } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";
import { proxyService } from "@/services";
import utilsService from "@/services/utils/utils.service";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";

// Lazy load component Modal
const AddEdit = React.lazy(() => import("@/components/category/AddEdit"));

const CategoryPage = () => {
  const methods = useForm();
  const dirtyRefs = useRef<any>(null);
  const dataTableRef = useRef<any>(null);
  const { control, handleSubmit } = methods;

  const [danhMuc, setDanhMuc] = useState<any[]>([]);
  const [dsDonVi, setDsDonVi] = useState<any[]>([]);
  const [machucnang, setMachucnang] = useState("DanhSachChucNang");

  // Hàm sao chép mã (Sử dụng Alert đơn giản hoặc bạn có thể thay bằng thư viện Toast)
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Gợi ý: Sử dụng sonner hoặc toast của dự án tại đây
    } catch (err) {
      console.error("Lỗi sao chép");
    }
  };

  const getDanhMucChucNang = async () => {
    try {
      const res = await proxyService.get("/api/app/danh-muc?MaChucNang=DanhSachChucNang&MaxResultCount=0");
      if (res.status === 200 && res.data?.items) {
        const formatData = res.data.items.map((x: any) => ({
          label: x?.ten,
          value: x?.ma,
        }));
        setDanhMuc([{ label: "Danh sách chức năng", value: "DanhSachChucNang" }, ...formatData]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getDsDonVi = async () => {
    try {
      const res = await proxyService.get("/api/app/organization-unit/phan-cap");
      if (res.status === 200 && res.data) {
        setDsDonVi(res.data.map((item: any) => ({
          label: item.shortName,
          value: item.id,
          level: item?.level,
          parentId: item?.parentId,
        })));
      }
    } catch (error) {}
  };

  useEffect(() => {
    const param = new URLSearchParams(window.location.search);
    const ma = param.get("macn") || param.get("machucnang");
    if (ma) setMachucnang(ma);
    
    getDanhMucChucNang();
    getDsDonVi();
  }, []);

  const onSubmit = async (data: any) => {
    const updateRequest: any[] = [];
    if (dirtyRefs.current) {
      for (let key in dirtyRefs.current) {
        if (data[key] !== null) {
          updateRequest.push({ id: key, order: data[key] });
        }
      }
      if (updateRequest.length > 0) {
        const res = await proxyService.put("/api/app/danh-muc", updateRequest);
        if (res.status === 200 && res.data) {
          return res.data.filter((item: any) => item.isSuccess).map((item: any) => item.id);
        }
      }
    }
    return [];
  };

  // Component hiển thị danh sách đơn vị khi hover
  const DonViDisplay = ({ row }: { row: any }) => {
    const units = dsDonVi.filter((dv) => row.donVi?.includes(dv.value));
    
    if (units.length === 0) return <span className="text-gray-400">-</span>;

    return (
      <div
        title={units.map((dv) => dv.label).join(", ")}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 cursor-help"
      >
        <i className="fas fa-info-circle" />
        {units.length} đơn vị
      </div>
    );
  };

  const metadata = useMemo(() => ({
    serverSide: {
      api: "/api/app/danh-muc/phan-cap",
      transformStrategy: (data: any) => data,
    },
    table: {
      pagination: false,
      permission: "DanhMucGroup.Default",
      columns: [
        {
          name: "Tên danh mục",
          dataField: "ten",
          dataFormatEdit: (row: any) => {
            const hierarchy = "|-- ".repeat(row.level);
            return (
              <div className={`flex items-center ${row.level === 0 ? "font-bold text-blue-600" : "text-gray-600"}`}>
                <span className="text-gray-400 font-mono mr-1">{hierarchy}</span>
                <span>{row.ten}</span>
              </div>
            );
          },
        },
        {
          name: "Tên viết tắt",
          dataField: "tenVietTat",
          style: { width: "150px" },
        },
        {
          name: "Mã",
          dataField: "ma",
          style: { width: "220px" },
          dataFormat: (row: any) => (
            <div className="flex items-center gap-2 group">
              <button
                type="button"
                title="Sao chép mã"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                onClick={() => copyToClipboard(row.ma)}
              >
                <i className="fa-solid fa-copy text-gray-400"></i>
              </button>
              <span className="font-mono text-sm">{row.ma}</span>
            </div>
          ),
        },
        {
          name: "Đơn vị áp dụng",
          dataField: "donVi",
          dataFormat: (row: any) => <DonViDisplay row={row} />,
        },
        {
          name: "Thứ tự",
          dataField: "order",
          style: { width: "100px" },
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
          name: "Trạng thái",
          dataField: "isActive",
          style: { width: "100px" },
          dataFormat: (row: any) => (
            <div className="flex justify-center">
              {row.isActive && <i className="fas fa-check text-success"></i>}
            </div>
          ),
        },
      ],
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm theo tên hoặc mã...",
      components: [
        {
          name: "Ma",
          placeholder: "Nhóm danh mục",
          filterByDataField: "Ma",
          data: danhMuc,
          defaultValue: { value: machucnang },
        },
      ],
    },
    crudButtons: {
      create: {
        active: true,
        permission: "DanhMucGroup.Default.Create",
        style: { minWidth: "50%", maxWidth: "1400px" },
        uiConfigs: { headerText: "Thêm danh mục mới" },
        dataSource: { danhMuc, dsDonVi },
        component: AddEdit,
        transform2BE: (data: any) => {
          const form = new FormData();
          form.append("Ten", data.ten || "");
          form.append("MaChucNang", data.maChucNang || "");
          form.append("Ma", data.ma || utilsService.removeVietnameseTones(data.ten));
          form.append("Order", data.order || 0);
          form.append("IsActive", data.isActive || false);
          (data.donVi || []).forEach((dv: string, i: number) => form.append(`donVi[${i}]`, dv));
          return form;
        },
        api: "/api/app/danh-muc",
      },
      update: {
        active: true,
        permission: "DanhMucGroup.Default.Update",
        style: { minWidth: "50%", maxWidth: "1400px" },
        uiConfigs: { headerText: "Cập nhật danh mục" },
        dataSource: { danhMuc, dsDonVi },
        component: AddEdit,
        transform2BE: (data: any) => {
          const form = new FormData();
          form.append("Ten", data.ten || "");
          form.append("Ma", data.ma || "");
          form.append("Order", data.order || 0);
          form.append("IsActive", data.isActive || false);
          (data.donVi || []).forEach((dv: string, i: number) => form.append(`donVi[${i}]`, dv));
          return form;
        },
        api: "/api/app/danh-muc",
      },
      delete: {
        active: true,
        permission: "DanhMucGroup.Default.Delete",
        type: DELETE_TYPE_MULTI,
        api: "/api/app/danh-muc",
        params: "ids",
      },
    },
  }), [machucnang, dsDonVi, danhMuc, control]);

  return (
    <div className="p-4">
      <DataTable metadata={metadata} ref={dataTableRef} />
    </div>
  );
};

export default CategoryPage;