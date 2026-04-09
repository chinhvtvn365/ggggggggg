"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { REQUIRED } from "@/constants/datatable.enum";
import { proxyService } from "@/services";

import Textbox from "@/components/controls/Textbox";
import DropdownControl from "@/components/controls/DropdownControl";
import CalendarControl from "@/components/controls/CalendarControl";

// Utilities
const removeVietnameseTones = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

const AddEditTinTucBaiViet = ({ data, dataSource }: any) => {
  const methods = useFormContext();
  const { control, setValue, getValues } = methods;

  const isThongBao = dataSource?.MaLoaiTinTuc === "thong-bao";
  const [randomValue] = useState(() => Math.floor(Math.random() * 10000));
  const inputFile = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<string | null>(null);
  const loaiTinTucOptions = dataSource?.LoaiTinTuc || dataSource?.dsLoaiBanTin || [];
  const initialChuDeOptions = dataSource?.ChuDe || dataSource?.dsChuDe || [];

  const resolveImagePreview: any = useCallback((source: any) => {
    const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || "";
    if (!source) return null;
    const candidate = source?.hinhAnh ?? source?.HinhAnh ?? source;
    if (Array.isArray(candidate) && candidate.length > 0) {
      return resolveImagePreview(candidate[0]);
    }
    if (typeof candidate === "string") {
      return candidate.startsWith("http") || candidate.startsWith("data:") ? candidate : ASSETS_URL + candidate;
    }
    if (candidate && typeof candidate === "object") {
      const path = candidate.dataUrl || candidate.path || candidate.url || candidate.fileUrl || candidate.fullPath || candidate.link;
      if (path && (path.startsWith("data:") || path.startsWith("http"))) {
        return path;
      }
      return path ? ASSETS_URL + path : null;
    }
    return null;
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!data?.id) return;
    try {
      const res = await proxyService.get(`/api/app/tin-tuc-bai-viet/${data.id}`);
      if (res?.status === 200 && res.data) {
        Object.entries(res.data).forEach(([key, val]) => setValue(key, val));
        setValue("UuTien", res.data?.mucDoUuTien === 1);
        const previewSource = res.data?.hinhAnh ?? res.data?.HinhAnh ?? data?.hinhAnh ?? data?.HinhAnh;
        setImagePreviews(resolveImagePreview(previewSource));
      }
    } catch (err) {
      console.error(err);
    }
  }, [data, setValue, resolveImagePreview]);

  useEffect(() => {
    if (data?.id) fetchDetail();
  }, [data?.id, fetchDetail]);

  useEffect(() => {
    if (loaiTinTucOptions.length === 1 && !getValues("loaiTinTuc")) {
      setValue("loaiTinTuc", loaiTinTucOptions[0]?.value);
    }
    if (initialChuDeOptions.length > 0 && !getValues("newsTopic")) {
      setValue("newsTopic", initialChuDeOptions[0]?.value);
    }
  }, [loaiTinTucOptions, initialChuDeOptions, setValue, getValues]);

  return (
    <div className="p-2 space-y-6">
      {/* KHỐI 1: THÔNG TIN CHUNG */}
      <div>
        <h5 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2">Thông tin chung</h5>
        <div className="grid grid-cols-12 gap-x-5 gap-y-3">
          {loaiTinTucOptions.length > 1 && (
            <div className="col-span-12 md:col-span-6">
              <DropdownControl
                label="Loại tin tức"
                name="loaiTinTuc"
                options={loaiTinTucOptions}
                placeholder="Chọn loại tin tức"
                layout="horizontal"
                labelWidth="w-[30%]"
              />
            </div>
          )}

          <div className="col-span-12 md:col-span-12">
            <Textbox
              label="Tiêu đề bài viết"
              name="tieuDe"
              rules={{
                required: "Vui lòng nhập tiêu đề bài viết",
                validate: (value) => 
                  value?.trim().length >= 10 || "Tiêu đề phải có ít nhất 10 ký tự"
              }}
              layout="horizontal"
              labelWidth="w-[15%]"
              change={(e: any) => {
                const value = e.target.value;
                const slug = `${removeVietnameseTones(value.toLowerCase())}-${randomValue}`
                  .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
                
                if (!data?.id) {
                  setValue("tuKhoaSEO", value);
                  setValue("tieuDeSEO", value);
                  setValue("moTaTuKhoa", value);
                  if (!getValues("duongDanThanThien")) {
                    setValue("duongDanThanThien", slug);
                  }
                }
              }}
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Đường dẫn (Slug)"
              name="duongDanThanThien"
              rules={REQUIRED}
              layout="horizontal"
              labelWidth="w-[30%]"
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <CalendarControl
              label="Ngày xuất bản"
              name="ngayXuatBan"
              rules={REQUIRED}
              layout="horizontal"
              labelWidth="w-[30%]"
            />
          </div>

          {isThongBao && (
            <div className="col-span-12 md:col-span-6">
              <DropdownControl
                label="Chủ đề"
                name="newsTopic"
                options={initialChuDeOptions}
                rules={REQUIRED}
                placeholder="Chọn chủ đề"
                layout="horizontal"
                labelWidth="w-[30%]"
              />
            </div>
          )}
          
          <div className="col-span-12 md:col-span-6">
            <Textbox
              label="Nguồn tin"
              name="nguonTin"
              placeholder="Nhập đường link (nếu có)"
              layout="horizontal"
              labelWidth="w-[30%]"
            />
          </div>

          <div className="col-span-12 md:col-span-8">
            <Textbox
              label="Nội dung tóm tắt"
              name="noiDungTomTat"
              rules={REQUIRED}
              textAreaRow={5}
              layout="horizontal"
              labelWidth="w-[22.5%]"
            />
          </div>

          {/* UPLOAD ẢNH KHỐI LÊN BÊN PHẢI */}
          <div className="col-span-12 md:col-span-4 pl-4 border-l border-gray-200">
            <Controller
              name="hinhAnh"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col items-center">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện</label>
                  <div
                    className="relative group cursor-pointer border-2 border-dashed border-gray-300 w-full rounded-lg overflow-hidden flex items-center justify-center hover:border-blue-500 transition-colors bg-gray-50 h-[140px]"
                    onClick={() => inputFile.current?.click()}
                  >
                    {imagePreviews ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={imagePreviews} 
                          alt="Thumbnail Preview" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                           <i className="fa-solid fa-camera text-white text-2xl mb-1"></i>
                           <span className="text-white text-xs font-medium">Thay đổi ảnh</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <i className="fa-regular fa-image text-3xl mb-2"></i>
                        <span className="text-xs font-medium">Click để chọn ảnh</span>
                      </div>
                    )}
                  </div>
                  <small className="text-gray-500 text-[11px] mt-2 text-center">JPG, PNG, GIF (Tối đa 5MB)</small>
                  
                  <input
                    ref={inputFile}
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File quá lớn. Vui lòng chọn ảnh < 5MB.");
                          return;
                        }
                        setImagePreviews(URL.createObjectURL(file));
                        field.onChange(file);
                      }
                    }}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* KHỐI 2: NỘI DUNG CHI TIẾT */}
      <div>
        <h5 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2">Nội dung chi tiết</h5>
        <div className="grid grid-cols-12 gap-x-5 gap-y-3">
          <div className="col-span-12">
             <Textbox
                label=""
                name="noiDung"
                textAreaRow={12}
                placeholder="Soạn thảo nội dung bài viết vào đây..."
                rules={REQUIRED}
             />
             <small className="text-gray-500 block text-right mt-1">* Hỗ trợ nhập liệu HTML, văn bản, đường dẫn đính kèm trực tiếp.</small>
          </div>
          
       
        </div>
      </div>

      {/* KHỐI 3: TRẠNG THÁI & SEO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Setting Box */}
         <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm h-fit">
            <h6 className="font-semibold text-gray-700 uppercase mb-3 text-sm flex items-center gap-2">
               <i className="fa-solid fa-sliders text-blue-500"></i> Cài đặt trạng thái
            </h6>
            <div className="space-y-3">
              <Controller
                name="isActive"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors shadow-sm bg-white/50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Hiển thị lên Portal công khai</span>
                  </label>
                )}
              />
              <Controller
                name="UuTien"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors shadow-sm bg-white/50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Đánh dấu bài viết nổi bật ⭐</span>
                  </label>
                )}
              />
              {isThongBao && (
                <div className="ml-6 space-y-2 border-l-2 border-blue-300 pl-4 py-1">
                  <Controller
                    name="thongBao"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Dạng thông báo</span>
                      </label>
                    )}
                  />
                  <Controller
                    name="khanCap"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-bold text-red-600 tracking-wide">🚨 Tin Khẩn Cấp</span>
                      </label>
                    )}
                  />
                </div>
              )}
            </div>
         </div>

         {/* SEO Box */}
         <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm">
            <h6 className="font-semibold text-gray-700 uppercase mb-3 text-sm flex items-center gap-2">
               <i className="fa-brands fa-google text-blue-500"></i> Cài đặt SEO
            </h6>
            <div className="space-y-3">
              <Textbox
                 label="Tiêu đề SEO"
                 name="tieuDeSEO"
                 layout="vertical"
              />
              <Textbox
                 label="Từ khóa SEO"
                 name="tuKhoaSEO"
                 layout="vertical"
              />
              <Textbox
                 label="Mô tả SEO"
                 name="moTaTuKhoa"
                 textAreaRow={2}
                 layout="vertical"
              />
            </div>
         </div>
      </div>

    </div>
  );
};

export default AddEditTinTucBaiViet;
