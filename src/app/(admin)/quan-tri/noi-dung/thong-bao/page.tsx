"use client";

import React, { useEffect, useState } from "react";
import moment from "moment";
import Image from "next/image";
import { Card } from "@heroui/react";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import AddEditTinTucBaiViet from "@/components/tin-tuc-bai-viet/AddEditTinTucBaiViet";
import proxyService from "@/services/proxy/proxy.service";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LookupEntry {
  label: string;
  value: string;
  shortlabel?: string;
}

interface ImageData {
  id?: string;
  path?: string;
  url?: string;
  fileUrl?: string;
  dataUrl?: string;
}

interface NewsItem {
  id?: string;
  tieuDe: string;
  hinhAnh?: ImageData | File | null;
  newsTopic?: string;
  linhVuc?: string;
  linhVucLabel?: string;
  tenLinhVuc?: string;
  loaiTinTuc?: string;
  noiDungTomTat?: string;
  noiDung?: string;
  duongDanThanThien?: string;
  duongDanTopic?: string;
  creationTime?: string;
  ngayXuatBan?: string;
  lastModificationTime?: string;
  tenNguoiTao?: string;
  tenNguoiCapNhat?: string;
  isActive: boolean;
  mucDoUuTien?: number;
  thongBao?: boolean;
  khanCap?: boolean;
  nguonTin?: string;
  [key: string]: unknown;
}

// ─── Component ───────────────────────────────────────────────────────────────

const Page = () => {
  const [dsLinhVuc, setLinhVuc] = useState<LookupEntry[]>([]);
  const [dsChuDe, setChuDe] = useState<LookupEntry[]>([]);
  const [dsLoaiBanTin, setLoaiBanTin] = useState<LookupEntry[]>([]);

  const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || "";

  const getImageSource = (data: NewsItem): string | null => {
    if (!data.hinhAnh || data.hinhAnh instanceof File) return null;
    const img = data.hinhAnh as ImageData;
    if (img.path) return `${ASSETS_URL}${img.path}`;
    if (img.url) return img.url;
    if (img.fileUrl) return img.fileUrl;
    if (img.dataUrl) return img.dataUrl;
    return null;
  };

  // ── Data fetching ──
  const getDanhMuc = async () => {
    const danhSachMa = ["LinhVucNongNghiep", "LoaiTinTuc"];
    const query = danhSachMa.map((m) => `DanhSachMaChucNang=${m}`).join("&");
    try {
      const res = await proxyService.get<
        Record<string, Array<{ ten: string; id?: string; ma?: string; tenVietTat?: string }>>
      >(`/api/app/danh-muc/danh-sach-ma?${query}`);
      if (res?.status === 200 && res?.data) {
        setLinhVuc(
          (res.data["LinhVucNongNghiep"] || []).map((x) => ({
            label: x.ten, value: x.id || "", shortlabel: x.tenVietTat,
          }))
        );
        setLoaiBanTin(
          (res.data["LoaiTinTuc"] || []).map((x) => ({
            label: x.ten, value: x.ma || "", shortlabel: x.tenVietTat,
          }))
        );
      }
    } catch (err) { console.error(err); }
  };

  const getChuDe = async () => {
    try {
      const res = await proxyService.get<{ items: Array<{ ten: string; id: string }> }>(
        "/api/app/tin-tuc-chu-de/phan-cap?IsActive=true"
      );
      if (res?.status === 200 && res.data?.items) {
        setChuDe(res.data.items.map((x) => ({ label: x.ten, value: x.id })));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void getDanhMuc();
      void getChuDe();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // ── Form builder ──
  const createDataForm = async (data: NewsItem) => {
    const form = new FormData();
    form.append("TieuDe", data.tieuDe || "");
    form.append("LinhVuc", data.linhVuc || "");
    form.append("LoaiTinTuc", data.loaiTinTuc || "");
    const slug =
      data.duongDanThanThien ||
      data.tieuDe
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    form.append("DuongDanThanThien", slug || "");
    form.append("NoiDungTomTat", data.noiDungTomTat || "");
    form.append("NoiDung", data.noiDung || "");
    form.append(
      "NgayXuatBan",
      data.ngayXuatBan ? moment(data.ngayXuatBan).toISOString() : moment().toISOString()
    );
    form.append("IsActive", String(data.isActive || false));
    if (data.id) form.append("Id", data.id);

    if (data.hinhAnh instanceof File) {
      const uploadForm = new FormData();
      uploadForm.append("files", data.hinhAnh);
      const res = await proxyService.post<Array<{ id: string }>>(
        "/api/app/file-upload/upload-multi?folder=tin-tuc",
        uploadForm
      );
      if (res?.data?.[0]?.id) form.append("HinhAnh", res.data[0].id);
    }
    return form;
  };

  // ── Metadata ──
  const metadata = {
    serverSide: {
      api: "/api/app/tin-tuc-bai-viet",
      transformStrategy: (data: Record<string, unknown>[] = []) => data,
    },
    table: {
      columns: [
        // ── Ảnh ──
        {
          name: "Ảnh",
          dataField: "hinhAnh",
          width: "92px",
          alignItems: "center",
          className: "sticky-col-img",
          headerClassName: "sticky-col-img",
          dataFormat: (data: NewsItem) => {
            const imageSrc = getImageSource(data);
            return (
              <div className="flex justify-center">
                {imageSrc ? (
                  <div className="relative h-[48px] w-[72px] overflow-hidden rounded border border-[#CBD5E1] bg-white">
                    <Image
                      width={72}
                      height={48}
                      unoptimized
                      src={imageSrc}
                      alt="Ảnh"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const next = (e.target as HTMLImageElement).nextSibling as HTMLElement | null;
                        if (next) next.style.display = "flex";
                      }}
                    />
                  </div>
                ) : null}
                <div
                  style={{
                    height: "48px", width: "72px", backgroundColor: "#F8FAFC",
                    borderRadius: "4px", display: imageSrc ? "none" : "flex",
                    alignItems: "center", justifyContent: "center",
                    border: "1px solid #CBD5E1",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
              </div>
            );
          },
        },

        // ── Tiêu đề ──
        {
          name: "Tiêu đề",
          dataField: "tieuDe",
          className: "sticky-col-title",
          headerClassName: "sticky-col-title",
          dataFormatEdit: (row: NewsItem) => (
            <div className="min-w-[200px]">
              <div
                className="text-sm font-medium text-[#111827] line-clamp-2"
                style={{ lineHeight: "1.5" }}
              >
                {row.tieuDe}
              </div>
              {row.duongDanThanThien && (
                <div className="mt-1 max-w-[280px] text-xs text-[#6B7280] truncate font-mono">
                  /{row.duongDanTopic}/{row.duongDanThanThien}
                </div>
              )}
            </div>
          ),
        },

        // ── Nội dung tóm tắt ──
        {
          name: "Nội dung tóm tắt",
          dataField: "noiDungTomTat",
          dataFormatEdit: (row: NewsItem) => (
            <div className="line-clamp-1 text-sm text-slate-500">
              {row.noiDungTomTat || "Chưa có nội dung tóm tắt"}
            </div>
          ),
        },

        // ── Lĩnh vực / Chuyên đề ──
        {
          name: "Lĩnh vực, chuyên đề",
          dataField: "newsTopic",
          width: "130px",
          dataFormat: (row: NewsItem) => {
            if (!row.newsTopic || row.newsTopic === "00000000-0000-0000-0000-000000000000") {
              return <span style={{ color: "#999" }}>Chưa phân loại</span>;
            }
            const chuDe = dsChuDe.find((cd) => cd.value === row.newsTopic);
            return (
              <span>
                {chuDe?.label || "Khác"}
              </span>
            );
          },
        },

        // ── Ngày xuất bản ──
        {
          name: "Ngày xuất bản",
          dataField: "ngayXuatBan",
          width: "110px",
          dataFormatEdit: (row: NewsItem) => {
            const nguoiThucHien = row?.tenNguoiTao;
            return (
              <div style={{ color: "#666" }}>
                {nguoiThucHien && (
                  <div style={{ color: "#333", fontWeight: "500", marginBottom: "2px" }}>
                    {nguoiThucHien}
                  </div>
                )}
                {row.ngayXuatBan && moment(row.ngayXuatBan).format("DD/MM/YY HH:mm")}
              </div>
            );
          },
        },

        // ── Thông tin cập nhật ──
        {
          name: "Thông tin cập nhật",
          dataField: "lastModificationTime",
          width: "150px",
          dataFormatEdit: (row: NewsItem) => {
            const ngayHienThi = row?.lastModificationTime;
            const nguoiThucHien = row?.tenNguoiCapNhat;
            return (
              <div style={{ color: "#666" }}>
                {nguoiThucHien && (
                  <div style={{ color: "#333", fontWeight: "500", marginBottom: "2px" }}>
                    {nguoiThucHien}
                  </div>
                )}
                {ngayHienThi && (
                  <div style={{ color: "#999" }}>
                    {moment(ngayHienThi).format("DD/MM/YY HH:mm")}
                  </div>
                )}
              </div>
            );
          },
        },

        // ── Trạng thái ──
        {
          name: "Trạng thái",
          dataField: "isActive",
          width: "120px",
          dataFormat: (data: NewsItem) => (
            <div className="flex flex-col gap-1.5">
              <span className={data.isActive
                ? "inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
                : "inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"}>
                {data.isActive ? "Đã xuất bản" : "Chờ xử lý"}
              </span>
              <div className="flex flex-row flex-wrap gap-1">
                {data.mucDoUuTien === 1 && (
                  <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                    Ưu tiên
                  </span>
                )}
                {data.khanCap && (
                  <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">
                    Khẩn cấp
                  </span>
                )}
              </div>
            </div>
          ),
        },

        // ── Nguồn tin ──
        {
          name: "Nguồn tin",
          dataField: "nguonTin",
          width: "100px",
          dataFormat: (data: NewsItem) => {
            if (!data.nguonTin) return <span className="text-[#94A3B8]">-</span>;
            return (
              <a
                href={String(data.nguonTin)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-gray-400 text-[12px] font-medium hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
                Xem
              </a>
            );
          },
        },
      ],
      tableStyles: {
        stripedRows: false,
        showGridlines: true,
        verticalGridlines: true,
        rowSpacing: "normal",
        softActionIcons: false,
        className: "bg-white w-full",
      },
    },
    filterTools: {
      inputPlaceholder: "Tìm kiếm bài viết...",
      softMode: true,
      components: [
        { name: "linhVuc", placeholder: "Lĩnh vực", data: dsLinhVuc },
        { name: "newsTopic", placeholder: "Chuyên đề", data: dsChuDe },
      ],
    },
    crudButtons: {
      create: {
        active: true,
        permission: "NewsContent.Default.Create",
        api: "/api/app/tin-tuc-bai-viet",
        uiConfigs: { headerText: "Thêm thông báo mới" },
        component: AddEditTinTucBaiViet,
        transform2BE: createDataForm,
        dataSource: { dsLinhVuc, dsChuDe, dsLoaiBanTin },
      },
      update: {
        active: true,
        permission: "NewsContent.Default.Update",
        api: "/api/app/tin-tuc-bai-viet",
        uiConfigs: { headerText: "Cập nhật thông báo" },
        component: AddEditTinTucBaiViet,
        transform2BE: createDataForm,
        dataSource: { dsLinhVuc, dsChuDe, dsLoaiBanTin },
      },
      delete: {
        active: true,
        api: "/api/app/tin-tuc-bai-viet",
      },
    },
  };

  return (
    <div className="">
      <Card className="border border-default-200 overflow-hidden">
        <div className="p-0 overflow-hidden">
          <DataTable metadata={metadata} />
        </div>
      </Card>
    </div>
  );
};

export default Page;