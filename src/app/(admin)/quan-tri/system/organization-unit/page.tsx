"use client";

import React, { useEffect, useState, Fragment } from "react";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";
import { proxyService } from "@/services";

// Lazy load Modal
const AddUnit = React.lazy(() => import("@/components/system/organization-unit/AddEdit"));

const OrganizationUnitPage = () => {
  const [dsDonViTrucThuoc, setDsDonViTrucThuoc] = useState<any[]>([]);
  const [dsDonViChucNang, setDsDonViChucNang] = useState<any[]>([]);
  const [dsPhanLoaiDonVi, setDsPhanLoaiDonVi] = useState<any[]>([]);
  const [dataDistrict, setDataDistrict] = useState([]);

  // Hàm chuẩn bị dữ liệu gửi lên Server
  const createDataForm = (data: any) => {
    const apiKetNoi: any = {};
    if (data.type === "adapter" && data.apiKetNoi) {
      data.apiKetNoi.forEach((item: any) => {
        apiKetNoi[item.ten] = item.giaTri;
      });
    }
    
    const headers: any = {};
    if (data.headers) {
      data.headers.forEach((item: any) => {
        headers[item.ten] = item.giaTri;
      });
    }

    return {
      code: data.code || "",
      displayName: data.displayName || "",
      type: data.type || "",
      color: data.color || "default",
      order: data.order || 0,
      username: data.username || "",
      password: data.password || "",
      apiKetNoi,
      headers,
      shortName: data?.shortName || "",
      administrativeSubordinateUnitId: data?.administrativeSubordinateUnitId,
      parentId: data?.parentId,
      level: data?.level ?? -1,
      address: data?.address || "",
      email: data?.email || "",
      danhSachChucNang: Array.isArray(data?.danhSachChucNang) ? data.danhSachChucNang : [],
      phanLoai: data?.phanLoai || null,
    };
  };

  const handleOrganizationUnitData = (data: any) => data;

  // Lấy danh mục chức năng và phân loại
  const getDanhMuc = async () => {
    const danhSachMaChucNang = ['DonViChucNang', 'PhanLoaiDonVi'];
    const query = danhSachMaChucNang.map(item => `DanhSachMaChucNang=${encodeURIComponent(item)}`).join("&");

    try {
      const res = await proxyService.get(`/api/app/danh-muc/danh-sach-ma?${query}`);
      if (res?.status === 200 && res?.data) {
        setDsDonViChucNang(res.data['DonViChucNang'].map((x: any) => ({
          label: x.ten,
          value: x.ma,
          shortlabel: x.tenVietTat
        })));
        setDsPhanLoaiDonVi(res.data['PhanLoaiDonVi'].map((x: any) => ({
          label: x.ten,
          value: x.id,
          shortlabel: x.tenVietTat
        })));
      }
    } catch (err) {}
  };

  const getDsDonViTrucThuoc = async () => {
    try {
      const res = await proxyService.get("/api/app/organization-unit/phan-cap");
      if (res.status === 200 && res.data) {
        setDsDonViTrucThuoc(res.data.map((item: any) => ({
          label: item.shortName,
          value: item.id,
          level: item?.level,
          parentId: item?.parentId,
        })));
      }
    } catch (error) {}
  };

  useEffect(() => {
    getDsDonViTrucThuoc();
    getDanhMuc();
  }, []);

  const metadata = {
    serverSide: {
      api: "/api/app/organization-unit/phan-cap-qL",
      transformStrategy: (data: any) => data,
    },
    table: {
      permission: "OrganizationUnit.Default",
      pagination: false,
      columns: [
        {
          name: "Tên đơn vị",
          dataField: "displayName",
          width: "300px",
          dataFormatEdit: (row: any) => {
            const hierarchy = "|-- ".repeat(row.level);
            return (
              <div className={`flex items-center ${row.level === 0 ? "font-bold text-blue-600" : "text-gray-600"}`}>
                <span className="text-gray-400 font-mono mr-1">{hierarchy}</span>
                <span>{row.displayName}</span>
              </div>
            );
          },
        },
        {
          name: "Mã",
          dataField: "code",
          dataFormat: (row: any) => row.code && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              {row.code}
            </span>
          ),
        },
        {
          name: "Chức năng",
          dataField: "danhSachChucNang",
          width: "250px",
          dataFormat: (row: any) => {
            const danhSachChucNang = row?.danhSachChucNang || [];
            return (
              <div className="flex flex-wrap gap-1">
                {Array.isArray(danhSachChucNang) && danhSachChucNang.length > 0 ? (
                  danhSachChucNang.map((ma: any) => {
                    const maValue = typeof ma === 'object' ? ma.ma : ma;
                    const chucNang = dsDonViChucNang.find(item => item.value === maValue);
                    return chucNang ? (
                      <span key={maValue} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {chucNang.label}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-xs text-gray-400">Trống</span>
                )}
              </div>
            );
          },
        },
        {
          name: "Phân loại",
          dataField: "phanLoai",
          dataFormat: (row: any) => {
            const phanLoai = dsPhanLoaiDonVi.find((item) => item.value === row.phanLoai);
            return phanLoai ? <span className="text-sm">{phanLoai.label}</span> : <span>-</span>;
          },
        },
        {
          name: "Địa chỉ",
          dataField: "address",
        },
        {
          name: "Tác vụ",
          dataField: "actions",
          style: { width: "50px" },
          dataFormat: (row: any) => {
            const supportsCalendar = row?.danhSachChucNang?.includes('LichLamViec');
            if (supportsCalendar) {
              return (
                <button
                  type="button"
                  title="Copy link lịch làm việc"
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => {
                    const url = `${window.location.origin}/webview/lich-lam-viec-chia-se/${row.code}`;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  <i className="fa-solid fa-copy text-gray-500"></i>
                </button>
              );
            }
            return null;
          },
        }
      ],
      tableStyles: { stripedRows: false, showGridlines: false },
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm đơn vị...",
      components: [
        {
          name: "phanLoai",
          placeholder: "Phân loại",
          filterByDataField: "phanLoai",
          data: dsPhanLoaiDonVi,
        },
        {
          name: "parentId",
          placeholder: "Đơn vị trực thuộc",
          filterByDataField: "parentId",
          data: dsDonViTrucThuoc,
        },
      ],
    },
    crudButtons: {
      create: {
        active: true,
        permission: "OrganizationUnit.Default.Create",
        style: { minWidth: "70%" },
        uiConfigs: { headerText: "Thêm mới đơn vị" },
        dataSource: { dsDonViTrucThuoc, dataDistrict, dsDonViChucNang, dsPhanLoaiDonVi },
        component: AddUnit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleOrganizationUnitData(data),
        api: "/api/app/organization-unit",
        callback: (data: any) => {
          setDsDonViTrucThuoc(prev => [
            ...prev,
            {
              label: data.shortName,
              value: data.id,
              level: data?.level === -1 ? 0 : data?.level,
              parentId: data?.parentId,
            }
          ]);
        },
      },
      update: {
        active: true,
        permission: "OrganizationUnit.Default.Update",
        style: { minWidth: "70%" },
        uiConfigs: { headerText: "Cập nhật đơn vị" },
        dataSource: { dsDonViTrucThuoc, dataDistrict, dsDonViChucNang, dsPhanLoaiDonVi },
        component: AddUnit,
        transform2BE: (data: any) => createDataForm(data),
        handleResponseData: (data: any) => handleOrganizationUnitData(data),
        api: "/api/app/organization-unit",
        callback: (data: any) => {
          setDsDonViTrucThuoc(prev => prev.map(item => 
            item.value === data.id ? {
              label: data.shortName,
              value: data.id,
              level: data?.level,
              parentId: data?.parentId,
            } : item
          ));
        },
      },
      delete: {
        active: true,
        permission: "OrganizationUnit.Default.Delete",
        type: DELETE_TYPE_MULTI,
        api: "/api/app/organization-unit",
        callback: (id: string) => {
          setDsDonViTrucThuoc(prev => prev.filter(item => item.value !== id));
        },
        params: "ids",
      },
    },
  };

  return (
    <Fragment>
      {dsPhanLoaiDonVi.length > 0 && <DataTable metadata={metadata} />}
    </Fragment>
  );
};

export default OrganizationUnitPage;