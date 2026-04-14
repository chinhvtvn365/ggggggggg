"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Chip } from "@heroui/react";
import DataTable from "@/components/layouts/admin/commons/table/DataTable";
import { DELETE_TYPE_MULTI } from "@/constants/datatable.enum";
import { proxyService } from "@/services";
import { useAppDispatch } from "@/lib/hooks";
import { showSuccess, showError } from "@/lib/features/snackbar/snackBarSlice";
import moment from "moment";
import { useSearchParams } from "next/navigation";

// Types
interface LookupOption {
  label: string;
  value: string;
  shortlabel?: string;
}

interface ChuDeTinTuc {
  id: string;
  ten: string;
  duongDan?: string;
  isActive: boolean;
  parentId?: string;
  parent?: unknown;
  level?: number;
  newsCount?: number;
  hinhAnh?: { dataUrl?: string };
  crawlEnabled?: boolean;
  crawlLastStatus?: number;
  crawlLastTime?: string;
  lastModificationTime?: string;
  creationTime?: string;
  lastModifiedName?: string;
  creatorName?: string;
}

// ── Lazy load AddEditNewsTopic (nếu component tồn tại, nếu chưa có thì tạo placeholder)
const AddEditNewsTopic = React.lazy(() =>
  import("@/components/system/menu/AddEdit").catch(() => ({
    default: () => <div className="p-4 text-gray-500">Đang cập nhật form thêm/sửa chủ đề...</div>,
  }))
);

const Page = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const loaiTinTuc = searchParams.get("LoaiTinTuc") || "";

  const [forceReload, setForceReload] = useState(false);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);
  const [dsLinhVuc, setLinhVuc] = useState<LookupOption[]>([]);
  const [dsLoaiBanTin, setLoaiBanTin] = useState<LookupOption[]>([]);
  const [dsChuDeTinTucCapCha, setDsChuDeTinTucCapCha] = useState<ChuDeTinTuc[]>([]);

  const handleContentData = (data: ChuDeTinTuc) => data;

  const createNewsTopicForm = async (data: Record<string, unknown>): Promise<FormData> => {
    const formData = new FormData();
    formData.append("ten", String(data?.ten || ""));
    formData.append("duongDan", String(data?.duongDan || ""));
    formData.append("ParentId", String(data?.parentId || ""));
    formData.append("isActive", String(data?.isActive || false));
    formData.append("LinhVucId", String(data?.linhVuc || ""));
    formData.append("LoaiTinTuc", loaiTinTuc);
    const orderVal = data?.order;
    formData.append("order", String(typeof orderVal === "number" && Number.isInteger(orderVal) ? orderVal : 0));

    // Crawl config
    const crawlFields = [
      "crawlEnabled", "crawlUrl", "crawlTheDanhSach", "crawlTieuDe",
      "crawlLinkBaiViet", "crawlImage", "crawlThoiGian", "crawlDinhDangThoiGian",
      "crawlNoiDungTomTat", "crawlNoiDung", "crawlNoiDungLoaiBo", "crawlChuKy", "crawlGhiDe",
    ];
    crawlFields.forEach((key) => formData.append(key, String(data?.[key] || "")));

    // Upload ảnh
    const hinhAnh = data?.hinhAnh;
    if (hinhAnh instanceof File) {
      try {
        const formUpload = new FormData();
        formUpload.append("files", hinhAnh);
        const res = await proxyService.post<Array<{ id: string }>>(
          "/api/app/file-upload/UploadMulti?folder=tin-tuc-chu-de",
          formUpload
        );
        if (res?.status === 200 && Array.isArray(res.data) && res.data[0]?.id) {
          formData.append("HinhAnh", res.data[0].id);
        }
      } catch (err) {
        console.error("Lỗi upload hình ảnh:", err);
      }
    }
    return formData;
  };

  const getDanhMuc = useCallback(async () => {
    const danhSachMaChucNang = ["LinhVucNongNghiep", "LoaiTinTuc"];
    const query = danhSachMaChucNang
      .map((item) => `DanhSachMaChucNang=${encodeURIComponent(item)}`)
      .join("&");
    try {
      const res = await proxyService.get<
        Record<string, Array<{ ten: string; id?: string; ma?: string; tenVietTat?: string }>>
      >(`/api/app/danh-muc/danh-sach-ma?${query}`);
      if (res?.status === 200 && res?.data) {
        setLinhVuc(
          (res.data["LinhVucNongNghiep"] || []).map((x) => ({
            label: x.ten,
            value: x.id || "",
            shortlabel: x.tenVietTat,
          }))
        );
        setLoaiBanTin(
          (res.data["LoaiTinTuc"] || []).map((x) => ({
            label: x.ten,
            value: x.ma || "",
            shortlabel: x.tenVietTat,
          }))
        );
      }
    } catch (err) {
      console.error("Lỗi fetch danh mục:", err);
    }
  }, []);

  const getNewsTopicParent = useCallback(async () => {
    try {
      const response = await proxyService.get<{ items: ChuDeTinTuc[] }>(
        `/api/app/tin-tuc-chu-de/phan-cap?IsActive=true&LoaiTinTuc=${loaiTinTuc}`
      );
      if (response?.status === 200 && response.data?.items) {
        const filteredData = response.data.items.filter(
          (item) => !item.parentId && !item.parent
        );
        setDsChuDeTinTucCapCha(filteredData);
      }
    } catch (err) {
      console.error("Lỗi fetch chủ đề cha:", err);
    }
  }, [loaiTinTuc]);

  const handleCrawlData = async (chuDeId: string) => {
    setCrawlingId(chuDeId);
    try {
      const res = await proxyService.post<{ success: boolean; message: string }>(
        `/api/app/tin-tuc-chu-de/crawl-and-save/${chuDeId}`,
        {}
      );
      if (res?.status === 200 && res?.data) {
        if (res.data.success) {
          dispatch(showSuccess({ message: res.data.message, title: "Thu thập thành công", delay: 5000 }));
        } else {
          dispatch(showError({ message: res.data.message, title: "Thu thập thất bại", delay: 5000 }));
        }
        setForceReload((prev) => !prev);
      }
    } catch (err) {
      dispatch(showError({ message: "Có lỗi xảy ra khi thu thập dữ liệu", title: "Lỗi", delay: 3000 }));
      console.error("Lỗi crawl:", err);
    } finally {
      setCrawlingId(null);
    }
  };

  useEffect(() => {
    void getDanhMuc();
    void getNewsTopicParent();
  }, [getDanhMuc, getNewsTopicParent]);

  const metadata = {
    serverSide: {
      api: "/api/app/tin-tuc-chu-de/phan-cap",
      transformStrategy: (dataBinding: ChuDeTinTuc[]) => dataBinding.map(handleContentData),
    },
    table: {
      permission: "NewsGroup.Default",
      pagination: false,
      tableStyles: { 
        softActionIcons: true,
        className: "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
        verticalGridlines: false
      },
      columns: [
        {
          name: "Ảnh",
          dataField: "hinhAnh",
          width: "96px",
          alignItems: "center",
          alignHeader: "center",
          dataFormat: (data: ChuDeTinTuc) => (
            <div className="flex gap-2 justify-center items-center">
              {data?.hinhAnh?.dataUrl ? (
                <div className="relative">
                  <Image
                    src={data.hinhAnh.dataUrl}
                    alt="Ảnh chủ đề"
                    width={80}
                    height={45}
                    className="object-cover rounded-md ring-1 ring-inset ring-black/5"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-slate-100 rounded-md ring-1 ring-inset ring-black/5 text-slate-400"
                  style={{ height: 45, width: 80 }}>
                  <i className="pi pi-image text-base" />
                </div>
              )}
            </div>
          ),
        },
        {
          name: "Tên chủ đề",
          dataField: "ten",
          filterBy: "ten",
          dataFormatEdit: (data: ChuDeTinTuc) => {
            let hierarchy = "";
            for (let i = 0; i < (data.level || 0); i++) hierarchy += "├ ";
            const isChild = data.parent !== null && data.parentId !== null;
            return (
              <div>
                <span className={`block line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors ${
                  isChild ? "font-normal text-slate-500 text-[13px]" : "font-semibold text-slate-900 text-[14px]"
                }`}>
                  {hierarchy}{data.ten}
                </span>
                {data.duongDan && (
                  <small className="block text-[12px] font-mono text-slate-500 line-clamp-1 mt-0.5">/{data.duongDan}</small>
                )}
              </div>
            );
          },
        },
        {
          name: "Trạng thái",
          dataField: "isActive",
          width: "120px",
          dataFormat: (data: ChuDeTinTuc) => (
            <div className="flex justify-center">
              {data.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  Xuất bản
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                  Tạm dừng
                </span>
              )}
            </div>
          ),
        },
        {
          name: "Cập nhật cuối",
          dataField: "lastModificationTime",
          width: "160px",
          dataFormat: (data: ChuDeTinTuc) => (
            <div>
              <div className="font-medium text-slate-700 text-[13px]">
                {data.lastModifiedName || data.creatorName || "Hệ thống"}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {data.lastModificationTime
                  ? moment(data.lastModificationTime).format("DD/MM/YYYY HH:mm")
                  : data.creationTime
                    ? moment(data.creationTime).format("DD/MM/YYYY HH:mm")
                    : ""}
              </div>
            </div>
          ),
        },
        {
          name: "Số tin",
          dataField: "newsCount",
          width: "80px",
          dataFormat: (data: ChuDeTinTuc) => (
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                (data.newsCount ?? 0) > 0
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-400"
              }`}>
                {data.newsCount || 0} bài
              </span>
            </div>
          ),
        },
        {
          name: "Crawl",
          dataField: "crawlEnabled",
          width: "160px",
          dataFormat: (data: ChuDeTinTuc) => {
            if (!data.crawlEnabled) {
              return (
                <div className="flex justify-center">
                  <Chip size="sm" className="bg-gray-300 text-gray-600">Chưa cấu hình</Chip>
                </div>
              );
            }
            const statusColor =
              data.crawlLastStatus === 0 ? "bg-green-600" :
              data.crawlLastStatus === 1 ? "bg-red-600" : "bg-blue-500";
            const statusLabel =
              data.crawlLastStatus === 0 ? "Hoạt động" :
              data.crawlLastStatus === 1 ? "Lỗi" : "Chờ chạy";
            return (
              <div className="flex flex-col gap-1 items-center">
                <Chip size="sm" className={`${statusColor} text-white font-semibold`}>{statusLabel}</Chip>
                {data.crawlLastTime && (
                  <span className="text-[10px] text-gray-400">
                    {moment(data.crawlLastTime).format("DD/MM HH:mm")}
                  </span>
                )}
               
              </div>
            );
          },
        },
      ],
    },
    filterTools: {
      inputPlaceholder: "Tìm theo chủ đề / chủ đề con",
      softMode: true,
      components: [] as LookupOption[],
    },
    crudButtons: {
      create: {
        active: true,
        permission: "NewsGroup.Default.Create",
        uiConfigs: { headerText: "Thêm chủ đề tin tức" },
        component: AddEditNewsTopic,
        dataSource: {
          LoaiTinTuc: dsLoaiBanTin,
          LinhVucNongNghiep: dsLinhVuc,
          DsChuDeTinTucCapCha: dsChuDeTinTucCapCha,
        },
        transform2BE: createNewsTopicForm,
        handleResponseData: handleContentData,
        api: "/api/app/tin-tuc-chu-de",
        callback: () => setForceReload((prev) => !prev),
      },
      update: {
        active: true,
        permission: "NewsGroup.Default.Update",
        uiConfigs: { headerText: "Cập nhật chủ đề tin tức" },
        component: AddEditNewsTopic,
        dataSource: {
          LoaiTinTuc: dsLoaiBanTin,
          LinhVucNongNghiep: dsLinhVuc,
          DsChuDeTinTucCapCha: dsChuDeTinTucCapCha,
        },
        transform2BE: createNewsTopicForm,
        handleResponseData: handleContentData,
        api: "/api/app/tin-tuc-chu-de",
        callback: () => setForceReload((prev) => !prev),
      },
      delete: {
        active: true,
        permission: "NewsGroup.Default.Delete",
        type: DELETE_TYPE_MULTI,
        api: "/api/app/tin-tuc-chu-de",
        params: "ids",
      },
    },
  };

  return (
    <div className="w-full">
      <DataTable
        metadata={metadata}
        forceReload={forceReload}
        params={{ LoaiTinTuc: loaiTinTuc }}
        rowClassNameCustom="transition-colors hover:bg-slate-50/80 group"
      />
    </div>
  );
};

export default Page;
