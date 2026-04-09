"use client";

import React, { useEffect, useState } from "react";
import moment from "moment";
import Image from "next/image";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import AddEditTinTucBaiViet from "@/components/tin-tuc-bai-viet/AddEditTinTucBaiViet";
import proxyService from "@/services/proxy/proxy.service";
import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";

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
          dataFormat: (data: NewsItem) => {
            const imageSrc = getImageSource(data);
            return (
              <div className="news-image-cell flex justify-content-center">
                {imageSrc ? (
                  <div className="relative h-10 w-16 overflow-hidden rounded-md border border-slate-100 bg-slate-100 shadow-inner">
                    <Image
                      width={64}
                      height={40}
                      unoptimized
                      src={imageSrc}
                      alt="Ảnh bài viết"
                      className="h-10 w-16 object-cover"
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
                    height: "40px", width: "64px", backgroundColor: "#f1f5f9",
                    borderRadius: "6px", display: imageSrc ? "none" : "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "11px", color: "#64748b", border: "1px solid #e2e8f0",
                  }}
                >
                  <i className="pi pi-image" style={{ fontSize: "12px" }} />
                </div>
              </div>
            );
          },
        },

        // ── Tiêu đề ──
        {
          name: "Tiêu đề",
          dataField: "tieuDe",
          dataFormatEdit: (row: NewsItem) => (
            <div className="news-title-cell">
              <div
                className="text-sm font-semibold text-slate-800 hover:text-blue-700 transition-colors line-clamp-2 cursor-pointer"
                style={{ lineHeight: "1.35" } as React.CSSProperties}
              >
                {row.tieuDe}
              </div>
              {row.duongDanThanThien && (
                <div className="mt-0.5 max-w-[280px] text-[11px] text-slate-400 truncate font-mono">
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
          width: "100px",
          dataFormat: (data: NewsItem) => (
            <div className="status-badges flex flex-row flex-wrap gap-1">
              <span className={data.isActive ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" : "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"}>
                {data.isActive && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {data.isActive ? "Xuất bản" : "Ẩn"}
              </span>
              {data.mucDoUuTien === 1 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Ưu tiên
                </span>
              )}
              {data.khanCap && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  Khẩn cấp
                </span>
              )}
              {data.thongBao && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 ml-1">
                  Thông báo
                </span>
              )}
            </div>
          ),
        },

        // ── Nguồn tin ──
        {
          name: "Nguồn tin",
          dataField: "nguonTin",
          dataFormat: (data: NewsItem) => {
            if (!data.nguonTin) return <span style={{ color: "#ccc" }}>-</span>;
            return (
              <a
                href={String(data.nguonTin)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <i className="pi pi-external-link" />
                <span className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
                  Xem
                </span>
              </a>
            );
          },
        },
      ],
      unifiedToolbar: true,
      tableStyles: {
        stripedRows: false,
        showGridlines: true,
        verticalGridlines: false,
        rowSpacing: "normal",
        softActionIcons: true,
        className: "news-editorial-table rounded-xl border border-slate-200/90 bg-white",
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
        className: "inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all",
        permission: "NewsContent.Default.Create",
        api: "/api/app/tin-tuc-bai-viet",
        uiConfigs: { headerText: "Thêm bài viết" },
        component: AddEditTinTucBaiViet,
        transform2BE: createDataForm,
        dataSource: { dsLinhVuc, dsChuDe, dsLoaiBanTin },
      },
      update: {
        active: true,
        permission: "NewsContent.Default.Update",
        api: "/api/app/tin-tuc-bai-viet",
        uiConfigs: { headerText: "Cập nhật bài viết" },
        component: AddEditTinTucBaiViet,
        transform2BE: createDataForm,
        dataSource: { dsLinhVuc, dsChuDe, dsLoaiBanTin },
      },
      delete: {
        active: true,
        className: "inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all",
        type: DELETE_TYPE_MULTI,
        api: "/api/app/tin-tuc-bai-viet",
        params: "ids",
      },
    },
  };

  return (
    <div className="news-editorial-page rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <DataTable metadata={metadata} rowClassNameCustom="news-feed-row" />
    </div>
  );
};

export default Page;